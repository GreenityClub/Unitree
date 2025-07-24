import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
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
  id: string;
  name: string;
  description: string;
  stages: number;
  pointsPerStage: number;
  waterNeeds: number;
  imageUrl: string;
  count: number;
  color: string;
}

interface Tree {
  id: string;
  ownerId: string;
  ownerName: string;
  treeTypeId: string;
  treeTypeName: string;
  name: string;
  stage: number;
  health: number;
  plantedAt: string;
  lastWateredAt: string;
}

// Mock Data
const treeTypes: TreeType[] = [
  { 
    id: '1', 
    name: 'Oak', 
    description: 'Majestic oak tree', 
    stages: 6, 
    pointsPerStage: 100,
    waterNeeds: 3,
    imageUrl: '/assets/trees/oak.png',
    count: 120,
    color: '#4CAF50'
  },
  { 
    id: '2', 
    name: 'Pine', 
    description: 'Evergreen pine tree', 
    stages: 5, 
    pointsPerStage: 80,
    waterNeeds: 2,
    imageUrl: '/assets/trees/pine.png',
    count: 85,
    color: '#8BC34A'
  },
  { 
    id: '3', 
    name: 'Maple', 
    description: 'Beautiful maple tree', 
    stages: 5, 
    pointsPerStage: 90,
    waterNeeds: 4,
    imageUrl: '/assets/trees/maple.png',
    count: 65,
    color: '#CDDC39'
  },
  { 
    id: '4', 
    name: 'Birch', 
    description: 'Elegant birch tree', 
    stages: 4, 
    pointsPerStage: 70,
    waterNeeds: 3,
    imageUrl: '/assets/trees/birch.png',
    count: 48,
    color: '#FFC107'
  },
  { 
    id: '5', 
    name: 'Cedar', 
    description: 'Fragrant cedar tree', 
    stages: 6, 
    pointsPerStage: 110,
    waterNeeds: 2,
    imageUrl: '/assets/trees/cedar.png',
    count: 32,
    color: '#FF9800'
  }
];

// Generate mock trees
const generateTrees = (count: number): Tree[] => {
  return Array.from({ length: count }, (_, i) => {
    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    const plantedDate = new Date();
    plantedDate.setDate(plantedDate.getDate() - Math.floor(Math.random() * 365));
    
    const wateredDate = new Date();
    wateredDate.setDate(wateredDate.getDate() - Math.floor(Math.random() * 14));
    
    return {
      id: `tree-${i + 1}`,
      ownerId: `user-${Math.floor(Math.random() * 100) + 1}`,
      ownerName: `Student ${Math.floor(Math.random() * 100) + 1}`,
      treeTypeId: treeType.id,
      treeTypeName: treeType.name,
      name: `My ${treeType.name} ${i + 1}`,
      stage: Math.floor(Math.random() * treeType.stages) + 1,
      health: Math.floor(Math.random() * 100) + 1,
      plantedAt: plantedDate.toISOString(),
      lastWateredAt: wateredDate.toISOString()
    };
  });
};

// Monthly growth data
const monthlyTreeGrowth = [
  { month: 'Jan', trees: 25 },
  { month: 'Feb', trees: 32 },
  { month: 'Mar', trees: 40 },
  { month: 'Apr', trees: 38 },
  { month: 'May', trees: 50 },
  { month: 'Jun', trees: 55 },
  { month: 'Jul', trees: 60 }
];

const TreesPage: React.FC = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const { showToast } = useToast();

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
  const TreeStage: React.FC<{ stage: number, maxStage: number }> = ({ stage, maxStage }) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxStage }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full ${i < stage ? 'bg-green-500' : 'bg-gray-300'}`}
          ></div>
        ))}
        <span className="ml-2 text-sm font-medium">{stage}/{maxStage}</span>
      </div>
    );
  };

  // Load trees on component mount
  useEffect(() => {
    const fetchTrees = () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockTrees = generateTrees(50);
        setTrees(mockTrees);
        setIsLoading(false);
      }, 800);
    };

    fetchTrees();
  }, []);

  // Filter trees based on search term and filter
  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tree.treeTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (currentFilter === 'all') return matchesSearch;
    if (currentFilter === 'healthy') return matchesSearch && tree.health >= 70;
    if (currentFilter === 'attention') return matchesSearch && tree.health < 70 && tree.health >= 30;
    if (currentFilter === 'critical') return matchesSearch && tree.health < 30;
    
    return matchesSearch;
  });

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
                <h3 className="text-2xl font-bold">350</h3>
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
                <h3 className="text-2xl font-bold">32</h3>
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
                <h3 className="text-2xl font-bold">15</h3>
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
              <Button variant="outline" className="bg-white text-sm">View Details</Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treeTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {treeTypes.map((entry, index) => (
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
                  {filteredTrees.slice(0, 10).map((tree) => {
                    const treeType = treeTypes.find(t => t.id === tree.treeTypeId);
                    return (
                      <tr key={tree.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Icon icon={treeIcon} className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tree.name}</div>
                              <div className="text-sm text-gray-500">ID: {tree.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.ownerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.treeTypeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TreeStage stage={tree.stage} maxStage={treeType?.stages || 6} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <HealthIndicator health={tree.health} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(tree.plantedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(tree.lastWateredAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    );
                  })}
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