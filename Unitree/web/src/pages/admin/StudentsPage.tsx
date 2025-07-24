import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
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
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  points: number;
  trees: number;
  level: number;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Dummy student data - would be fetched from API in real app
const dummyStudents: Student[] = Array.from({ length: 100 }, (_, index) => ({
  id: `stud-${index + 1}`,
  fullName: `Student ${index + 1}`,
  email: `student${index + 1}@example.com`,
  studentId: `S${10000 + index}`,
  points: Math.floor(Math.random() * 5000),
  trees: Math.floor(Math.random() * 20),
  level: Math.floor(Math.random() * 10) + 1,
  createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'suspended',
}));

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};

// Status badge component
const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'suspended' }> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const { showToast } = useToast();
  
  // Column definitions using TanStack Table's column helper
  const columnHelper = createColumnHelper<Student>();
  const columns = [
    columnHelper.accessor('studentId', {
      header: 'Student ID',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('fullName', {
      header: 'Name',
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <Icon icon={userIcon} className="text-blue-500" />
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
    columnHelper.accessor('trees', {
      header: () => (
        <div className="flex items-center">
          <Icon icon={treeIcon} className="mr-1 text-green-500" />
          <span>Trees</span>
        </div>
      ),
      cell: info => info.getValue(),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('level', {
      header: 'Level',
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-sm font-medium text-purple-700">{info.getValue()}</span>
          </div>
        </div>
      ),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Join Date',
      cell: info => formatDate(info.getValue()),
      footer: info => info.column.id,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      footer: info => info.column.id,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Edit student"
          >
            <Icon icon={editIcon} className="text-blue-500" />
          </button>
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
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          setStudents(dummyStudents);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Handle opening the edit modal
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  // Handle opening the delete modal
  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Handle student deletion
  const confirmDelete = () => {
    if (selectedStudent) {
      // Filter out the selected student
      setStudents(current => current.filter(student => student.id !== selectedStudent.id));
      showToast(`Student ${selectedStudent.fullName} has been deleted.`, 'success');
      setShowDeleteModal(false);
      setSelectedStudent(null);
    }
  };

  // Pagination controls
  const nextPage = () => {
    if (table.getCanNextPage()) {
      table.nextPage();
    }
  };

  const prevPage = () => {
    if (table.getCanPreviousPage()) {
      table.previousPage();
    }
  };

  const gotoPage = (pageIndex: number) => {
    table.setPageIndex(pageIndex);
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
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="bg-white">
                All Students
              </Button>
              <Button variant="outline" className="bg-white">
                Active
              </Button>
              <Button variant="outline" className="bg-white">
                Inactive
              </Button>
            </div>
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
              <div className="py-3 px-6 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                          table.getFilteredRowModel().rows.length
                        )}
                      </span>{' '}
                      of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> results
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
                    <div className="flex items-center">
                      {Array.from({ length: table.getPageCount() }, (_, i) => (
                        <button
                          key={i}
                          className={`px-3 py-1 text-sm ${
                            table.getState().pagination.pageIndex === i
                              ? 'bg-blue-100 text-blue-700 font-medium rounded-md'
                              : 'text-gray-700 hover:bg-gray-100 rounded-md'
                          }`}
                          onClick={() => gotoPage(i)}
                        >
                          {i + 1}
                        </button>
                      )).slice(
                        Math.max(0, table.getState().pagination.pageIndex - 1),
                        Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
                      )}
                    </div>
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
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
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
            Are you sure you want to delete {selectedStudent?.fullName}? This action cannot be undone.
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

      {/* Edit Modal - Just a placeholder, would contain a form in real app */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student"
        variant="info"
      >
        <div className="text-center mb-6">
          <p>Edit form would go here...</p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
            className="bg-white"
          >
            Close
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default StudentsPage; 