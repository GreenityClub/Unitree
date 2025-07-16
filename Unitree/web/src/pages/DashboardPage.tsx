import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient, { API_ENDPOINTS } from '../config/api';
import { Tree, WifiStatus, PointsBalance } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [wifiStatus, setWifiStatus] = useState<WifiStatus | null>(null);
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [treesResponse, wifiResponse, pointsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.TREE.GET_ALL),
          apiClient.get(API_ENDPOINTS.WIFI.GET_STATUS),
          apiClient.get(API_ENDPOINTS.POINTS.GET_BALANCE),
        ]);

        setTrees(treesResponse.data.trees || []);
        setWifiStatus(wifiResponse.data);
        setPointsBalance(pointsResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStartWifiSession = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.WIFI.START_SESSION);
      // Refresh wifi status
      const response = await apiClient.get(API_ENDPOINTS.WIFI.GET_STATUS);
      setWifiStatus(response.data);
    } catch (error) {
      console.error('Failed to start WiFi session:', error);
    }
  };

  const handleStopWifiSession = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.WIFI.STOP_SESSION);
      // Refresh wifi status
      const response = await apiClient.get(API_ENDPOINTS.WIFI.GET_STATUS);
      setWifiStatus(response.data);
    } catch (error) {
      console.error('Failed to stop WiFi session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.fullName}! 🌱
        </h1>
        <p className="text-green-100">
          Ready to grow some trees and earn points today?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {pointsBalance?.balance || 0}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {trees.length}
            </div>
            <div className="text-sm text-gray-600">Your Trees</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {wifiStatus?.totalSessionsToday || 0}
            </div>
            <div className="text-sm text-gray-600">WiFi Sessions Today</div>
          </div>
        </Card>
      </div>

      {/* WiFi Status */}
      <Card title="WiFi Connection">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${wifiStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {wifiStatus?.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {wifiStatus?.totalPointsToday || 0} points today
            </div>
          </div>

          {wifiStatus?.currentSession && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Active Session</p>
                  <p className="text-xs text-blue-600">
                    Started at {new Date(wifiStatus.currentSession.startTime).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleStopWifiSession}
                >
                  Stop Session
                </Button>
              </div>
            </div>
          )}

          {!wifiStatus?.currentSession && (
            <Button
              onClick={handleStartWifiSession}
              className="w-full"
              disabled={!wifiStatus?.isConnected}
            >
              Start WiFi Session
            </Button>
          )}
        </div>
      </Card>

      {/* Recent Trees */}
      <Card title="Your Trees">
        {trees.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-gray-500 mb-4">You haven't planted any trees yet</p>
            <Button onClick={() => window.location.href = '/trees'}>
              Plant Your First Tree
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {trees.slice(0, 3).map((tree) => (
              <div key={tree._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">🌳</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{tree.name}</h3>
                  <p className="text-sm text-gray-500">
                    Stage {tree.stage} • Health: {tree.health}%
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(tree.plantedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {trees.length > 3 && (
              <div className="text-center">
                <Button variant="outline" onClick={() => window.location.href = '/trees'}>
                  View All Trees
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/trees'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-2">🌳</span>
            <span className="text-sm">Plant Tree</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/points'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-2">⭐</span>
            <span className="text-sm">View Points</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/wifi'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-2">📶</span>
            <span className="text-sm">WiFi Status</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/profile'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-2">👤</span>
            <span className="text-sm">Profile</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage; 