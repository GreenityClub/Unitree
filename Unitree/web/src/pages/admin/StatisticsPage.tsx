import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/Layout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Icon from "../../components/ui/Icon";
import {
  chartIcon,
  userIcon,
  treeIcon,
  medalIcon,
  wifiIcon,
  calendarIcon,
  filterIcon,
  downloadIcon,
} from "../../utils/icons";
import { useToast } from "../../contexts/ToastContext";
import apiClient from "../../config/api";
import { API_ENDPOINTS } from "../../config/api";

// Define interface for the statistics data
interface OverviewStats {
  totalUsers: number;
  totalVirtualTrees: number;
  totalRealTrees: number;
  totalWifiHours: number;
  totalPointsEarned: number;
  recentUsers: any[];
}

interface MonthlyData {
  month: string;
  year: number;
  students: number;
  trees: number;
  points: number;
  sessions: number;
  hours: number;
}

interface TreeTypeData {
  name: string;
  value: number;
  color?: string;
}

interface ActivityData {
  hour: string;
  active: number;
}

interface PointsSourceData {
  name: string;
  value: number;
}

interface DailySessionData {
  date: string;
  sessions: number;
}

const COLORS = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#F44336", "#E91E63", "#9C27B0"];

const StatisticsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [selectedMetric, setSelectedMetric] = useState<"students" | "trees" | "points" | "sessions">("points");
  
  // State for API data
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [treeTypesData, setTreeTypesData] = useState<TreeTypeData[]>([]);
  const [userActivityData, setUserActivityData] = useState<ActivityData[]>([]);
  const [pointsSourceData, setPointsSourceData] = useState<PointsSourceData[]>([]);
  const [dailySessionsData, setDailySessionsData] = useState<DailySessionData[]>([]);
  
  // Error states
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [treeTypesError, setTreeTypesError] = useState<string | null>(null);
  const [userActivityError, setUserActivityError] = useState<string | null>(null);
  const [pointsSourceError, setPointsSourceError] = useState<string | null>(null);
  const [dailySessionsError, setDailySessionsError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  // Fetch all statistics data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch additional data when time range changes
  useEffect(() => {
    fetchMonthlyData();
  }, [timeRange]);

  // Main function to fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchOverviewData(),
        fetchMonthlyData(),
        fetchTreeTypesData(),
        fetchUserActivityData(),
        fetchPointsSourceData(),
        fetchDailySessionsData()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Individual fetch functions
  const fetchOverviewData = async () => {
    try {
      setOverviewError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.OVERVIEW);
      setOverviewStats(response.data);
    } catch (error: any) {
      setOverviewError('Failed to load overview statistics');
      console.error('Error fetching overview statistics:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      setMonthlyError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.MONTHLY, {
        params: { timeRange }
      });
      setMonthlyData(response.data);
    } catch (error: any) {
      setMonthlyError('Failed to load monthly statistics');
      console.error('Error fetching monthly statistics:', error);
    }
  };

  const fetchTreeTypesData = async () => {
    try {
      setTreeTypesError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.TREE_TYPES);
      // Add colors to the tree types data
      const dataWithColors = response.data.map((item: TreeTypeData, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
      }));
      setTreeTypesData(dataWithColors);
    } catch (error: any) {
      setTreeTypesError('Failed to load tree types statistics');
      console.error('Error fetching tree types statistics:', error);
    }
  };

  const fetchUserActivityData = async () => {
    try {
      setUserActivityError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.USER_ACTIVITY);
      setUserActivityData(response.data);
    } catch (error: any) {
      setUserActivityError('Failed to load user activity statistics');
      console.error('Error fetching user activity statistics:', error);
    }
  };

  const fetchPointsSourceData = async () => {
    try {
      setPointsSourceError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.POINTS_DISTRIBUTION);
      setPointsSourceData(response.data);
    } catch (error: any) {
      setPointsSourceError('Failed to load points distribution statistics');
      console.error('Error fetching points distribution statistics:', error);
    }
  };

  const fetchDailySessionsData = async () => {
    try {
      setDailySessionsError(null);
      const response = await apiClient.get(API_ENDPOINTS.STATISTICS.DAILY_SESSIONS);
      setDailySessionsData(response.data);
    } catch (error: any) {
      setDailySessionsError('Failed to load daily sessions statistics');
      console.error('Error fetching daily sessions statistics:', error);
    }
  };

  const handleTimeRangeChange = (range: "week" | "month" | "year") => {
    setTimeRange(range);
  };

  const handleMetricChange = (
    metric: "students" | "trees" | "points" | "sessions",
  ) => {
    setSelectedMetric(metric);
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex justify-center items-center h-64">
      <div className="text-red-500">
        <p className="text-lg font-medium">{message}</p>
        <button 
          onClick={fetchAllData}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Statistics Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive analytics and statistics for the Unitree platform
        </p>
      </div>

      {/* Time range filter */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            variant={timeRange === "week" ? "primary" : "outline"}
            className={timeRange !== "week" ? "bg-white" : ""}
            onClick={() => handleTimeRangeChange("week")}
          >
            Week
          </Button>
          <Button
            variant={timeRange === "month" ? "primary" : "outline"}
            className={timeRange !== "month" ? "bg-white" : ""}
            onClick={() => handleTimeRangeChange("month")}
          >
            Month
          </Button>
          <Button
            variant={timeRange === "year" ? "primary" : "outline"}
            className={timeRange !== "year" ? "bg-white" : ""}
            onClick={() => handleTimeRangeChange("year")}
          >
            Year
          </Button>
        </div>
        <Button 
          variant="outline" 
          className="bg-white flex items-center"
          onClick={() => showToast('Statistics exported successfully', 'success')}
        >
          <Icon icon={downloadIcon} className="mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="primary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-primary-light">
              <Icon icon={userIcon} className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Students</h3>
              {isLoading || !overviewStats ? (
                <p className="text-2xl font-bold">-</p>
              ) : (
                <p className="text-2xl font-bold">{formatNumber(overviewStats.totalUsers)}</p>
              )}
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
              {isLoading || !overviewStats ? (
                <p className="text-2xl font-bold">-</p>
              ) : (
                <p className="text-2xl font-bold">
                  {formatNumber(overviewStats.totalVirtualTrees + overviewStats.totalRealTrees)}
                </p>
              )}
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
              {isLoading || !overviewStats ? (
                <p className="text-2xl font-bold">-</p>
              ) : (
                <p className="text-2xl font-bold">{formatNumber(overviewStats.totalWifiHours)}</p>
              )}
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
              {isLoading || !overviewStats ? (
                <p className="text-2xl font-bold">-</p>
              ) : (
                <p className="text-2xl font-bold">{formatNumber(overviewStats.totalPointsEarned)}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card className="mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <Icon icon={chartIcon} className="mr-2 text-primary" />
              Growth Metrics
            </h2>
            <div className="flex space-x-2">
              <Button
                variant={selectedMetric === "students" ? "primary" : "outline"}
                size="sm"
                className={selectedMetric !== "students" ? "bg-white" : ""}
                onClick={() => handleMetricChange("students")}
              >
                Students
              </Button>
              <Button
                variant={selectedMetric === "trees" ? "primary" : "outline"}
                size="sm"
                className={selectedMetric !== "trees" ? "bg-white" : ""}
                onClick={() => handleMetricChange("trees")}
              >
                Trees
              </Button>
              <Button
                variant={selectedMetric === "points" ? "primary" : "outline"}
                size="sm"
                className={selectedMetric !== "points" ? "bg-white" : ""}
                onClick={() => handleMetricChange("points")}
              >
                Points
              </Button>
              <Button
                variant={selectedMetric === "sessions" ? "primary" : "outline"}
                size="sm"
                className={selectedMetric !== "sessions" ? "bg-white" : ""}
                onClick={() => handleMetricChange("sessions")}
              >
                Sessions
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <LoadingPlaceholder />
          ) : monthlyError ? (
            <ErrorMessage message={monthlyError} />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={
                      selectedMetric === "students"
                        ? "#3B82F6"
                        : selectedMetric === "trees"
                          ? "#10B981"
                          : selectedMetric === "points"
                            ? "#F59E0B"
                            : "#8B5CF6"
                    }
                    fill={
                      selectedMetric === "students"
                        ? "#93C5FD"
                        : selectedMetric === "trees"
                          ? "#6EE7B7"
                          : selectedMetric === "points"
                            ? "#FCD34D"
                            : "#C4B5FD"
                    }
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      {/* Charts Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tree Types Distribution */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Icon icon={treeIcon} className="mr-2 text-green-600" />
              Tree Types Distribution
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <LoadingPlaceholder />
            ) : treeTypesError ? (
              <ErrorMessage message={treeTypesError} />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treeTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {treeTypesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} trees`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* User Activity by Hour */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Icon icon={chartIcon} className="mr-2 text-blue-600" />
              User Activity by Hour
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <LoadingPlaceholder />
            ) : userActivityError ? (
              <ErrorMessage message={userActivityError} />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} users`, "Active Users"]}
                    />
                    <Legend />
                    <Bar dataKey="active" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Points Source Distribution */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Icon icon={medalIcon} className="mr-2 text-amber-500" />
              Points Source Distribution
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <LoadingPlaceholder />
            ) : pointsSourceError ? (
              <ErrorMessage message={pointsSourceError} />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pointsSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {pointsSourceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* Daily WiFi Sessions */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Icon icon={wifiIcon} className="mr-2 text-indigo-600" />
              Daily WiFi Sessions
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <LoadingPlaceholder />
            ) : dailySessionsError ? (
              <ErrorMessage message={dailySessionsError} />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySessionsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} sessions`, "Sessions"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#8B5CF6"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
