import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../components/Layout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../contexts/ToastContext";
import Icon from "../../components/ui/Icon";
import apiClient, { API_ENDPOINTS } from "../../config/api";
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
  treeIcon,
  locationIcon,
  userIcon,
  calendarIcon,
  searchIcon,
  addIcon,
  editIcon,
  deleteIcon,
  clockIcon,
  checkIcon,
  cloudUploadIcon,
} from "../../utils/icons";
import { format } from "date-fns";

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy");
};

// Interface for RealTree data
interface RealTree {
  _id: string;
  userId: string;
  studentId: string;
  treeSpecie: string;
  plantedDate: string;
  location: string;
  stage: 'planted' | 'thriving' | 'dead';
  pointsCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Status badge component
const StatusBadge: React.FC<{
  status: "planted" | "thriving" | "dead";
}> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "thriving":
        return "bg-green-100 text-green-800";
      case "planted":
        return "bg-yellow-100 text-yellow-800";
      case "dead":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles()}`}
    >
      {status
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")}
    </span>
  );
};

const RealTreesPage: React.FC = () => {
  const [realTrees, setRealTrees] = useState<RealTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTree, setSelectedTree] = useState<RealTree | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<RealTree>();
  const columns = [
    columnHelper.accessor("treeSpecie", {
      header: "Tree Name",
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
            <Icon icon={treeIcon} className="text-green-500" />
          </div>
          <div>
            <div className="font-medium">{info.getValue()}</div>
          </div>
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("location", {
      header: "Location",
      cell: (info) => (
        <div className="flex items-center">
          <Icon icon={locationIcon} className="text-gray-500 mr-2" />
          <span>{info.getValue()}</span>
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("studentId", {
      header: "Planted By",
      cell: (info) => (
        <div className="flex items-center">
          <Icon icon={userIcon} className="text-gray-500 mr-2" />
          <div>
            <div>Student</div>
            <div className="text-xs text-gray-500">
              ID: {info.getValue()}
            </div>
          </div>
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("plantedDate", {
      header: "Planted Date",
      cell: (info) => (
        <div className="flex items-center">
          <Icon icon={calendarIcon} className="text-gray-500 mr-2" />
          {formatDate(info.getValue())}
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("stage", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("pointsCost", {
      header: "Points Cost",
      cell: (info) => `${info.getValue()} points`,
      footer: (info) => info.column.id,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (props) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="View tree details"
          >
            <Icon icon={searchIcon} className="text-gray-500" />
          </button>
          <button
            onClick={() => handleEdit(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Edit tree"
          >
            <Icon icon={editIcon} className="text-blue-500" />
          </button>
          <button
            onClick={() => handleDelete(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Delete tree"
          >
            <Icon icon={deleteIcon} className="text-red-500" />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<RealTree>[];

  // Set up the table instance
  const table = useReactTable({
    data: realTrees,
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

  // Load real trees on component mount
  useEffect(() => {
    const fetchRealTrees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(API_ENDPOINTS.TREE.ADMIN.GET_REAL_TREES);
        setRealTrees(response.data);
      } catch (err: any) {
        console.error("Failed to fetch real trees:", err);
        setError(err.response?.data?.message || 'Failed to load real tree data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealTrees();
  }, []);

  // Handle opening the view modal
  const handleView = (tree: RealTree) => {
    setSelectedTree(tree);
    setShowViewModal(true);
  };

  // Handle opening the edit modal
  const handleEdit = (tree: RealTree) => {
    setSelectedTree(tree);
    setShowEditModal(true);
  };

  // Handle opening the delete modal
  const handleDelete = (tree: RealTree) => {
    setSelectedTree(tree);
    setShowDeleteModal(true);
  };

  // Handle tree deletion
  const confirmDelete = async () => {
    if (selectedTree) {
      try {
        // Here you would make an API call to delete the tree
        // await apiClient.delete(`/api/trees/admin/realtrees/${selectedTree._id}`);
        
        // For now, we'll just filter it out from state
      setRealTrees((current) =>
          current.filter((tree) => tree._id !== selectedTree._id),
      );
        
      showToast(
          `Real tree ${selectedTree.treeSpecie} has been deleted.`,
        "success",
      );
        
      } catch (err: any) {
        showToast(
          err.response?.data?.message || 'Failed to delete tree',
          "error",
        );
      } finally {
      setShowDeleteModal(false);
      setSelectedTree(null);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Physical Tree Management</h1>
        <p className="text-gray-600">
          Manage and monitor actual trees planted through the application
        </p>
      </div>

      {/* Search and Add New Button */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search trees by species, location or student ID..."
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
              <Button variant="outline" className="bg-white flex items-center">
                <Icon icon={cloudUploadIcon} className="mr-2" />
                Import CSV
              </Button>
              <Button
                variant="primary"
                className="flex items-center"
                onClick={() => {
                  setSelectedTree(null);
                  setShowEditModal(true);
                }}
              >
                <Icon icon={addIcon} className="mr-2" />
                Add New Tree
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Real Trees Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">{error}</div>
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
                  {realTrees.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length} 
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No real trees found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
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
                    ))
                  )}
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

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Tree Record"
        variant="error"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Icon icon={deleteIcon} className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Delete Tree Record
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete the record for{" "}
            {selectedTree?.treeSpecie}? This will only remove the digital record,
            not the actual tree.
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
            Delete Record
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedTree ? "Edit Tree Record" : "Add New Tree Record"}
        variant="info"
      >
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tree Species
              </label>
              <Input
                type="text"
                placeholder="Enter tree species"
                defaultValue={selectedTree?.treeSpecie}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                placeholder="Enter planting location"
                defaultValue={selectedTree?.location}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <Input
                type="text"
                placeholder="Enter student ID"
                defaultValue={selectedTree?.studentId}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select 
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                defaultValue={selectedTree?.stage || "planted"}
              >
                <option value="planted">Planted</option>
                <option value="thriving">Thriving</option>
                <option value="dead">Dead</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea 
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                rows={3}
                placeholder="Additional notes about this tree"
                defaultValue={selectedTree?.notes}
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowEditModal(false);
              showToast(
                `Tree record ${selectedTree ? "updated" : "added"} successfully!`,
                "success",
              );
            }}
          >
            {selectedTree ? "Update" : "Add"} Tree Record
          </Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Tree Details"
        variant="info"
      >
        {selectedTree && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tree Species</h4>
                <p className="text-lg">{selectedTree.treeSpecie}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-lg">{selectedTree.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Planted Date
                </h4>
                <p className="text-lg">
                  {formatDate(selectedTree.plantedDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Student ID
                </h4>
                <p className="text-lg">{selectedTree.studentId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Points Cost</h4>
                <p className="text-lg">{selectedTree.pointsCost} points</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <StatusBadge status={selectedTree.stage} />
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Notes
                </h4>
                <p className="text-lg whitespace-pre-wrap">
                  {selectedTree.notes || 'No additional notes'}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowViewModal(false)}
            className="bg-white"
          >
            Close
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default RealTreesPage;
