import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import apiClient from '../../config/api';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  wifiIcon,
  userIcon,
  clockIcon,
  locationIcon,
  searchIcon,
  infoIcon,
  filterIcon,
  deleteIcon
} from '../../utils/icons';
import { format } from 'date-fns';

// Interface for WiFi session data
interface WifiSession {
  _id: string;
  user: {
    _id: string;
    fullname: string;
    nickname: string;
    studentId: string;
  };
  ipAddress: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  pointsEarned: number;
  isActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  createdAt: string;
}

// Format duration in seconds to readable format
const formatDuration = (seconds: number | null): string => {
  if (seconds === null) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

// Format date and time
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
};

// Session status badge component
const SessionStatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? 'Active' : 'Completed'}
    </span>
  );
};

const WifiSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<WifiSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WifiSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<WifiSession>();
  const columns = [
    columnHelper.accessor('user.fullname', {
      header: 'User',
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <Icon icon={userIcon} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{info.getValue() || 'Unknown'}</div>
            <div className="text-xs text-gray-500">
              {info.row.original.user?.studentId || ''}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('ipAddress', {
      header: 'IP Address',
      cell: info => (
        <div className="flex items-center">
          <Icon icon={wifiIcon} className="mr-2 text-blue-500" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('startTime', {
      header: 'Start Time',
      cell: info => formatDateTime(info.getValue()),
    }),
    columnHelper.accessor('endTime', {
      header: 'End Time',
      cell: info => {
        const endTime = info.getValue();
        return endTime ? formatDateTime(endTime) : 'Still active';
      },
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: info => formatDuration(info.getValue()),
    }),
    columnHelper.accessor('pointsEarned', {
      header: 'Points',
      cell: info => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: info => <SessionStatusBadge isActive={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(props.row.original)}
            className="p-1 rounded-full hover:bg-blue-50"
            title="View session details"
          >
            <Icon icon={infoIcon} className="text-blue-500" />
          </button>
          <button
            onClick={() => handleDeleteClick(props.row.original)}
            className="p-1 rounded-full hover:bg-red-50"
            title="Delete session"
          >
            <Icon icon={deleteIcon} className="text-red-600" />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<WifiSession>[];

  // Set up the table instance
  const table = useReactTable({
    data: sessions,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // Load sessions on component mount and when filters change
  useEffect(() => {
    fetchSessions();
  }, [pagination.pageIndex, pagination.pageSize, currentStatus]);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/wifi/sessions', {
        params: {
          page: pagination.pageIndex + 1, // API uses 1-based indexing
          limit: pagination.pageSize,
          status: currentStatus !== 'all' ? currentStatus : undefined,
          sortBy: 'startTime',
          order: 'desc'
        }
      });
      
      setSessions(response.data.sessions);
      setTotalSessions(response.data.total);
      setTotalPages(response.data.pages);
    } catch (err: any) {
      console.error('Failed to fetch WiFi sessions:', err);
      setError(err.response?.data?.message || 'Failed to load WiFi session data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing session details
  const handleViewDetails = (session: WifiSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  // Add function to handle delete click
  const handleDeleteClick = (session: WifiSession) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  // Add function to handle delete confirmation
  const confirmDelete = async () => {
    if (!selectedSession) return;
    
    try {
      await apiClient.delete(`/api/wifi/sessions/${selectedSession._id}`);
      
      showToast(`WiFi session deleted successfully`, 'success');
      setShowDeleteModal(false);
      fetchSessions(); // Refresh the data
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to delete WiFi session',
        'error'
      );
    }
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'completed') => {
    setCurrentStatus(status);
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page when filter changes
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WiFi Sessions</h1>
        <p className="text-gray-600">Monitor and manage WiFi sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Icon icon={wifiIcon} className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Sessions</p>
                <h3 className="text-xl font-bold">
                  {sessions.filter(s => s.isActive).length}
                </h3>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <Icon icon={clockIcon} className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <h3 className="text-xl font-bold">{totalSessions}</h3>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Icon icon={userIcon} className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Users</p>
                <h3 className="text-xl font-bold">
                  {new Set(sessions.map(s => s.user?._id)).size}
                </h3>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by user name or IP address..."
                  value={globalFilter || ''}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={currentStatus === 'all' ? 'primary' : 'outline'}
                className={currentStatus === 'all' ? 'bg-blue-600' : 'bg-white'}
                onClick={() => handleStatusFilterChange('all')}
              >
                All
              </Button>
              <Button
                variant={currentStatus === 'active' ? 'primary' : 'outline'}
                className={currentStatus === 'active' ? 'bg-green-600' : 'bg-white'}
                onClick={() => handleStatusFilterChange('active')}
              >
                Active
              </Button>
              <Button
                variant={currentStatus === 'completed' ? 'primary' : 'outline'}
                className={currentStatus === 'completed' ? 'bg-gray-600' : 'bg-white'}
                onClick={() => handleStatusFilterChange('completed')}
              >
                Completed
              </Button>
            </div>
            
            <Button 
              variant="primary" 
              onClick={fetchSessions} 
              className="flex items-center"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div>
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
                          <div className="flex items-center">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            <span>
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                        No WiFi sessions found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="py-3 px-6 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {sessions.length > 0 ? pagination.pageIndex * pagination.pageSize + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalSessions)}
                      </span>{' '}
                      of <span className="font-medium">{totalSessions}</span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <span className="text-gray-700">
                      Page {pagination.pageIndex + 1} of {Math.max(1, totalPages)}
                    </span>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => table.setPageIndex(totalPages - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Session Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="WiFi Session Details"
        variant="info"
      >
        {selectedSession && (
          <div className="mb-6">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon icon={wifiIcon} className="text-blue-600 text-3xl" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">User</h4>
                <p className="text-lg">{selectedSession.user?.fullname || 'Unknown'}</p>
                <p className="text-sm text-gray-500">ID: {selectedSession.user?.studentId || 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">IP Address</h4>
                <p className="text-lg">{selectedSession.ipAddress}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Start Time</h4>
                <p className="text-lg">{formatDateTime(selectedSession.startTime)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">End Time</h4>
                <p className="text-lg">{selectedSession.endTime ? formatDateTime(selectedSession.endTime) : 'Still active'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                <p className="text-lg">{formatDuration(selectedSession.duration)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Points Earned</h4>
                <p className="text-lg">{selectedSession.pointsEarned}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <SessionStatusBadge isActive={selectedSession.isActive} />
              </div>
              
              {selectedSession.location && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="text-lg flex items-center">
                    <Icon icon={locationIcon} className="mr-2 text-gray-500" />
                    {selectedSession.location.latitude.toFixed(6)}, {selectedSession.location.longitude.toFixed(6)}
                    {selectedSession.location.accuracy && (
                      <span className="ml-2 text-sm text-gray-500">(±{selectedSession.location.accuracy}m)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowDetailModal(false)}
            className="bg-white"
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete WiFi Session"
        variant="danger"
      >
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Icon icon={deleteIcon} className="text-red-600 text-xl" />
            </div>
          </div>
          
          <p className="text-center mb-2">Are you sure you want to delete this WiFi session?</p>
          
          {selectedSession && (
            <div className="border rounded-md p-4 bg-gray-50 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">User:</div>
                <div>{selectedSession.user?.fullname || 'Unknown'}</div>
                
                <div className="font-medium">Start Time:</div>
                <div>{formatDateTime(selectedSession.startTime)}</div>
                
                <div className="font-medium">Duration:</div>
                <div>{formatDuration(selectedSession.duration)}</div>
                
                <div className="font-medium">Points Earned:</div>
                <div>{selectedSession.pointsEarned}</div>
              </div>
            </div>
          )}
          
          <p className="text-red-600 text-sm mb-4">
            Warning: This action will also remove points earned from this session and update the user's statistics. This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
          >
            Delete Session
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default WifiSessionsPage; 