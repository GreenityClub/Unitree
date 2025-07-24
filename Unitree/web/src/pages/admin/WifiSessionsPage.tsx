import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/ui/Modal';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  wifiIcon, userIcon, searchIcon, filterIcon,
  calendarIcon, clockIcon, arrowRightIcon,
  exclamationCircleIcon, checkCircleIcon
} from '../../utils/icons';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Interface for WiFi Session data
interface WifiSession {
  id: string;
  userId: string;
  studentName: string;
  studentId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  pointsEarned: number | null;
  status: 'active' | 'completed' | 'terminated';
  ipAddress: string;
  deviceType: string;
  location: string;
}

// Generate mock WiFi session data
const generateWifiSessions = (count: number): WifiSession[] => {
  const locations = ['Library', 'Main Building', 'Science Block', 'Student Center', 'Cafeteria'];
  const deviceTypes = ['Mobile', 'Laptop', 'Tablet'];
  const now = new Date();
  
  return Array.from({ length: count }, (_, i) => {
    const startTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last week
    const isActive = Math.random() > 0.7;
    const isTerminated = !isActive && Math.random() > 0.8;
    
    let endTime = null;
    let duration = null;
    let pointsEarned = null;
    
    if (!isActive) {
      const sessionDuration = Math.floor(Math.random() * 120) + 15; // 15-135 minutes
      endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000).toISOString();
      duration = sessionDuration;
      pointsEarned = Math.floor(sessionDuration * 2); // 2 points per minute
    }
    
    return {
      id: `session-${i + 1}`,
      userId: `user-${Math.floor(Math.random() * 1000) + 1}`,
      studentName: `Student ${Math.floor(Math.random() * 100) + 1}`,
      studentId: `S${10000 + Math.floor(Math.random() * 1000)}`,
      startTime: startTime.toISOString(),
      endTime,
      duration,
      pointsEarned,
      status: isActive ? 'active' : isTerminated ? 'terminated' : 'completed',
      ipAddress: `192.168.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`,
      deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      location: locations[Math.floor(Math.random() * locations.length)]
    };
  });
};

// Calculate stats from sessions
const calculateStats = (sessions: WifiSession[]) => {
  const now = new Date();
  const activeSessions = sessions.filter(session => session.status === 'active').length;
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
  }).length;
  
  const pointsToday = sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.getDate() === now.getDate() && 
        sessionDate.getMonth() === now.getMonth() && 
        sessionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
    
  const totalMinutes = sessions.reduce((sum, session) => {
    if (session.duration) {
      return sum + session.duration;
    } else if (session.status === 'active') {
      // For active sessions, calculate current duration
      const startTime = new Date(session.startTime);
      return sum + differenceInMinutes(new Date(), startTime);
    }
    return sum;
  }, 0);
  
  return {
    activeSessions,
    todaySessions,
    pointsToday,
    totalMinutes
  };
};

const WifiSessionsPage: React.FC = () => {
  const [wifiSessions, setWifiSessions] = useState<WifiSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'terminated'>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WifiSession | null>(null);
  const [stats, setStats] = useState({
    activeSessions: 0,
    todaySessions: 0,
    pointsToday: 0,
    totalMinutes: 0
  });
  
  const { showToast } = useToast();
  
  // Column definitions
  const columnHelper = createColumnHelper<WifiSession>();
  const columns = [
    columnHelper.accessor('studentName', {
      header: 'Student',
      cell: info => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon icon={userIcon} className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-xs text-gray-500">ID: {info.row.original.studentId}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('startTime', {
      header: 'Start Time',
      cell: info => (
        <div>
          <div className="text-sm text-gray-900">{format(new Date(info.getValue()), 'MMM d, yyyy')}</div>
          <div className="text-xs text-gray-500">{format(new Date(info.getValue()), 'HH:mm:ss')}</div>
        </div>
      ),
    }),
    columnHelper.accessor('endTime', {
      header: 'End Time',
      cell: info => {
        if (info.getValue()) {
          return (
            <div>
              <div className="text-sm text-gray-900">{format(new Date(info.getValue() as string), 'MMM d, yyyy')}</div>
              <div className="text-xs text-gray-500">{format(new Date(info.getValue() as string), 'HH:mm:ss')}</div>
            </div>
          );
        }
        return info.row.original.status === 'active' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        );
      },
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: info => {
        if (info.getValue()) {
          const minutes = info.getValue() as number;
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return (
            <span className="text-sm text-gray-900">
              {hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`}
            </span>
          );
        }
        if (info.row.original.status === 'active') {
          const startTime = new Date(info.row.original.startTime);
          return (
            <span className="text-sm text-green-600">
              {formatDistanceToNow(startTime, { addSuffix: false })}
            </span>
          );
        }
        return <span className="text-sm text-gray-500">-</span>;
      },
    }),
    columnHelper.accessor('pointsEarned', {
      header: 'Points',
      cell: info => {
        if (info.getValue()) {
          return <span className="text-sm font-medium text-gray-900">{info.getValue()}</span>;
        }
        if (info.row.original.status === 'active') {
          const startTime = new Date(info.row.original.startTime);
          const minutes = differenceInMinutes(new Date(), startTime);
          const estimatedPoints = Math.max(0, Math.floor(minutes * 2)); // Assume 2 points per minute
          return (
            <span className="text-sm text-green-600">
              ~{estimatedPoints} (est.)
            </span>
          );
        }
        return <span className="text-sm text-gray-500">-</span>;
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        let badgeClass = '';
        let icon = null;
        
        switch (status) {
          case 'active':
            badgeClass = 'bg-green-100 text-green-800';
            icon = <Icon icon={wifiIcon} className="mr-1 h-3 w-3" />;
            break;
          case 'completed':
            badgeClass = 'bg-blue-100 text-blue-800';
            icon = <Icon icon={checkCircleIcon} className="mr-1 h-3 w-3" />;
            break;
          case 'terminated':
            badgeClass = 'bg-red-100 text-red-800';
            icon = <Icon icon={exclamationCircleIcon} className="mr-1 h-3 w-3" />;
            break;
          default:
            badgeClass = 'bg-gray-100 text-gray-800';
            break;
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {icon}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    }),
    columnHelper.accessor('location', {
      header: 'Location',
      cell: info => <span className="text-sm text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => {
        const session = props.row.original;
        return session.status === 'active' ? (
          <button
            onClick={() => handleEndSession(session)}
            className="text-red-600 hover:text-red-900 font-medium"
          >
            End Session
          </button>
        ) : (
          <button
            onClick={() => handleViewDetails(session)}
            className="text-blue-600 hover:text-blue-900 font-medium"
          >
            View
          </button>
        );
      },
    }),
  ];
  
  // Load WiFi sessions on component mount
  useEffect(() => {
    const fetchWifiSessions = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          const mockSessions = generateWifiSessions(50);
          setWifiSessions(mockSessions);
          setStats(calculateStats(mockSessions));
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch WiFi sessions:', error);
        setIsLoading(false);
      }
    };
    
    fetchWifiSessions();
    
    // Update active sessions duration regularly
    const intervalId = setInterval(() => {
      if (wifiSessions.some(session => session.status === 'active')) {
        setStats(calculateStats(wifiSessions));
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [wifiSessions.length]);

  // Filter sessions
  const filteredSessions = React.useMemo(() => {
    return wifiSessions.filter(session => {
      // Status filter
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      if (startDate && endDate) {
        const sessionDate = new Date(session.startTime);
        if (sessionDate < startDate || sessionDate > endDate) {
          return false;
        }
      }
      
      // Global search
      if (globalFilter) {
        const searchTerm = globalFilter.toLowerCase();
        return (
          session.studentName.toLowerCase().includes(searchTerm) ||
          session.studentId.toLowerCase().includes(searchTerm) ||
          session.location.toLowerCase().includes(searchTerm) ||
          session.ipAddress.toLowerCase().includes(searchTerm) ||
          session.deviceType.toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  }, [wifiSessions, statusFilter, startDate, endDate, globalFilter]);
  
  // Table instance
  const table = useReactTable({
    data: filteredSessions,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  // Handle view details
  const handleViewDetails = (session: WifiSession) => {
    setSelectedSession(session);
    // In a real app, would show details modal or navigate to details page
  };
  
  // Handle end session
  const handleEndSession = (session: WifiSession) => {
    setSelectedSession(session);
    setShowEndSessionModal(true);
  };
  
  // Confirm end session
  const confirmEndSession = () => {
    if (!selectedSession) return;
    
    // Update the session
    const now = new Date();
    const startTime = new Date(selectedSession.startTime);
    const durationMinutes = differenceInMinutes(now, startTime);
    const pointsEarned = Math.max(0, Math.floor(durationMinutes * 2)); // Assume 2 points per minute
    
    const updatedSessions = wifiSessions.map(session => {
      if (session.id === selectedSession.id) {
        return {
          ...session,
          status: 'completed' as 'completed',
          endTime: now.toISOString(),
          duration: durationMinutes,
          pointsEarned
        };
      }
      return session;
    });
    
    setWifiSessions(updatedSessions);
    setStats(calculateStats(updatedSessions));
    showToast(`Session for ${selectedSession.studentName} ended successfully.`, 'success');
    setShowEndSessionModal(false);
    setSelectedSession(null);
  };
  
  // Reset filters
  const resetFilters = () => {
    setGlobalFilter('');
    setStatusFilter('all');
    setDateRange([null, null]);
  };

  return (
    <AdminLayout>
    <div className="mb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WiFi Sessions</h1>
        <p className="text-gray-600">Monitor and manage WiFi sessions and point earnings</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="primary">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Active Sessions</p>
                <h3 className="text-2xl font-bold">{stats.activeSessions}</h3>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Icon icon={wifiIcon} className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="secondary">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Today's Sessions</p>
                <h3 className="text-2xl font-bold">{stats.todaySessions}</h3>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Icon icon={calendarIcon} className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="tertiary">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Points Today</p>
                <h3 className="text-2xl font-bold">{stats.pointsToday}</h3>
              </div>
              <div className="bg-amber-100 rounded-full p-3">
                <Icon icon={arrowRightIcon} className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="accent">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Time</p>
                <h3 className="text-2xl font-bold">
                  {stats.totalMinutes > 60 
                    ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` 
                    : `${stats.totalMinutes}m`}
                </h3>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Icon icon={clockIcon} className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Search and filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search sessions..."
                value={globalFilter || ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Icon icon={searchIcon} className="text-gray-400" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? '' : 'bg-white'}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600' : 'bg-white'}
              >
                Active
              </Button>
              <Button 
                variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                className={statusFilter === 'completed' ? 'bg-blue-600' : 'bg-white'}
              >
                Completed
              </Button>
              <Button 
                variant={statusFilter === 'terminated' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('terminated')}
                className={statusFilter === 'terminated' ? 'bg-red-600' : 'bg-white'}
              >
                Terminated
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Icon icon={calendarIcon} className="text-gray-400" />
              <div className="flex-1">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update: [Date | null, Date | null]) => {
                    setDateRange(update);
                  }}
                  placeholderText="Filter by date range"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
            </div>
            
            <Button variant="outline" onClick={resetFilters} className="bg-white">
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Sessions Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <span>
                                {{
                                  asc: ' 🔼',
                                  desc: ' 🔽',
                                }[header.column.getIsSorted() as string] ?? null}
                              </span>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="bg-white"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="bg-white"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                          filteredSessions.length
                        )}
                      </span>{' '}
                      of <span className="font-medium">{filteredSessions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button
                        variant="outline"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        className="bg-white relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="bg-white relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="bg-white relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        className="bg-white relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Last
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {!isLoading && filteredSessions.length === 0 && (
            <div className="text-center py-8">
              <Icon icon={wifiIcon} className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sessions found with the current filters</p>
              <Button onClick={resetFilters} variant="outline" className="mt-2 bg-white">
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* End Session Modal */}
      <Modal
        isOpen={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        title="End WiFi Session"
        variant="warning"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Icon icon={exclamationCircleIcon} className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">End WiFi Session</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to end the current WiFi session for {selectedSession?.studentName}?
          </p>
          
          {selectedSession && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md text-left">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Student:</div>
                <div>{selectedSession.studentName}</div>
                <div className="text-gray-500">Started:</div>
                <div>{format(new Date(selectedSession.startTime), 'MMM d, yyyy HH:mm')}</div>
                <div className="text-gray-500">Duration:</div>
                <div>
                  {formatDistanceToNow(new Date(selectedSession.startTime), { addSuffix: false })}
                </div>
                <div className="text-gray-500">Location:</div>
                <div>{selectedSession.location}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowEndSessionModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmEndSession}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            End Session
          </Button>
        </div>
      </Modal>
    </div>
    </AdminLayout>
  );
};

export default WifiSessionsPage; 