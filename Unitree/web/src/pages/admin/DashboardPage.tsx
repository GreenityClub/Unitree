import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  treeIcon, usersIcon, wifiIcon, medalIcon, 
  chartIcon, leafIcon, calendarIcon
} from '../../utils/icons';

// Dummy data for charts - replace with real API calls
const monthlyStats = [
  { month: 'Jan', students: 50, trees: 80, points: 1200, sessions: 120 },
  { month: 'Feb', students: 65, trees: 105, points: 1600, sessions: 150 },
  { month: 'Mar', students: 85, trees: 140, points: 2100, sessions: 190 },
  { month: 'Apr', students: 110, trees: 180, points: 2700, sessions: 230 },
  { month: 'May', students: 140, trees: 230, points: 3500, sessions: 280 },
  { month: 'Jun', students: 180, trees: 290, points: 4500, sessions: 350 },
  { month: 'Jul', students: 210, trees: 342, points: 5200, sessions: 420 }
];

const treeTypesData = [
  { name: 'Oak', value: 120, color: '#4CAF50' },
  { name: 'Pine', value: 80, color: '#8BC34A' },
  { name: 'Maple', value: 70, color: '#CDDC39' },
  { name: 'Birch', value: 50, color: '#FFC107' },
  { name: 'Cedar', value: 30, color: '#FF9800' }
];

const COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'];

const DashboardPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTrees: 0,
    totalPoints: 0,
    activeWifiSessions: 0,
    growthToday: {
      students: 0,
      trees: 0,
      points: 0,
      sessions: 0
    }
  });

  useEffect(() => {
    // Simulate fetching dashboard data
        setTimeout(() => {
          setStats({
        totalStudents: 210,
            totalTrees: 342,
        totalPoints: 5200,
        activeWifiSessions: 23,
        growthToday: {
          students: 5,
          trees: 12,
          points: 230,
          sessions: 8
        }
          });
          setIsLoading(false);
    }, 800);
  }, []);

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Unitree Admin Dashboard</p>
      </div>
        
      {/* Rest of the dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="primary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-primary-light">
              <Icon icon={usersIcon} className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Students</h3>
              <p className="text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>
        
        <Card variant="secondary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-secondary-light">
              <Icon icon={treeIcon} className="text-secondary-dark text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Trees</h3>
              <p className="text-2xl font-bold">3,872</p>
            </div>
              </div>
            </Card>
            
        <Card variant="tertiary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-tertiary-light">
              <Icon icon={wifiIcon} className="text-tertiary-dark text-xl" />
              </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Active Sessions</h3>
              <p className="text-2xl font-bold">328</p>
              </div>
          </div>
        </Card>
          
        <Card variant="accent" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-accent-light">
              <Icon icon={medalIcon} className="text-accent-dark text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Points Earned</h3>
              <p className="text-2xl font-bold">24,853</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage; 