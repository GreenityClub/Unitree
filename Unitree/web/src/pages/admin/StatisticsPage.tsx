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

// Dummy data for charts
const monthlyData = [
  { month: "Jan", students: 50, trees: 80, points: 1200, sessions: 120 },
  { month: "Feb", students: 65, trees: 105, points: 1600, sessions: 150 },
  { month: "Mar", students: 85, trees: 140, points: 2100, sessions: 190 },
  { month: "Apr", students: 110, trees: 180, points: 2700, sessions: 230 },
  { month: "May", students: 140, trees: 230, points: 3500, sessions: 280 },
  { month: "Jun", students: 180, trees: 290, points: 4500, sessions: 350 },
  { month: "Jul", students: 210, trees: 342, points: 5200, sessions: 420 },
];

const treeTypesData = [
  { name: "Oak", value: 120, color: "#4CAF50" },
  { name: "Pine", value: 80, color: "#8BC34A" },
  { name: "Maple", value: 70, color: "#CDDC39" },
  { name: "Birch", value: 50, color: "#FFC107" },
  { name: "Cedar", value: 30, color: "#FF9800" },
];

const userActivityData = [
  { hour: "00:00", active: 25 },
  { hour: "03:00", active: 10 },
  { hour: "06:00", active: 15 },
  { hour: "09:00", active: 120 },
  { hour: "12:00", active: 180 },
  { hour: "15:00", active: 210 },
  { hour: "18:00", active: 160 },
  { hour: "21:00", active: 70 },
];

const pointsSourceData = [
  { name: "WiFi Sessions", value: 65 },
  { name: "Tree Planting", value: 20 },
  { name: "Daily Streaks", value: 10 },
  { name: "Other", value: 5 },
];

const dailySessionsData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  sessions: Math.floor(Math.random() * 100) + 50,
}));

const COLORS = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800"];

const StatisticsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "students" | "trees" | "points" | "sessions"
  >("points");

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleTimeRangeChange = (range: "week" | "month" | "year") => {
    setIsLoading(true);
    setTimeRange(range);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleMetricChange = (
    metric: "students" | "trees" | "points" | "sessions",
  ) => {
    setSelectedMetric(metric);
  };

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
        <Button variant="outline" className="bg-white flex items-center">
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
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-xs text-green-600 flex items-center">
                <span className="mr-1">↑</span> 12% from last month
              </p>
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
              <p className="text-xs text-green-600 flex items-center">
                <span className="mr-1">↑</span> 8% from last month
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
              <h3 className="text-gray-500 text-sm">Active Sessions</h3>
              <p className="text-2xl font-bold">328</p>
              <p className="text-xs text-green-600 flex items-center">
                <span className="mr-1">↑</span> 15% from last month
              </p>
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
              <p className="text-xs text-green-600 flex items-center">
                <span className="mr-1">↑</span> 10% from last month
              </p>
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
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
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
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} trees`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
