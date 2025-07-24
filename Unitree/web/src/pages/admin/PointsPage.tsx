import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/Layout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../contexts/ToastContext";
import Icon from "../../components/ui/Icon";
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
} from "@tanstack/react-table";
import {
  medalIcon,
  userIcon,
  wifiIcon,
  treeIcon,
  searchIcon,
  addIcon,
  filterIcon,
  downloadIcon,
  arrowUpIcon,
  arrowDownIcon,
} from "../../utils/icons";
import { format } from "date-fns";

// Interface for Point transaction data
interface PointTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number; // Positive for earned, negative for spent
  type: "wifi" | "tree" | "bonus" | "admin" | "other";
  description: string;
  timestamp: string;
  balance: number; // Balance after this transaction
}

// Dummy point transaction data
const dummyPointTransactions: PointTransaction[] = Array.from(
  { length: 30 },
  (_, index) => {
    const isEarned = Math.random() > 0.3;
    const types = ["wifi", "tree", "bonus", "admin", "other"];
    const type = types[Math.floor(Math.random() * types.length)] as
      | "wifi"
      | "tree"
      | "bonus"
      | "admin"
      | "other";

    let description = "";
    let amount = 0;

    switch (type) {
      case "wifi":
        description = `WiFi session ${isEarned ? "completed" : "cancelled"} - ${Math.floor(Math.random() * 60) + 30} minutes`;
        amount = isEarned
          ? Math.floor(Math.random() * 50) + 10
          : -Math.floor(Math.random() * 30);
        break;
      case "tree":
        description = isEarned ? `Planted a new tree` : `Spent on tree upgrade`;
        amount = isEarned
          ? Math.floor(Math.random() * 200) + 50
          : -Math.floor(Math.random() * 100) - 50;
        break;
      case "bonus":
        description = `${Math.floor(Math.random() * 5) + 1} day streak bonus`;
        amount = Math.floor(Math.random() * 100) + 20;
        break;
      case "admin":
        description = isEarned ? `Admin bonus` : `Admin correction`;
        amount = isEarned
          ? Math.floor(Math.random() * 100) + 50
          : -Math.floor(Math.random() * 100) - 10;
        break;
      default:
        description = isEarned ? `Earned from event` : `Spent on feature`;
        amount = isEarned
          ? Math.floor(Math.random() * 75) + 25
          : -Math.floor(Math.random() * 50) - 25;
    }

    return {
      id: `tr-${index + 1}`,
      studentId: `S${10000 + Math.floor(Math.random() * 1000)}`,
      studentName: `Student ${Math.floor(Math.random() * 50) + 1}`,
      amount,
      type,
      description,
      timestamp: new Date(
        2023,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
      ).toISOString(),
      balance: Math.floor(Math.random() * 3000) + 500,
    };
  },
);

// Sort transactions by timestamp
dummyPointTransactions.sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

// Format date and time
const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm");
};

// Transaction Type Badge component
const TransactionTypeBadge: React.FC<{
  type: "wifi" | "tree" | "bonus" | "admin" | "other";
}> = ({ type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case "wifi":
        return "bg-blue-100 text-blue-800";
      case "tree":
        return "bg-green-100 text-green-800";
      case "bonus":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "wifi":
        return wifiIcon;
      case "tree":
        return treeIcon;
      case "bonus":
        return medalIcon;
      case "admin":
        return userIcon;
      default:
        return medalIcon;
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getTypeStyles()}`}
    >
      <Icon icon={getTypeIcon()} className="mr-1" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

const PointsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [pointAmount, setPointAmount] = useState(0);
  const [pointDescription, setPointDescription] = useState("");

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<PointTransaction>();
  const columns = [
    columnHelper.accessor("timestamp", {
      header: "Date & Time",
      cell: (info) => formatDateTime(info.getValue()),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("studentName", {
      header: "Student",
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <Icon icon={userIcon} className="text-blue-500" />
          </div>
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-xs text-gray-500">
              ID: {info.row.original.studentId}
            </div>
          </div>
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => <TransactionTypeBadge type={info.getValue()} />,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("amount", {
      header: () => (
        <div className="flex items-center">
          <Icon icon={medalIcon} className="mr-1 text-amber-500" />
          <span>Points</span>
        </div>
      ),
      cell: (info) => {
        const amount = info.getValue();
        return (
          <div
            className={`flex items-center font-medium ${amount >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            <Icon
              icon={amount >= 0 ? arrowUpIcon : arrowDownIcon}
              className="mr-1"
            />
            {amount >= 0 ? `+${amount}` : amount}
          </div>
        );
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("balance", {
      header: "Balance",
      cell: (info) => (
        <span className="font-medium">{info.getValue().toLocaleString()}</span>
      ),
      footer: (info) => info.column.id,
    }),
  ] as ColumnDef<PointTransaction>[];

  // Set up the table instance
  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Load transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          setTransactions(dummyPointTransactions);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Failed to fetch point transactions:", error);
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Handle opening the add points modal
  const handleAddPoints = () => {
    setShowAddPointsModal(true);
  };

  // Handle adding points to a student
  const confirmAddPoints = () => {
    if (selectedStudentId && pointAmount && pointDescription) {
      // Create new transaction
      const newTransaction: PointTransaction = {
        id: `tr-${Date.now()}`,
        studentId: selectedStudentId,
        studentName: `Student (${selectedStudentId})`, // This would normally come from the API
        amount: pointAmount,
        type: "admin",
        description: pointDescription,
        timestamp: new Date().toISOString(),
        balance: 0, // This would be calculated by the backend
      };

      // Add to transactions list
      setTransactions((current) => [newTransaction, ...current]);
      showToast(
        `${pointAmount > 0 ? "Added" : "Deducted"} ${Math.abs(pointAmount)} points ${pointAmount > 0 ? "to" : "from"} student ${selectedStudentId}.`,
        "success",
      );

      // Reset form
      setSelectedStudentId("");
      setPointAmount(0);
      setPointDescription("");
      setShowAddPointsModal(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Points Management</h1>
        <p className="text-gray-600">
          Manage and monitor all point transactions in the system
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card variant="primary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-primary-light">
              <Icon icon={medalIcon} className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Points Earned</h3>
              <p className="text-2xl font-bold">436,582</p>
            </div>
          </div>
        </Card>

        <Card variant="secondary" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-secondary-light">
              <Icon icon={userIcon} className="text-secondary-dark text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Avg. Points Per Student</h3>
              <p className="text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>

        <Card variant="accent" className="shadow-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-full bg-accent-light">
              <Icon icon={wifiIcon} className="text-accent-dark text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Points From WiFi</h3>
              <p className="text-2xl font-bold">238,974</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search transactions by student, ID or description..."
                  value={globalFilter || ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="bg-white flex items-center">
                <Icon icon={filterIcon} className="mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="bg-white flex items-center">
                <Icon icon={downloadIcon} className="mr-2" />
                Export
              </Button>
              <Button
                variant="primary"
                className="flex items-center"
                onClick={handleAddPoints}
              >
                <Icon icon={addIcon} className="mr-2" />
                Add Points
              </Button>
            </div>
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
          ) : (
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                            <span>
                              {{
                                asc: " 🔼",
                                desc: " 🔽",
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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
                      Showing{" "}
                      <span className="font-medium">
                        {table.getState().pagination.pageIndex *
                          table.getState().pagination.pageSize +
                          1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) *
                            table.getState().pagination.pageSize,
                          table.getFilteredRowModel().rows.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {table.getFilteredRowModel().rows.length}
                      </span>{" "}
                      results
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
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
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
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
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

      {/* Add Points Modal */}
      <Modal
        isOpen={showAddPointsModal}
        onClose={() => setShowAddPointsModal(false)}
        title="Add/Deduct Points"
        variant="info"
      >
        <div className="mb-6 space-y-4">
          <div>
            <label
              htmlFor="student-id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Student ID
            </label>
            <Input
              id="student-id"
              type="text"
              placeholder="Enter student ID"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="point-amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Points (use negative value to deduct)
            </label>
            <Input
              id="point-amount"
              type="number"
              placeholder="Enter point amount"
              value={pointAmount === 0 ? "" : pointAmount}
              onChange={(e) =>
                setPointAmount(parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <Input
              id="description"
              type="text"
              placeholder="Enter reason for adding/deducting points"
              value={pointDescription}
              onChange={(e) => setPointDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAddPointsModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmAddPoints}
            disabled={!selectedStudentId || !pointAmount || !pointDescription}
          >
            {pointAmount > 0 ? "Add" : "Deduct"} Points
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default PointsPage;
