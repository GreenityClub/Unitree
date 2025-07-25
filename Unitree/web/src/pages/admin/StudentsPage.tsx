import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import apiClient, { API_ENDPOINTS } from '../../config/api';
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
  userIcon, editIcon, deleteIcon, searchIcon, 
  checkIcon, closeIcon, addIcon, treeIcon, medalIcon
} from '../../utils/icons';
import { format } from 'date-fns';

// Interface for Student data
interface Student {
  _id: string;
  fullname: string;
  email: string;
  studentId: string;
  points: number;
  allTimePoints: number;
  trees: string[]; // Array of tree IDs
  realTrees: string[]; // Array of real tree IDs
  createdAt: string;
  university: string;
  avatar?: string;
  lastActive?: string;
}

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};

// Status badge component
const StatusBadge: React.FC<{ lastActive?: string }> = ({ lastActive }) => {
  // Consider a user active if they've been active in the last 7 days
  const isActive = lastActive && new Date(lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const getStatusStyles = () => {
    if (isActive) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles()}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const { showToast } = useToast();
  
  // Column definitions using TanStack Table's column helper
  const columnHelper = createColumnHelper<Student>();
  const columns = [
    columnHelper.accessor('studentId', {
      header: 'Student ID',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('fullname', {
      header: 'Name',
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            {info.row.original.avatar ? (
              <img 
                src={info.row.original.avatar} 
                alt={info.getValue()} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <Icon icon={userIcon} className="text-blue-500" />
            )}
          </div>
          {info.getValue()}
        </div>
      ),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('points', {
      header: () => (
        <div className="flex items-center">
          <Icon icon={medalIcon} className="mr-1 text-amber-500" />
          <span>Points</span>
        </div>
      ),
      cell: info => (
        <span className="font-medium">{info.getValue().toLocaleString()}</span>
      ),
      footer: info => info.column.id,
    }),
    columnHelper.accessor(row => row.trees?.length || 0, {
      id: 'trees',
      header: () => (
        <div className="flex items-center">
          <Icon icon={treeIcon} className="mr-1 text-green-500" />
          <span>Trees</span>
        </div>
      ),
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('university', {
      header: 'University',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Join Date',
      cell: info => formatDate(info.getValue()),
      footer: info => info.column.id,
    }),
    columnHelper.accessor(row => row.lastActive, {
      id: 'status',
      header: 'Status',
      cell: info => <StatusBadge lastActive={info.getValue()} />,
      footer: info => info.column.id,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleDelete(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Delete student"
          >
            <Icon icon={deleteIcon} className="text-red-500" />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<Student>[];

  // Set up the table instance
  const table = useReactTable({
    data: students,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, [pagination.page, pagination.limit]);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: globalFilter
        }
      });
      setStudents(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load student data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the delete modal
  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Handle student deletion
  const confirmDelete = async () => {
    if (selectedStudent) {
      try {
        await apiClient.delete(`/api/users/${selectedStudent._id}`);
        showToast(`Student ${selectedStudent.fullname} has been deleted.`, 'success');
        fetchStudents(); // Refresh the list
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to delete student.', 'error');
      } finally {
        setShowDeleteModal(false);
        setSelectedStudent(null);
      }
    }
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Student Management</h1>
        <p className="text-gray-600">Manage and monitor all student accounts</p>
      </div>
      
      {/* Search and filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search students by name, email or ID..."
                  value={globalFilter || ''}
                  onChange={e => setGlobalFilter(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      fetchStudents();
                    }
                  }}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={fetchStudents}
            >
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
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
                            {header.isPlaceholder ? null : 
                              flexRender(header.column.columnDef.header, header.getContext())
                            }
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
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                        No students found
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
                        {students.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center">
                      {Array.from(
                        { length: Math.ceil(pagination.total / pagination.limit) },
                        (_, i) => (
                          <button
                            key={i}
                            className={`px-3 py-1 text-sm ${
                              pagination.page === i + 1
                                ? 'bg-blue-100 text-blue-700 font-medium rounded-md'
                                : 'text-gray-700 hover:bg-gray-100 rounded-md'
                            }`}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </button>
                        )
                      ).slice(
                        Math.max(0, pagination.page - 2),
                        Math.min(
                          Math.ceil(pagination.total / pagination.limit),
                          pagination.page + 1
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => handlePageChange(Math.ceil(pagination.total / pagination.limit))}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
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

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Student"
        variant="error"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Icon icon={deleteIcon} className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Delete Student</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete {selectedStudent?.fullname}? This action cannot be undone.
          </p>
          <p className="text-sm text-red-500 mt-2 font-bold">
            This will permanently delete all data associated with this student, including trees, points, and WiFi sessions.
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
            variant="primary"
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default StudentsPage; 