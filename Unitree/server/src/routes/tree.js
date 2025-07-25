const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const Tree = require('../models/Tree');
const RealTree = require('../models/RealTree');
const TreeType = require('../models/TreeType');
const User = require('../models/User');
const Student = require('../models/Student');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// =================================================================
// ==                      MOBILE-ONLY APIS                     ==
// =================================================================

// @route   GET /api/trees/species
// @desc    Get all available tree species for users to choose from
// @access  Private (Mobile)
router.get('/species', auth, async (req, res) => {
  try {
    // console.log('Fetching tree species...');
    const treeTypes = await TreeType.getActiveTreeTypes();
    // console.log('Found tree types:', treeTypes.length);
    // console.log('Tree types data:', treeTypes);
    const species = treeTypes.map(treeType => treeType.getDisplayInfo());
    // console.log('Mapped species:', species);
    res.json(species);
  } catch (error) {
    console.error('Get tree species error details:', error);
    logger.error('Get tree species error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/trees/species/:id
// @desc    Get details of a single tree species
// @access  Private (Mobile)
router.get('/species/:id', auth, async (req, res) => {
  try {
    const treeType = await TreeType.findByTreeId(req.params.id);
    if (!treeType) {
      return res.status(404).json({ message: 'Tree species not found' });
    }
    res.json(treeType.getDisplayInfo());
  } catch (error) {
    logger.error('Get tree species by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/trees/redeem
// @desc    Redeem points for a new virtual or real tree
// @access  Private (Mobile)
router.post('/redeem', auth, async (req, res) => {
  try {
    const { speciesId, treeType = 'virtual', location, treeSpecie } = req.body;
    
    logger.debug('Tree redemption request', { 
      userId: req.user._id, 
      speciesId: req.body.speciesId,
      treeType 
    });
    
    // Get user from auth middleware
    const user = req.user;

    if (treeType === 'real') {
      // Real tree redemption logic
      if (!location || !treeSpecie) {
        return res.status(400).json({ 
          message: 'Location and tree species are required for real tree redemption' 
        });
      }

      // Get user's student information
      const student = await Student.findOne({ email: { $regex: new RegExp(user.email, 'i') } });
      if (!student) {
        return res.status(400).json({ 
          message: 'Student information not found. Please contact admin.' 
        });
      }

      // Fixed cost for real trees (could be configurable)
      const REAL_TREE_COST = 500; // Higher cost for real trees
      
      logger.debug('Real tree redemption validation', { 
        userPoints: user.points, 
        realTreeCost: REAL_TREE_COST 
      });

      if (user.points < REAL_TREE_COST) {
        return res.status(400).json({ 
          message: `Insufficient points. You need ${REAL_TREE_COST} points but have ${user.points}.` 
        });
      }

      // Create new real tree
      const realTree = new RealTree({
        userId: user._id,
        studentId: student.student_id,
        treeSpecie: treeSpecie,
        plantedDate: new Date(),
        location: location,
        stage: 'planted',
        pointsCost: REAL_TREE_COST
      });

      logger.debug('Creating real tree', { 
        userId: realTree.userId, 
        studentId: realTree.studentId,
        treeSpecie: realTree.treeSpecie 
      });

      // Save the real tree
      try {
        await realTree.save();
        logger.info('Real tree saved successfully', {
          treeId: realTree._id,
          userId: realTree.userId,
          studentId: realTree.studentId
        });
      } catch (saveError) {
        logger.error('Real tree save error:', saveError);
        return res.status(400).json({ 
          message: 'Failed to save real tree',
          error: saveError.message
        });
      }

      // Create point transaction for real tree
      const pointTransaction = new Point({
        userId: user._id,
        amount: -REAL_TREE_COST,
        type: 'REAL_TREE_REDEMPTION',
        metadata: {
          realTreeId: realTree._id,
          studentId: student.student_id,
          treeSpecie: treeSpecie,
          location: location
        }
      });

      // Save the transaction
      try {
        await pointTransaction.save();
      } catch (transactionError) {
        await RealTree.findByIdAndDelete(realTree._id);
        logger.error('Point transaction error:', transactionError);
        return res.status(400).json({ 
          message: 'Failed to create point transaction',
          error: transactionError.message
        });
      }

      // Update user points
      try {
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            $inc: { 
              points: -REAL_TREE_COST,
              treesPlanted: 1,
              realTreesPlanted: 1
            },
            $push: { 
              realTrees: realTree._id 
            }
          },
          { new: true, runValidators: true }
        );

        res.json({
          success: true,
          message: 'Real tree redeemed successfully',
          treeType: 'real',
          realTree: realTree.getDisplayInfo(),
          transaction: {
            _id: pointTransaction._id,
            amount: pointTransaction.amount,
            type: pointTransaction.type
          },
          remainingPoints: updatedUser.points,
          user: {
            points: updatedUser.points,
            treesPlanted: updatedUser.treesPlanted,
            virtualTreesPlanted: updatedUser.virtualTreesPlanted,
            realTreesPlanted: updatedUser.realTreesPlanted
          }
        });

      } catch (userError) {
        await RealTree.findByIdAndDelete(realTree._id);
        await Point.findByIdAndDelete(pointTransaction._id);
        logger.error('User update error:', userError);
        return res.status(400).json({ 
          message: 'Failed to update user points',
          error: userError.message
        });
      }

    } else {
      // Virtual tree redemption logic (existing)
      
      // Validate species ID
      if (!speciesId) {
        return res.status(400).json({ message: 'Species ID is required' });
      }

      // Get and validate tree species
      const treeTypeData = await TreeType.findByTreeId(speciesId);
      if (!treeTypeData) {
        return res.status(400).json({ message: 'Invalid tree species selected' });
      }

      logger.debug('Virtual tree redemption validation', { 
        userPoints: user.points, 
        treeCost: treeTypeData.cost,
        species: speciesId 
      });

      // Check if user has enough points (use cost from tree species)
      const TREE_COST = treeTypeData.cost;
      if (user.points < TREE_COST) {
        return res.status(400).json({ 
          message: `Insufficient points. You need ${TREE_COST} points but have ${user.points}.` 
        });
      }

      // Create new tree with wifi time baseline
      const tree = new Tree({
        userId: user._id,
        species: speciesId,
        name: treeTypeData.name,
        plantedDate: new Date(),
        lastWatered: new Date(),
        healthScore: 100,
        stage: 'seedling',
        wifiTimeAtRedeem: user.totalTimeConnected || 0, // Set baseline wifi time when tree is redeemed
        location: {
          latitude: 0,
          longitude: 0
        }
      });

      logger.debug('Creating virtual tree', { 
        userId: tree.userId, 
        species: tree.species,
        wifiTimeAtRedeem: tree.wifiTimeAtRedeem 
      });

      // Save the tree first
      try {
        await tree.save();
        logger.info('Virtual tree saved successfully', {
          treeId: tree._id,
          userId: tree.userId,
          species: tree.species
        });
      } catch (saveError) {
        logger.error('Tree save error:', saveError);
        return res.status(400).json({ 
          message: 'Failed to save tree',
          error: saveError.message,
          validationErrors: saveError.errors
        });
      }

      // Create point transaction
      const pointTransaction = new Point({
        userId: user._id,
        amount: -TREE_COST,
        type: 'TREE_REDEMPTION',
        metadata: {
          treeId: tree._id,
          species: speciesId,
          speciesName: treeTypeData.name,
          scientificName: treeTypeData.scientificName
        }
      });

      logger.debug('Creating point transaction', { 
        userId: pointTransaction.userId, 
        amount: pointTransaction.amount 
      });

      // Save the transaction
      try {
        await pointTransaction.save();
        logger.info('Point transaction saved successfully', {
          transactionId: pointTransaction._id,
          amount: pointTransaction.amount,
          userId: pointTransaction.userId
        });
      } catch (transactionError) {
        // If transaction fails, delete the tree we just created
        await Tree.findByIdAndDelete(tree._id);
        logger.error('Point transaction error:', transactionError);
        return res.status(400).json({ 
          message: 'Failed to create point transaction',
          error: transactionError.message,
          validationErrors: transactionError.errors
        });
      }

      // Update user in database
      try {
        logger.debug('Updating user after tree redemption', {
          userId: user._id,
          currentPoints: user.points,
          treeCost: TREE_COST
        });

        // Update user in the database directly using atomic operations
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            $inc: { 
              points: -TREE_COST,
              treesPlanted: 1,
              virtualTreesPlanted: 1
            },
            $push: { 
              trees: tree._id 
            }
          },
          { 
            new: true, 
            runValidators: true 
          }
        );

        if (!updatedUser) {
          throw new Error('User not found during update');
        }

        logger.info('User updated successfully after tree redemption', {
          userId: updatedUser._id,
          newPoints: updatedUser.points,
          newTreesPlanted: updatedUser.treesPlanted
        });

        // Update the local user object to match the database
        user.points = updatedUser.points;
        user.treesPlanted = updatedUser.treesPlanted;
        user.trees = updatedUser.trees;

        // Get initial tree status
        const growthProgress = tree.growthProgress;
        const healthStatus = tree.healthStatus;

        // Send success response with complete information
        res.json({
          success: true,
          message: 'Tree redeemed successfully',
          treeType: 'virtual',
          tree: {
            _id: tree._id,
            species: tree.species,
            name: tree.name,
            stage: tree.stage,
            healthScore: tree.healthScore,
            plantedDate: tree.plantedDate,
            lastWatered: tree.lastWatered,
            wifiTimeAtRedeem: tree.wifiTimeAtRedeem,
            totalWifiTime: tree.totalWifiTime,
            growthProgress,
            healthStatus
          },
          transaction: {
            _id: pointTransaction._id,
            amount: pointTransaction.amount,
            type: pointTransaction.type
          },
          remainingPoints: updatedUser.points,
          user: {
            points: updatedUser.points,
            treesPlanted: updatedUser.treesPlanted,
            virtualTreesPlanted: updatedUser.virtualTreesPlanted,
            realTreesPlanted: updatedUser.realTreesPlanted
          }
        });

      } catch (userError) {
        logger.error('User update error during tree redemption', {
          userId: user._id,
          error: userError.message
        });

        // If user update fails, delete the tree and transaction
        await Tree.findByIdAndDelete(tree._id);
        await Point.findByIdAndDelete(pointTransaction._id);
        
        logger.error('User update error:', userError);
        return res.status(400).json({ 
          message: 'Failed to update user points',
          error: userError.message,
          validationErrors: userError.errors
        });
      }
    }
  } catch (error) {
    logger.error('Tree redemption error:', error);
    res.status(500).json({ 
      message: error.message || 'Error redeeming tree',
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
});

// @route   GET /api/trees
// @desc    Get all of the current user's virtual trees
// @access  Private (Mobile)
router.get('/', auth, async (req, res) => {
  try {
    // Check if the user exists and has a valid trees array
    const user = await User.findById(req.user._id).select('treesPlanted virtualTreesPlanted trees');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all trees for this user
    const trees = await Tree.find({ userId: req.user._id });
    
    if (!trees || trees.length === 0) {
      logger.info(`No trees found for user ${req.user._id}`);
      return res.json([]);
    }
    
    logger.info(`Found ${trees.length} trees for user ${req.user._id}, reported treesPlanted: ${user.treesPlanted}, virtualTreesPlanted: ${user.virtualTreesPlanted}`);

    // Fix potential data inconsistency between user document and tree count
    if (user.virtualTreesPlanted !== trees.length) {
      logger.warn(`Data inconsistency detected for user ${req.user._id}: virtualTreesPlanted=${user.virtualTreesPlanted}, actual tree count=${trees.length}. Fixing...`);
      
      // Update user's virtualTreesPlanted and total treesPlanted counts
      const realTreeCount = user.treesPlanted - user.virtualTreesPlanted || 0;
      await User.findByIdAndUpdate(req.user._id, {
        virtualTreesPlanted: trees.length,
        treesPlanted: trees.length + realTreeCount
      });
      
      logger.info(`User tree counts updated: virtualTreesPlanted=${trees.length}, treesPlanted=${trees.length + realTreeCount}`);
    }
    
    // Update each tree's status in real-time
    const updatedTrees = await Promise.all(
      trees.map(async (tree) => {
        try {
          await tree.updateStage();
          tree.updateHealthScore();
          await tree.save();
          return {
            ...tree.toObject(),
            growthProgress: tree.growthProgress,
            healthStatus: tree.healthStatus
          };
        } catch (treeError) {
          logger.error(`Error processing tree ${tree._id} for user ${req.user._id}:`, treeError);
          // Return the tree without the calculated properties as fallback
          return {
            ...tree.toObject(),
            growthProgress: 0,
            healthStatus: 'unknown',
            _hasError: true
          };
        }
      })
    );
    
    res.json(updatedTrees);
  } catch (error) {
    logger.error(`Error fetching trees for user ${req.user?._id}:`, error);
    res.status(500).json({ message: 'Error fetching trees', error: error.message });
  }
});

// @route   GET /api/trees/real
// @desc    Get all of the current user's real trees
// @access  Private (Mobile)
router.get('/real', auth, async (req, res) => {
  try {
    const realTrees = await RealTree.findByUser(req.user._id);
    res.json(realTrees || []);
  } catch (error) {
    logger.warn('Real tree fetch error, returning empty array:', error.message);
    logger.error('Real tree fetch error:', error);
    // For real trees, if there's an error (like collection doesn't exist),
    // return empty array instead of error to avoid client-side errors
    res.json([]);
  }
});

// @route   GET /api/trees/:id
// @desc    Get a specific virtual tree for the current user
// @access  Private (Mobile)
router.get('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tree) {
      logger.warn(`Tree ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ message: 'Tree not found' });
    }
    
    logger.info(`Fetching tree details for tree ${tree._id}, species: ${tree.species}, stage: ${tree.stage}`);
    
    // Update tree status in real-time
    try {
      await tree.updateStage();
      tree.updateHealthScore();
      await tree.save();
      
      const treeData = {
        ...tree.toObject(),
        growthProgress: tree.growthProgress,
        healthStatus: tree.healthStatus
      };
      
      res.json(treeData);
    } catch (updateError) {
      logger.error(`Error updating tree status for tree ${tree._id}:`, updateError);
      
      // Return the tree anyway, but without calculated properties
      res.json({
        ...tree.toObject(),
        growthProgress: 0,
        healthStatus: 'unknown',
        _updateError: true
      });
    }
  } catch (error) {
    logger.error(`Error fetching tree ${req.params.id} for user ${req.user?._id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching tree', 
      error: error.message,
      treeId: req.params.id
    });
  }
});

// @route   POST /api/trees/:id/water
// @desc    Water a specific virtual tree
// @access  Private (Mobile)
router.post('/:id/water', auth, async (req, res) => {
  try {
    const tree = await Tree.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    const waterResult = tree.water();
    if (!waterResult.success) {
      return res.status(400).json({ message: waterResult.message });
    }

    await tree.save();
    
    res.json({
      success: true,
      message: waterResult.message,
      tree: {
        ...tree.toObject(),
        growthProgress: tree.growthProgress,
        healthStatus: tree.healthStatus
      }
    });
  } catch (error) {
    console.error('Error watering tree:', error);
    res.status(500).json({ message: 'Error watering tree' });
  }
});

// =================================================================
// ==                     ADMIN-ONLY APIS                       ==
// =================================================================

// @route   GET /api/trees/admin/all
// @desc    Get all virtual trees from all users (for admin)
// @access  Private (Admin)
router.get('/admin/all', authAdmin, async (req, res) => {
  try {
    const trees = await Tree.find().populate('userId', 'fullname nickname');
    res.json(trees);
  } catch (error) {
    logger.error('Admin get all trees error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/trees/admin/realtrees
// @desc    Get all real trees from all users (for admin)
// @access  Private (Admin)
router.get('/admin/realtrees', authAdmin, async (req, res) => {
  try {
    const realTrees = await RealTree.find().populate('userId', 'fullname nickname');
    res.json(realTrees);
  } catch (error) {
    logger.error('Admin get all real trees error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/trees/admin/treetypes
// @desc    Get all tree types (for admin)
// @access  Private (Admin)
router.get('/admin/treetypes', authAdmin, async (req, res) => {
  try {
    const treeTypes = await TreeType.find();
    res.json(treeTypes);
  } catch (error) {
    logger.error('Admin get all tree types error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/trees/admin/treetypes
// @desc    Create a new tree type (for admin)
// @access  Private (Admin)
router.post('/admin/treetypes', authAdmin, async (req, res) => {
  try {
    const newTreeType = new TreeType(req.body);
    await newTreeType.save();
    res.status(201).json(newTreeType);
  } catch (error) {
    logger.error('Admin create tree type error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/trees/admin/treetypes/:id
// @desc    Update a tree type (for admin)
// @access  Private (Admin)
router.put('/admin/treetypes/:id', authAdmin, async (req, res) => {
  try {
    const updatedTreeType = await TreeType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTreeType) {
      return res.status(404).json({ message: 'Tree type not found' });
    }
    res.json(updatedTreeType);
  } catch (error) {
    logger.error('Admin update tree type error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/trees/admin/treetypes/:id
// @desc    Delete a tree type (for admin)
// @access  Private (Admin)
router.delete('/admin/treetypes/:id', authAdmin, async (req, res) => {
  try {
    const deletedTreeType = await TreeType.findByIdAndDelete(req.params.id);
    if (!deletedTreeType) {
      return res.status(404).json({ message: 'Tree type not found' });
    }
    res.json({ message: 'Tree type deleted successfully' });
  } catch (error) {
    logger.error('Admin delete tree type error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// =================================================================
// ==                  DEPRECATED/UNUSED APIS                   ==
// =================================================================

// Note: The following routes were identified as potentially deprecated or unused.
// Please verify they are no longer needed before deleting them manually.

// @route   GET /api/trees/types
// @desc    (DEPRECATED) Get all available tree types (legacy)
// @access  Private
router.get('/types', auth, async (req, res) => {
  try {
    const types = await Tree.distinct('species');
    res.json(types);
  } catch (error) {
    logger.error('Get tree types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/trees/purchase
// @desc    (DEPRECATED) Purchase a tree (replaced by /redeem)
// @access  Private
router.post('/purchase', auth, async (req, res) => {
  try {
    const { species } = req.body;
    const user = req.user;

    if (user.points < process.env.TREE_COST) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Create new tree
    const tree = new Tree({
      userId: user._id,
      species,
      stage: 'seedling',
      healthScore: 100,
      plantedDate: new Date(),
      wifiTimeAtRedeem: user.totalTimeConnected || 0, // Set baseline wifi time
    });

    await tree.save();

    // Deduct points from user
    user.points -= process.env.TREE_COST;
    user.trees.push(tree._id);
    await user.save();

    res.json(tree);
  } catch (error) {
    logger.error('Purchase tree error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/trees
// @desc    (DEPRECATED) Create a new tree (replaced by /redeem)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const tree = new Tree({
      ...req.body,
      userId: req.user._id,
      plantedDate: new Date(),
      lastWatered: new Date(),
      healthScore: 100,
      stage: 'seedling',
      wifiTimeAtRedeem: req.user.totalTimeConnected || 0, // Set baseline wifi time
    });
    await tree.save();
    res.status(201).json(tree);
  } catch (error) {
    console.error('Error creating tree:', error);
    res.status(500).json({ message: 'Error creating tree' });
  }
});

// @route   PUT /api/trees/:id
// @desc    (DEPRECATED) Update a tree (specific updates are preferred)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }
    res.json(tree);
  } catch (error) {
    console.error('Error updating tree:', error);
    res.status(500).json({ message: 'Error updating tree' });
  }
});

// @route   DELETE /api/trees/:id
// @desc    (DEPRECATED) Delete a tree (users should not be able to delete trees)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }
    res.json({ message: 'Tree deleted successfully' });
  } catch (error) {
    console.error('Error deleting tree:', error);
    res.status(500).json({ message: 'Error deleting tree' });
  }
});

module.exports = router;

// =================================================================
// ==                MANUAL DELETION CHECKLIST                ==
// =================================================================
// The following routes were identified as potentially deprecated or unused.
// Please verify they are no longer needed before deleting them manually.
// 1. GET /api/trees/types
// 2. POST /api/trees/purchase
// 3. POST /api/trees/
// 4. PUT /api/trees/:id
// 5. DELETE /api/trees/:id
// =================================================================