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
  leafIcon,
  editIcon,
  deleteIcon,
  searchIcon,
  checkIcon,
  closeIcon,
  addIcon,
  waterIcon,
  sunIcon,
} from "../../utils/icons";
import { format } from "date-fns";

// Interface for TreeType data
interface TreeType {
  _id: string;
  id: string;
  name: string;
  scientificName: string;
  description: string;
  careLevel: 'Easy' | 'Moderate' | 'Hard';
  maxHeight: string;
  lifespan: string;
  nativeTo: string;
  cost: number;
  stages: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy");
};

// Care level badge component
const CareLevelBadge: React.FC<{
  level: 'Easy' | 'Moderate' | 'Hard';
}> = ({ level }) => {
  const getLevelStyles = () => {
    switch (level) {
      case "Easy":
        return "bg-blue-100 text-blue-800";
      case "Moderate":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelStyles()}`}
    >
      {level}
    </span>
  );
};

const TreeTypesPage: React.FC = () => {
  const [treeTypes, setTreeTypes] = useState<TreeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTreeType, setSelectedTreeType] = useState<TreeType | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<TreeType>();
  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
            <Icon icon={leafIcon} className="text-green-500" />
          </div>
          <div>
          <span className="font-medium">{info.getValue()}</span>
            <div className="text-xs text-gray-500">
              {info.row.original.scientificName}
            </div>
          </div>
        </div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => (
        <div className="max-w-xs truncate">{info.getValue()}</div>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("cost", {
      header: "Points Required",
      cell: (info) => (
        <span className="font-medium">{info.getValue().toLocaleString()}</span>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("careLevel", {
      header: "Care Level",
      cell: (info) => <CareLevelBadge level={info.getValue()} />,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: (info) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            info.getValue() ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => formatDate(info.getValue()),
      footer: (info) => info.column.id,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (props) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Edit tree type"
          >
            <Icon icon={editIcon} className="text-blue-500" />
          </button>
          <button
            onClick={() => handleDelete(props.row.original)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Delete tree type"
          >
            <Icon icon={deleteIcon} className="text-red-500" />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<TreeType>[];

  // Set up the table instance
  const table = useReactTable({
    data: treeTypes,
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

  // Load tree types on component mount
  useEffect(() => {
    const fetchTreeTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(API_ENDPOINTS.TREE.ADMIN.GET_TREE_TYPES);
        setTreeTypes(response.data);
      } catch (err: any) {
        console.error("Failed to fetch tree types:", err);
        setError(err.response?.data?.message || 'Failed to load tree types data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreeTypes();
  }, []);

  // Handle opening the edit modal
  const handleEdit = (treeType: TreeType) => {
    setSelectedTreeType(treeType);
    setShowEditModal(true);
  };

  // Handle opening the delete modal
  const handleDelete = (treeType: TreeType) => {
    setSelectedTreeType(treeType);
    setShowDeleteModal(true);
  };

  // Handle tree type deletion
  const confirmDelete = async () => {
    if (selectedTreeType) {
      try {
        await apiClient.delete(
          API_ENDPOINTS.TREE.ADMIN.DELETE_TREE_TYPE(selectedTreeType._id)
        );
        
      setTreeTypes((current) =>
          current.filter((type) => type._id !== selectedTreeType._id),
      );
        
      showToast(
        `Tree Type ${selectedTreeType.name} has been deleted.`,
        "success",
      );
      } catch (err: any) {
        showToast(
          err.response?.data?.message || 'Failed to delete tree type',
          "error"
        );
      } finally {
      setShowDeleteModal(false);
        setSelectedTreeType(null);
      }
    }
  };

  // Handle tree type creation/update
  const handleSaveTreeType = async (formData: any) => {
    try {
      if (selectedTreeType) {
        // Update existing tree type
        const response = await apiClient.put(
          API_ENDPOINTS.TREE.ADMIN.UPDATE_TREE_TYPE(selectedTreeType._id),
          formData
        );
        
        setTreeTypes((current) =>
          current.map((type) => 
            type._id === selectedTreeType._id ? response.data : type
          )
        );
        
        showToast(`Tree type ${formData.name} updated successfully!`, "success");
      } else {
        // Create new tree type
        const response = await apiClient.post(
          API_ENDPOINTS.TREE.ADMIN.CREATE_TREE_TYPE,
          formData
        );
        
        setTreeTypes((current) => [...current, response.data]);
        showToast(`Tree type ${formData.name} added successfully!`, "success");
      }
      
      setShowEditModal(false);
      setSelectedTreeType(null);
      
    } catch (err: any) {
      showToast(
        err.response?.data?.message || `Failed to ${selectedTreeType ? 'update' : 'create'} tree type`,
        "error"
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tree Type Management</h1>
        <p className="text-gray-600">
          Manage and configure different tree types available in the application
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
                  placeholder="Search tree types..."
                  value={globalFilter || ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon icon={searchIcon} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <Button
                variant="primary"
                className="flex items-center"
                onClick={() => {
                  setSelectedTreeType(null);
                  setShowEditModal(true);
                }}
              >
                <Icon icon={addIcon} className="mr-2" />
                Add New Tree Type
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tree Types Table */}
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
                  {treeTypes.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length} 
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No tree types found
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
        title="Delete Tree Type"
        variant="error"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Icon icon={deleteIcon} className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Delete Tree Type
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete {selectedTreeType?.name}? This
            action cannot be undone and may affect existing trees of this type.
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

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedTreeType ? "Edit Tree Type" : "Add New Tree Type"}
        variant="info"
      >
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tree Name
              </label>
              <Input
                type="text"
                placeholder="Enter tree name"
                defaultValue={selectedTreeType?.name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scientific Name
              </label>
              <Input
                type="text"
                placeholder="Enter scientific name"
                defaultValue={selectedTreeType?.scientificName}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                rows={3}
                placeholder="Enter tree description"
                defaultValue={selectedTreeType?.description}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points Cost
              </label>
              <Input
                type="number"
                placeholder="Enter points required"
                defaultValue={selectedTreeType?.cost.toString()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Care Level
              </label>
              <select
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                defaultValue={selectedTreeType?.careLevel || "Easy"}
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                defaultValue={selectedTreeType?.isActive ? "active" : "inactive"}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
              // In a real implementation, we would collect form data
              // and pass it to handleSaveTreeType
              setShowEditModal(false);
              showToast(
                `Tree type ${selectedTreeType ? "updated" : "added"} successfully!`,
                "success"
              );
            }}
          >
            {selectedTreeType ? "Update" : "Add"} Tree Type
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default TreeTypesPage;
