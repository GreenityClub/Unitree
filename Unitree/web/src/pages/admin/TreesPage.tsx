import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import apiClient, { API_ENDPOINTS } from '../../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  treeIcon, leafIcon, searchIcon, filterIcon,
  waterIcon, soilIcon, sunIcon
} from '../../utils/icons';
import { format } from 'date-fns';

// Interfaces
interface TreeType {
  _id: string;
  id: string;
  name: string;
  scientificName: string;
  description: string;
  careLevel: string;
  maxHeight: string;
  lifespan: string;
  nativeTo: string;
  cost: number;
  stages: string[];
  isActive: boolean;
}

interface User {
  _id: string;
  fullname: string;
  nickname?: string;
}

interface Tree {
  _id: string;
  userId: string;
  species: string;
  name: string;
  plantedDate: string;
  lastWatered: string;
  stage: 'seedling' | 'sprout' | 'sapling' | 'young_tree' | 'mature_tree' | 'ancient_tree';
  healthScore: number;
  isDead: boolean;
  deathDate?: string;
  totalWifiTime: number;
  wifiTimeAtRedeem: number;
  createdAt: string;
  updatedAt: string;
  // These fields come from virtual properties and/or population
  user?: User;
  healthStatus?: {
    status: 'healthy' | 'unhealthy' | 'critical' | 'dead';
    healthScore: number;
    canWater: boolean;
    daysUntilDeath: number;
  };
  growthProgress?: {
    isMaxStage: boolean;
    progressPercent: number;
    hoursToNextStage: number;
  };
}

// Generate chart colors
const COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'];

// Helper function to format dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};

// Health indicator component
const HealthIndicator: React.FC<{ health: number }> = ({ health }) => {
  let color = 'bg-green-500';
  if (health < 30) color = 'bg-red-500';
  else if (health < 70) color = 'bg-yellow-500';
  
  return (
    <div className="flex items-center">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${health}%` }}
        ></div>
      </div>
      <span className="ml-2 text-sm font-medium">{health}%</span>
    </div>
  );
};

// Tree stage component
const TreeStage: React.FC<{ stage: string }> = ({ stage }) => {
  const stages = ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'];
  const stageIndex = stages.indexOf(stage);
  const maxStage = stages.length;
  
  return (
    <div className="flex items-center space-x-1">
      {stages.map((_, i) => (
        <div 
          key={i} 
          className={`w-2 h-2 rounded-full ${i <= stageIndex ? 'bg-green-500' : 'bg-gray-300'}`}
        ></div>
      ))}
      <span className="ml-2 text-sm font-medium">
        {stageIndex + 1}/{maxStage}
      </span>
    </div>
  );
};

const TreesPage: React.FC = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [treeTypes, setTreeTypes] = useState<TreeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTrees: 0,
    plantedThisMonth: 0,
    needAttention: 0
  });

  const { showToast } = useToast();

  // Load trees and tree types on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch trees
        const treesResponse = await apiClient.get(API_ENDPOINTS.TREE.ADMIN.GET_ALL);
        setTrees(treesResponse.data);
        
        // Fetch tree types
        const treeTypesResponse = await apiClient.get(API_ENDPOINTS.TREE.ADMIN.GET_TREE_TYPES);
        setTreeTypes(treeTypesResponse.data);
        
        // Calculate stats
        const allTrees = treesResponse.data;
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const totalTrees = allTrees.length;
        const plantedThisMonth = allTrees.filter(
          (tree: Tree) => new Date(tree.plantedDate) >= firstDayOfMonth
        ).length;
        const needAttention = allTrees.filter(
          (tree: Tree) => tree.healthScore < 70 && !tree.isDead
        ).length;
        
        setStats({
          totalTrees,
          plantedThisMonth,
          needAttention
        });
        
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || 'Error loading tree data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for tree types distribution chart
  const prepareTreeDistributionData = () => {
    // Count trees by species
    const speciesCounts: { [key: string]: number } = {};
    trees.forEach((tree) => {
      speciesCounts[tree.species] = (speciesCounts[tree.species] || 0) + 1;
    });
    
    // Map to chart data format with tree type names
    return Object.keys(speciesCounts).map((speciesId) => {
      const treeType = treeTypes.find(type => type.id === speciesId);
      return {
        name: treeType ? treeType.name : speciesId,
        count: speciesCounts[speciesId],
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    });
  };

  // Prepare monthly growth data
  const prepareMonthlyGrowthData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get the last 6 months
    const last6Months = Array(6).fill(0).map((_, i) => {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      return { month, year, label: monthNames[month] };
    }).reverse();
    
    // Count trees planted in each month
    return last6Months.map(({ month, year, label }) => {
      const count = trees.filter((tree) => {
        const plantedDate = new Date(tree.plantedDate);
        return plantedDate.getMonth() === month && plantedDate.getFullYear() === year;
      }).length;
      
      return { month: label, trees: count };
    });
  };

  // Filter trees based on search term and filter
  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.user?.fullname || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    if (currentFilter === 'all') return matchesSearch;
    if (currentFilter === 'healthy') return matchesSearch && tree.healthScore >= 70;
    if (currentFilter === 'attention') return matchesSearch && tree.healthScore < 70 && tree.healthScore >= 30;
    if (currentFilter === 'critical') return matchesSearch && tree.healthScore < 30;
    
    return matchesSearch;
  });

  const treeDistributionData = prepareTreeDistributionData();
  const monthlyTreeGrowth = prepareMonthlyGrowthData();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tree Management</h1>
        <p className="text-gray-600">Manage and monitor all virtual trees</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Trees</p>
                <h3 className="text-2xl font-bold">{stats.totalTrees}</h3>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Icon icon={treeIcon} className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Planted This Month</p>
                <h3 className="text-2xl font-bold">{stats.plantedThisMonth}</h3>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Icon icon={leafIcon} className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Need Attention</p>
                <h3 className="text-2xl font-bold">{stats.needAttention}</h3>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Icon icon={waterIcon} className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tree Types Distribution */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Tree Types Distribution</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {treeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} trees`, 'Quantity']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Monthly Growth */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Monthly Tree Growth</h3>
              <div className="text-sm text-gray-500">Last 6 months</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTreeGrowth}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="trees" name="Trees Planted" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Trees List */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h3 className="text-lg font-bold text-gray-800">Trees List</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search trees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={currentFilter === 'all' ? 'primary' : 'outline'}
                  className={currentFilter === 'all' ? 'bg-blue-600' : 'bg-white'}
                  onClick={() => setCurrentFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={currentFilter === 'healthy' ? 'primary' : 'outline'}
                  className={currentFilter === 'healthy' ? 'bg-green-600' : 'bg-white'}
                  onClick={() => setCurrentFilter('healthy')}
                >
                  Healthy
                </Button>
                <Button 
                  variant={currentFilter === 'attention' ? 'primary' : 'outline'}
                  className={currentFilter === 'attention' ? 'bg-yellow-600 text-white' : 'bg-white'}
                  onClick={() => setCurrentFilter('attention')}
                >
                  Needs Attention
                </Button>
                <Button 
                  variant={currentFilter === 'critical' ? 'primary' : 'outline'}
                  className={currentFilter === 'critical' ? 'bg-red-600' : 'bg-white'}
                  onClick={() => setCurrentFilter('critical')}
                >
                  Critical
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tree</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planted</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Watered</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No trees found
                      </td>
                    </tr>
                  ) : (
                    filteredTrees.slice(0, 10).map((tree) => {
                      const treeType = treeTypes.find(t => t.id === tree.species);
                      return (
                        <tr key={tree._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Icon icon={treeIcon} className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{tree.name}</div>
                                <div className="text-sm text-gray-500">ID: {tree._id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tree.user?.fullname || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {treeType?.name || tree.species}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TreeStage stage={tree.stage} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <HealthIndicator health={tree.healthScore} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(tree.plantedDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(tree.lastWatered)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </AdminLayout>
  );
};

export default TreesPage; 