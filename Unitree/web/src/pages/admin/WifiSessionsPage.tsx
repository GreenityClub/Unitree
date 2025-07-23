import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  wifiIcon, usersIcon, clockIcon, calendarIcon, 
  locationIcon, searchIcon, medalIcon, stopIcon
} from '../../utils/icons';
import { format, addMinutes, parseISO, differenceInMinutes } from 'date-fns';

// Interfaces
interface WifiSession {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  pointsEarned: number | null;
  status: 'active' | 'completed' | 'cancelled';
  location?: {
    building: string;
    room: string;
    latitude: number;
    longitude: number;
  };
}

// Mock usage data for charts
const hourlyUsage = [
  { hour: '00:00', sessions: 5 },
  { hour: '01:00', sessions: 3 },
  { hour: '02:00', sessions: 2 },
  { hour: '03:00', sessions: 1 },
  { hour: '04:00', sessions: 0 },
  { hour: '05:00', sessions: 0 },
  { hour: '06:00', sessions: 2 },
  { hour: '07:00', sessions: 8 },
  { hour: '08:00', sessions: 20 },
  { hour: '09:00', sessions: 35 },
  { hour: '10:00', sessions: 42 },
  { hour: '11:00', sessions: 38 },
  { hour: '12:00', sessions: 45 },
  { hour: '13:00', sessions: 50 },
  { hour: '14:00', sessions: 47 },
  { hour: '15:00', sessions: 53 },
  { hour: '16:00', sessions: 60 },
  { hour: '17:00', sessions: 58 },
  { hour: '18:00', sessions: 52 },
  { hour: '19:00', sessions: 48 },
  { hour: '20:00', sessions: 35 },
  { hour: '21:00', sessions: 25 },
  { hour: '22:00', sessions: 15 },
  { hour: '23:00', sessions: 8 },
];

const dailyPoints = [
  { day: 'Mon', points: 1200 },
  { day: 'Tue', points: 1500 },
  { day: 'Wed', points: 1800 },
  { day: 'Thu', points: 1600 },
  { day: 'Fri', points: 2100 },
  { day: 'Sat', points: 1900 },
  { day: 'Sun', points: 1300 },
];

const locationData = [
  { name: 'Library', value: 45, color: '#4CAF50' },
  { name: 'Student Center', value: 30, color: '#2196F3' },
  { name: 'Cafeteria', value: 15, color: '#FFC107' },
  { name: 'Dorms', value: 10, color: '#9C27B0' },
];

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'];

// Generate mock sessions
const generateSessions = (count: number): WifiSession[] => {
  const sessions: WifiSession[] = [];
  const now = new Date();
  
  const locations = [
    { building: 'Library', room: 'Main Hall' },
    { building: 'Student Center', room: 'Lobby' },
    { building: 'Cafeteria', room: 'Dining Area' },
    { building: 'Dorms', room: 'Common Room' }
  ];
  
  for (let i = 0; i < count; i++) {
    // Random start time within the last 24 hours
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - hoursAgo, startTime.getMinutes() - minutesAgo);
    
    // Determine if session is active, completed, or cancelled
    const statusRandom = Math.random();
    const status = statusRandom < 0.2 
      ? 'active' 
      : statusRandom < 0.9 
        ? 'completed' 
        : 'cancelled';
    
    // For completed or cancelled sessions, set an end time
    let endTime: string | null = null;
    let duration: number | null = null;
    let pointsEarned: number | null = null;
    
    if (status !== 'active') {
      const durationMinutes = Math.floor(Math.random() * 120) + 10; // 10 to 130 minutes
      endTime = addMinutes(startTime, durationMinutes).toISOString();
      duration = durationMinutes;
      
      if (status === 'completed') {
        pointsEarned = Math.floor(durationMinutes * (Math.random() * 0.5 + 0.5));
      }
    }
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    sessions.push({
      id: `wifi-${i + 1}`,
      userId: `user-${Math.floor(Math.random() * 100) + 1}`,
      userName: `Student ${Math.floor(Math.random() * 100) + 1}`,
      startTime: startTime.toISOString(),
      endTime,
      duration,
      pointsEarned,
      status,
      location: {
        ...location,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
      }
    });
  }
  
  return sessions;
};

const WifiSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<WifiSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showToast } = useToast();
  
  // Load sessions on component mount
  useEffect(() => {
    const fetchSessions = () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockSessions = generateSessions(50);
        setSessions(mockSessions);
        setIsLoading(false);
      }, 800);
    };
    
    fetchSessions();
  }, []);
  
  // Filter sessions based on tab and search term
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.location?.building.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    if (currentTab === 'all') return matchesSearch;
    return matchesSearch && session.status === currentTab;
  });
  
  // Count sessions by status
  const sessionCounts = {
    all: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  };
  
  // Total points earned today
  const totalPointsToday = sessions
    .filter(s => s.status === 'completed' && s.pointsEarned !== null)
    .reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
  
  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Handle ending a session
  const handleEndSession = (sessionId: string) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? {
              ...session,
              status: 'completed',
              endTime: new Date().toISOString(),
              duration: session.startTime ? 
                differenceInMinutes(new Date(), parseISO(session.startTime)) : null,
              pointsEarned: Math.floor((session.startTime ? 
                differenceInMinutes(new Date(), parseISO(session.startTime)) : 0) * 0.7)
            }
          : session
      )
    );
    
    showToast('Session ended successfully', 'success');
  };
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WiFi Sessions</h1>
        <p className="text-gray-600">Monitor and manage WiFi connection sessions</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions Today</p>
                <h3 className="text-2xl font-bold text-gray-800">{sessionCounts.all}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Icon icon={wifiIcon} className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <h3 className="text-2xl font-bold text-gray-800">{sessionCounts.active}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Icon icon={usersIcon} className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Generated</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalPointsToday}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Icon icon={medalIcon} className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Session Length</p>
                <h3 className="text-2xl font-bold text-gray-800">42m</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Icon icon={clockIcon} className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly Usage Chart */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Hourly Usage</h3>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourlyUsage}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Active Sessions"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        
        {/* Daily Points Chart */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Points Generated</h3>
              <div className="text-sm text-gray-500">Last 7 days</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyPoints}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    name="Points Generated" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        
        {/* Location Distribution */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Session Locations</h3>
              <Button variant="outline" className="bg-white text-sm">View Map</Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Sessions Table */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search sessions by student name or location..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button 
                variant={currentTab === 'all' ? 'primary' : 'outline'}
                className={currentTab === 'all' ? 'bg-blue-600' : 'bg-white'}
                onClick={() => setCurrentTab('all')}
              >
                All ({sessionCounts.all})
              </Button>
              <Button 
                variant={currentTab === 'active' ? 'primary' : 'outline'}
                className={currentTab === 'active' ? 'bg-green-600' : 'bg-white'}
                onClick={() => setCurrentTab('active')}
              >
                Active ({sessionCounts.active})
              </Button>
              <Button 
                variant={currentTab === 'completed' ? 'primary' : 'outline'}
                className={currentTab === 'completed' ? 'bg-green-600' : 'bg-white'}
                onClick={() => setCurrentTab('completed')}
              >
                Completed ({sessionCounts.completed})
              </Button>
              <Button 
                variant={currentTab === 'cancelled' ? 'primary' : 'outline'}
                className={currentTab === 'cancelled' ? 'bg-red-600' : 'bg-white'}
                onClick={() => setCurrentTab('cancelled')}
              >
                Cancelled ({sessionCounts.cancelled})
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.slice(0, 10).map(session => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon icon={usersIcon} className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{session.userName}</div>
                            <div className="text-xs text-gray-500">{session.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(session.startTime), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.endTime 
                          ? format(new Date(session.endTime), 'dd/MM/yyyy HH:mm')
                          : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(session.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.pointsEarned !== null 
                          ? <span className="font-medium text-amber-600">{session.pointsEarned}</span>
                          : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.location 
                          ? `${session.location.building}, ${session.location.room}`
                          : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                          ${session.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.status === 'active' && (
                          <Button 
                            variant="outline" 
                            className="text-xs bg-white inline-flex items-center"
                            onClick={() => handleEndSession(session.id)}
                          >
                            <Icon icon={stopIcon} className="mr-1 text-red-500" />
                            End Session
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <div className="flex-1 flex justify-between items-center">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                    <span className="font-medium">{filteredSessions.length}</span> results
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-white">Previous</Button>
                    <Button variant="outline" className="bg-white">Next</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default WifiSessionsPage; 