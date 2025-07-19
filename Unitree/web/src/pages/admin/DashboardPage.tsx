import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import apiClient, { API_ENDPOINTS } from '../../config/api';

const DashboardPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTrees: 0,
    totalPoints: 0,
    activeWifiSessions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real application, you would fetch these statistics from the API
        // For now we'll just simulate it with a timeout
        setTimeout(() => {
          setStats({
            totalStudents: 150,
            totalTrees: 342,
            totalPoints: 15680,
            activeWifiSessions: 23
          });
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>
        
        {admin && (
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium">Welcome, {admin.username}!</h2>
            <p className="text-gray-600">Role: {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}</p>
            {admin.lastLogin && (
              <p className="text-gray-600">Last login: {new Date(admin.lastLogin).toLocaleString()}</p>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">Total Students</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">Total Trees</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalTrees}</p>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">Total Points</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalPoints}</p>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">Active WiFi Sessions</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeWifiSessions}</p>
              </div>
            </Card>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {admin?.permissions.manageStudents && (
              <Card>
                <a href="/admin/students" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">Manage Students</h3>
                  <p className="text-gray-600">View and manage student accounts</p>
                </a>
              </Card>
            )}
            
            {admin?.permissions.manageTrees && (
              <Card>
                <a href="/admin/trees" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">Manage Trees</h3>
                  <p className="text-gray-600">View and manage virtual trees</p>
                </a>
              </Card>
            )}
            
            {admin?.permissions.manageWifiSessions && (
              <Card>
                <a href="/admin/wifi-sessions" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">WiFi Sessions</h3>
                  <p className="text-gray-600">Monitor active WiFi sessions</p>
                </a>
              </Card>
            )}
            
            {admin?.permissions.viewStatistics && (
              <Card>
                <a href="/admin/statistics" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">Statistics</h3>
                  <p className="text-gray-600">View detailed app statistics</p>
                </a>
              </Card>
            )}
            
            {admin?.role === 'superadmin' && (
              <Card>
                <a href="/admin/admins" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">Manage Admins</h3>
                  <p className="text-gray-600">Create and manage admin accounts</p>
                </a>
              </Card>
            )}
            
            {admin?.permissions.manageTreeTypes && (
              <Card>
                <a href="/admin/tree-types" className="block p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-800">Tree Types</h3>
                  <p className="text-gray-600">Manage tree types and configurations</p>
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage; 