import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import apiClient, { API_ENDPOINTS } from '../../config/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  treeIcon, usersIcon, wifiIcon, medalIcon, 
  chartIcon, leafIcon, calendarIcon
} from '../../utils/icons';

// Types for statistics
interface DashboardStats {
  totalUsers: number;
  totalVirtualTrees: number;
  totalRealTrees: number;
  totalWifiHours: number;
  totalPointsEarned: number;
  recentUsers: Array<{
    _id: string;
    fullname: string;
    email: string;
    createdAt: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        
        // Log the current token for debugging
        console.log('Current admin token:', localStorage.getItem('adminAuthToken'));
        
        const response = await apiClient.get(API_ENDPOINTS.STATISTICS.OVERVIEW);
        
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Unitree Admin Dashboard</p>
      </div>
        
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card variant="danger" className="mb-8">
          <div className="p-4">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="primary" className="shadow-md">
            <div className="flex items-center">
              <div className="flex items-center justify-center p-3 rounded-full bg-primary-light">
                <Icon icon={usersIcon} className="text-primary text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Students</h3>
                <p className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</p>
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
                <p className="text-2xl font-bold">{formatNumber((stats?.totalVirtualTrees || 0) + (stats?.totalRealTrees || 0))}</p>
                <p className="text-xs text-gray-500">
                  Virtual: {formatNumber(stats?.totalVirtualTrees || 0)} | 
                  Real: {formatNumber(stats?.totalRealTrees || 0)}
                </p>
              </div>
            </div>
          </Card>
              
          <Card variant="tertiary" className="shadow-md">
            <div className="flex items-center">
              <div className="flex items-center justify-center p-3 rounded-full bg-tertiary-light">
                <Icon icon={wifiIcon} className="text-tertiary-dark text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">WiFi Hours</h3>
                <p className="text-2xl font-bold">{formatNumber(stats?.totalWifiHours || 0)}</p>
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
                <p className="text-2xl font-bold">{formatNumber(stats?.totalPointsEarned || 0)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!isLoading && !error && stats?.recentUsers && stats.recentUsers.length > 0 && (
        <Card variant="primary" className="mb-8">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Registrations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Registered</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

export default DashboardPage; 