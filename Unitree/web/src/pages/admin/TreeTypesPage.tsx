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
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  growthTime: number;
  waterRequirement: "low" | "medium" | "high";
  sunRequirement: "low" | "medium" | "high";
  createdAt: string;
}

// Dummy tree type data
const dummyTreeTypes: TreeType[] = Array.from({ length: 10 }, (_, index) => ({
  id: `type-${index + 1}`,
  name: `Tree Type ${index + 1}`,
  description: `Description for tree type ${index + 1}`,
  pointsRequired: Math.floor(Math.random() * 5000),
  growthTime: Math.floor(Math.random() * 30) + 10, // days
  waterRequirement: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as
    | "low"
    | "medium"
    | "high",
  sunRequirement: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as
    | "low"
    | "medium"
    | "high",
  createdAt: new Date(
    2023,
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
  ).toISOString(),
}));

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy");
};

// Requirement badge component
const RequirementBadge: React.FC<{
  level: "low" | "medium" | "high";
  type: "water" | "sun";
}> = ({ level, type }) => {
  const getLevelStyles = () => {
    switch (level) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getLevelStyles()}`}
    >
      <Icon icon={type === "water" ? waterIcon : sunIcon} className="mr-1" />
      {level.charAt(0).toUpperCase() + level.slice(1)}
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
          <span className="font-medium">{info.getValue()}</span>
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
    columnHelper.accessor("pointsRequired", {
      header: "Points Required",
      cell: (info) => (
        <span className="font-medium">{info.getValue().toLocaleString()}</span>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("growthTime", {
      header: "Growth Time (Days)",
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("waterRequirement", {
      header: "Water Needs",
      cell: (info) => <RequirementBadge level={info.getValue()} type="water" />,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("sunRequirement", {
      header: "Sun Needs",
      cell: (info) => <RequirementBadge level={info.getValue()} type="sun" />,
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
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          setTreeTypes(dummyTreeTypes);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Failed to fetch tree types:", error);
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
  const confirmDelete = () => {
    if (selectedTreeType) {
      // Filter out the selected tree type
      setTreeTypes((current) =>
        current.filter((treeType) => treeType.id !== selectedTreeType.id),
      );
      showToast(
        `Tree Type ${selectedTreeType.name} has been deleted.`,
        "success",
      );
      setShowDeleteModal(false);
      setSelectedTreeType(null);
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
                onClick={() => setShowEditModal(true)}
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
            action cannot be undone.
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
        title={selectedTreeType ? "Edit Tree Type" : "Add New Tree Type"}
        variant="info"
      >
        <div className="mb-6">
          <p>Tree type form would go here...</p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
            className="bg-white mr-3"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowEditModal(false);
              showToast(
                `Tree type ${selectedTreeType ? "updated" : "added"} successfully!`,
                "success",
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
