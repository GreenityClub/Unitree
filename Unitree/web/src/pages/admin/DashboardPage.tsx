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

interface WifiHoursStats {
  totalHours: number;
  sessionCount: number;
  avgSessionDuration: number;
  byDayOfWeek: Array<{
    day: string;
    hours: number;
    sessions: number;
  }>;
  topUsers: Array<{
    userId: string;
    fullname: string;
    email: string;
    hours: number;
    sessions: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    hours: number;
    sessions: number;
  }>;
}

interface PointsEarnedStats {
  totalPointsEarned: number;
  totalTransactions: number;
  avgPointsPerTransaction: number;
  byType: Array<{
    type: string;
    points: number;
    count: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId: string;
    fullname: string;
    email: string;
    points: number;
    transactions: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    points: number;
    transactions: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const DashboardPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wifiStats, setWifiStats] = useState<WifiHoursStats | null>(null);
  const [pointsStats, setPointsStats] = useState<PointsEarnedStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'wifi' | 'points'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [overviewResponse, wifiResponse, pointsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.STATISTICS.OVERVIEW),
          apiClient.get(API_ENDPOINTS.STATISTICS.WIFI_HOURS),
          apiClient.get(API_ENDPOINTS.STATISTICS.POINTS_EARNED)
        ]);
        
        setStats(overviewResponse.data);
        setWifiStats(wifiResponse.data);
        setPointsStats(pointsResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
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
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card variant="primary" className="shadow-md" rounded="xl">
              <div className="flex items-center p-4">
                <div className="flex items-center justify-center p-3 rounded-full bg-primary-light">
                  <Icon icon={usersIcon} className="text-primary text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Students</h3>
                  <p className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</p>
                </div>
              </div>
            </Card>
            
            <Card variant="secondary" className="shadow-md" rounded="xl">
              <div className="flex items-center p-4">
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
                
            <Card variant="tertiary" className="shadow-md cursor-pointer" rounded="xl" onClick={() => setActiveTab('wifi')}>
              <div className="flex items-center p-4">
                <div className="flex items-center justify-center p-3 rounded-full bg-tertiary-light">
                  <Icon icon={wifiIcon} className="text-tertiary-dark text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">WiFi Hours</h3>
                  <p className="text-2xl font-bold">{formatNumber(stats?.totalWifiHours || 0)}</p>
                </div>
              </div>
            </Card>
              
            <Card variant="accent" className="shadow-md cursor-pointer" rounded="xl" onClick={() => setActiveTab('points')}>
              <div className="flex items-center p-4">
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

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2 px-4 mr-2 font-medium text-sm ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`py-2 px-4 mr-2 font-medium text-sm ${activeTab === 'wifi' ? 'border-b-2 border-tertiary text-tertiary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('wifi')}
              >
                WiFi Details
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${activeTab === 'points' ? 'border-b-2 border-accent text-accent' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('points')}
              >
                Points Details
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {stats?.recentUsers && stats.recentUsers.length > 0 && (
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
            </>
          )}

          {activeTab === 'wifi' && wifiStats && (
            <>
              {/* WiFi Statistics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card variant="tertiary" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Total WiFi Hours</h3>
                    <p className="text-3xl font-bold">{formatNumber(wifiStats.totalHours)}</p>
                  </div>
                </Card>
                <Card variant="tertiary" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Total Sessions</h3>
                    <p className="text-3xl font-bold">{formatNumber(wifiStats.sessionCount)}</p>
                  </div>
                </Card>
                <Card variant="tertiary" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Avg. Session Duration</h3>
                    <p className="text-3xl font-bold">{wifiStats.avgSessionDuration.toFixed(2)} hrs</p>
                  </div>
                </Card>
              </div>

              {/* WiFi Usage by Day of Week */}
              <Card variant="tertiary" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">WiFi Usage by Day of Week</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={wifiStats.byDayOfWeek}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="sessions" name="Sessions" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Monthly WiFi Trend */}
              <Card variant="tertiary" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Monthly WiFi Usage Trend</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={wifiStats.monthlyTrend}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="hours" name="Hours" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Top WiFi Users */}
              <Card variant="tertiary" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Top WiFi Users</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-tertiary-light">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hours</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sessions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wifiStats.topUsers.map((user) => (
                          <tr key={user.userId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullname}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.hours}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.sessions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'points' && pointsStats && (
            <>
              {/* Points Statistics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card variant="accent" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Total Points Earned</h3>
                    <p className="text-3xl font-bold">{formatNumber(pointsStats.totalPointsEarned)}</p>
                  </div>
                </Card>
                <Card variant="accent" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Total Transactions</h3>
                    <p className="text-3xl font-bold">{formatNumber(pointsStats.totalTransactions)}</p>
                  </div>
                </Card>
                <Card variant="accent" className="shadow-md">
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm">Avg. Points/Transaction</h3>
                    <p className="text-3xl font-bold">{pointsStats.avgPointsPerTransaction.toFixed(2)}</p>
                  </div>
                </Card>
              </div>

              {/* Points by Type */}
              <Card variant="accent" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Points by Type</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pointsStats.byType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="points"
                            nameKey="type"
                            label={({ name, percent }) => `${name}: ${(percent || 0 * 100).toFixed(0)}%`}
                          >
                            {pointsStats.byType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} points`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-y-auto h-72">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-accent-light">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pointsStats.byType.map((type, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(type.points)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(type.count)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Monthly Points Trend */}
              <Card variant="accent" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Monthly Points Trend</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={pointsStats.monthlyTrend}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#FF8042" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="points" name="Points" stroke="#FF8042" fill="#FF8042" fillOpacity={0.3} />
                        <Area yAxisId="right" type="monotone" dataKey="transactions" name="Transactions" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Top Point Earners */}
              <Card variant="accent" className="mb-8">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Top Point Earners</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-accent-light">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Points</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Transactions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pointsStats.topUsers.map((user) => (
                          <tr key={user.userId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullname}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.points)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.transactions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default DashboardPage; 