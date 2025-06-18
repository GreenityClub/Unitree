const mongoose = require('mongoose');
const TreeType = require('../models/TreeType');
require('dotenv').config();

// Sample tree types data (including the user's Oak Tree example)
const treeTypesData = [
  {
    id: "oak",
    name: "Oak Tree",
    scientificName: "Quercus",
    description: "A majestic tree known for its strength and longevity.",
    careLevel: "Moderate",
    maxHeight: "20-30m",
    lifespan: "100+ years",
    nativeTo: "Northern Hemisphere",
    cost: 100,
    stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
    isActive: true
  },
  {
    id: "maple",
    name: "Maple Tree",
    scientificName: "Acer",
    description: "Beautiful deciduous trees known for their vibrant fall colors.",
    careLevel: "Easy",
    maxHeight: "15-25m",
    lifespan: "80-100 years",
    nativeTo: "Northern Temperate Regions",
    cost: 80,
    stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
    isActive: true
  },
  {
    id: "pine",
    name: "Pine Tree",
    scientificName: "Pinus",
    description: "Evergreen coniferous trees that stay green year-round.",
    careLevel: "Easy",
    maxHeight: "25-40m",
    lifespan: "100-700 years",
    nativeTo: "Northern Hemisphere",
    cost: 120,
    stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
    isActive: true
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    scientificName: "Prunus serrulata",
    description: "Ornamental tree famous for its beautiful pink and white flowers.",
    careLevel: "Moderate",
    maxHeight: "8-12m",
    lifespan: "30-40 years",
    nativeTo: "East Asia",
    cost: 150,
    stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
    isActive: true
  },
  {
    id: "willow",
    name: "Weeping Willow",
    scientificName: "Salix babylonica",
    description: "Graceful tree with drooping branches, often found near water.",
    careLevel: "Easy",
    maxHeight: "20-25m",
    lifespan: "40-75 years",
    nativeTo: "Northern China",
    cost: 90,
    stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
    isActive: true
  }
];

async function seedTreeTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unitree');
    
    console.log('Connected to MongoDB');
    
    // Clear existing tree types
    await TreeType.deleteMany({});
    console.log('Cleared existing tree types');
    
    // Insert new tree types
    const insertedTreeTypes = await TreeType.insertMany(treeTypesData);
    console.log(`Inserted ${insertedTreeTypes.length} tree types:`);
    
    insertedTreeTypes.forEach(treeType => {
      console.log(`- ${treeType.name} (${treeType.scientificName}) - ${treeType.cost} points`);
    });
    
    console.log('Tree types seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding tree types:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedTreeTypes();
}

module.exports = { seedTreeTypes, treeTypesData }; 