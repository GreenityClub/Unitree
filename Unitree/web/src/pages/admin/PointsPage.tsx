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
  searchIcon,
  medalIcon,
  userIcon,
  filterIcon,
  addIcon,
  editIcon,
  deleteIcon
} from '../../utils/icons';
import { format } from 'date-fns';

// Interface for Point transaction data
interface PointTransaction {
  _id: string;
  userId: {
    _id: string;
    fullname: string;
    nickname: string;
  };
  amount: number;
  type: 'WIFI_SESSION' | 'TREE_REDEMPTION' | 'REAL_TREE_REDEMPTION' | 'ADMIN_ADJUSTMENT' | 'ATTENDANCE' | 'ACHIEVEMENT' | 'BONUS';
  metadata: any;
  createdAt: string;
}

interface PointsAdjustmentForm {
  userId: string;
  amount: number;
  reason: string;
}

// Helper to format date
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
};

// Helper to format transaction type for display
const formatTransactionType = (type: string) => {
  switch (type) {
    case 'WIFI_SESSION':
      return 'WiFi Session';
    case 'TREE_REDEMPTION':
      return 'Tree Redemption';
    case 'REAL_TREE_REDEMPTION':
      return 'Real Tree Redemption';
    case 'ADMIN_ADJUSTMENT':
      return 'Admin Adjustment';
    case 'ATTENDANCE':
      return 'Attendance';
    case 'ACHIEVEMENT':
      return 'Achievement';
    case 'BONUS':
      return 'Bonus';
    default:
      return type;
  }
};

const PointsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<PointsAdjustmentForm>({
    userId: '',
    amount: 0,
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all');

  // Add a state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PointTransaction | null>(null);

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<PointTransaction>();
  
  const columns = [
    columnHelper.accessor('userId.fullname', {
      header: 'User',
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <Icon icon={userIcon} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{info.getValue() || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{info.row.original.userId?.nickname || ''}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Points',
      cell: info => (
        <div className={`font-semibold ${info.getValue() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {info.getValue() >= 0 ? '+' : ''}{info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Transaction Type',
      cell: info => formatTransactionType(info.getValue()),
    }),
    columnHelper.accessor(row => {
      // Extract relevant metadata based on transaction type
      switch (row.type) {
        case 'WIFI_SESSION':
          return row.metadata?.duration 
            ? `${Math.floor(row.metadata.duration / 60)} minutes` 
            : 'WiFi Session';
        case 'TREE_REDEMPTION':
          return row.metadata?.speciesName || 'Tree Redemption';
        case 'ADMIN_ADJUSTMENT':
          return row.metadata?.reason || 'Admin Adjustment';
        default:
          return '';
      }
    }, {
      id: 'description',
      header: 'Description',
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => formatDate(info.getValue()),
    }),
    // Add a new column for actions
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDeleteClick(info.row.original)}
            className="p-1 rounded-full hover:bg-red-50 text-red-600"
            title="Delete transaction"
          >
            <Icon icon={deleteIcon} />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<PointTransaction>[];

  // Set up the table instance
  const table = useReactTable({
    data: transactions,
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

  // Load transactions on component mount and pagination change
  useEffect(() => {
    fetchTransactions();
  }, [pagination.pageIndex, pagination.pageSize, currentFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/points/admin/all', {
        params: {
          page: pagination.pageIndex + 1, // API uses 1-based indexing
          limit: pagination.pageSize,
          type: currentFilter !== 'all' ? currentFilter : undefined
        }
      });
      
      setTransactions(response.data.transactions);
      setTotalTransactions(response.data.total);
      setTotalPages(response.data.pages);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transaction data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the adjustment modal
  const openAdjustModal = () => {
    setAdjustmentForm({
      userId: '',
      amount: 0,
      reason: '',
    });
    setShowAdjustModal(true);
  };

  // Handle points adjustment
  const handleAdjustPoints = async () => {
    try {
      if (!adjustmentForm.userId || !adjustmentForm.reason) {
        showToast('User ID and reason are required', 'error');
        return;
      }

      const response = await apiClient.post('/api/points/admin/adjust', adjustmentForm);
      
      showToast(`Points adjusted successfully for user`, 'success');
      setShowAdjustModal(false);
      fetchTransactions(); // Refresh data
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to adjust points',
        'error'
      );
    }
  };

  // Add function to handle delete click
  const handleDeleteClick = (transaction: PointTransaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  // Add function to handle delete confirmation
  const confirmDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      await apiClient.delete(`/api/points/admin/${selectedTransaction._id}`);
      
      showToast(`Transaction deleted successfully`, 'success');
      setShowDeleteModal(false);
      fetchTransactions(); // Refresh the data
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to delete transaction',
        'error'
      );
    }
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page when filter changes
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Points Management</h1>
        <p className="text-gray-600">View and manage point transactions</p>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by user name..."
                  value={globalFilter || ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={currentFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('all')}
              >
                All
              </Button>
              <Button
                variant={currentFilter === 'WIFI_SESSION' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('WIFI_SESSION')}
              >
                WiFi
              </Button>
              <Button
                variant={currentFilter === 'TREE_REDEMPTION' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('TREE_REDEMPTION')}
              >
                Trees
              </Button>
              <Button
                variant={currentFilter === 'ADMIN_ADJUSTMENT' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('ADMIN_ADJUSTMENT')}
              >
                Adjustments
              </Button>
            </div>
            
            <Button
              variant="primary"
              className="flex items-center"
              onClick={openAdjustModal}
            >
              <Icon icon={addIcon} className="mr-2" />
              Adjust Points
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
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
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                        No transactions found
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
                        {transactions.length > 0 ? pagination.pageIndex * pagination.pageSize + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalTransactions)}
                      </span>{' '}
                      of <span className="font-medium">{totalTransactions}</span> results
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

      {/* Points Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Adjust User Points"
        variant="info"
      >
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <Input
                type="text"
                placeholder="Enter user ID"
                value={adjustmentForm.userId}
                onChange={e => setAdjustmentForm({...adjustmentForm, userId: e.target.value})}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the full user ID (e.g., 64f5a234e0ab12cd34ef5678)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points Amount
              </label>
              <Input
                type="number"
                placeholder="Enter points amount (positive or negative)"
                value={adjustmentForm.amount.toString()}
                onChange={e => setAdjustmentForm({...adjustmentForm, amount: parseInt(e.target.value)})}
              />
              <p className="mt-1 text-xs text-gray-500">
                Positive value adds points, negative value deducts points
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <Input
                type="text"
                placeholder="Enter reason for adjustment"
                value={adjustmentForm.reason}
                onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAdjustModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdjustPoints}
          >
            Adjust Points
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Point Transaction"
        variant="danger"
      >
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Icon icon={deleteIcon} className="text-red-600 text-xl" />
            </div>
          </div>
          
          <p className="text-center mb-2">Are you sure you want to delete this transaction?</p>
          
          {selectedTransaction && (
            <div className="border rounded-md p-4 bg-gray-50 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">User:</div>
                <div>{selectedTransaction.userId?.fullname || 'Unknown'}</div>
                
                <div className="font-medium">Amount:</div>
                <div className={selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {selectedTransaction.amount}
                </div>
                
                <div className="font-medium">Type:</div>
                <div>{formatTransactionType(selectedTransaction.type)}</div>
                
                <div className="font-medium">Date:</div>
                <div>{formatDate(selectedTransaction.createdAt)}</div>
              </div>
            </div>
          )}
          
          <p className="text-red-600 text-sm mb-4">
            Warning: This action will also update the user's points balance and can't be undone.
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
            Delete Transaction
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default PointsPage;
