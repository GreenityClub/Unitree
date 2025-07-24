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

// Interface for RealTree data
interface RealTree {
  id: string;
  treeName: string;
  species: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  plantedDate: string;
  plantedBy: string;
  studentId: string;
  status: "healthy" | "needs-attention" | "critical";
  lastInspection: string;
  heightCm: number;
  imageUrl?: string;
}

// Dummy data for real trees
const dummyRealTrees: RealTree[] = Array.from({ length: 15 }, (_, index) => ({
  id: `rt-${index + 1}`,
  treeName: `Tree ${index + 1}`,
  species: ["Oak", "Pine", "Maple", "Cherry", "Birch"][
    Math.floor(Math.random() * 5)
  ],
  location: [
    "Campus Garden",
    "City Park",
    "School Yard",
    "Community Forest",
    "Botanical Garden",
  ][Math.floor(Math.random() * 5)],
  coordinates: {
    latitude: 10.8231 + Math.random() * 0.05,
    longitude: 106.6297 + Math.random() * 0.05,
  },
  plantedDate: new Date(
    2023,
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
  ).toISOString(),
  plantedBy: `Student ${Math.floor(Math.random() * 50) + 1}`,
  studentId: `S${10000 + Math.floor(Math.random() * 1000)}`,
  status: ["healthy", "needs-attention", "critical"][
    Math.floor(Math.random() * 3)
  ] as "healthy" | "needs-attention" | "critical",
  lastInspection: new Date(
    2023,
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
  ).toISOString(),
  heightCm: Math.floor(Math.random() * 300) + 30,
  imageUrl:
    Math.random() > 0.3 ? "https://example.com/tree-image.jpg" : undefined,
}));

// Formatter for dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy");
};

// Status badge component
const StatusBadge: React.FC<{
  status: "healthy" | "needs-attention" | "critical";
}> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "needs-attention":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
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

  const { showToast } = useToast();

  // Column definitions
  const columnHelper = createColumnHelper<RealTree>();
  const columns = [
    columnHelper.accessor("treeName", {
      header: "Tree Name",
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
            <Icon icon={treeIcon} className="text-green-500" />
          </div>
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-xs text-gray-500">
              {info.row.original.species}
            </div>
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
    columnHelper.accessor("plantedBy", {
      header: "Planted By",
      cell: (info) => (
        <div className="flex items-center">
          <Icon icon={userIcon} className="text-gray-500 mr-2" />
          <div>
            <div>{info.getValue()}</div>
            <div className="text-xs text-gray-500">
              ID: {info.row.original.studentId}
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
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("heightCm", {
      header: "Height",
      cell: (info) => `${info.getValue()} cm`,
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
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          setRealTrees(dummyRealTrees);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Failed to fetch real trees:", error);
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
  const confirmDelete = () => {
    if (selectedTree) {
      // Filter out the selected tree
      setRealTrees((current) =>
        current.filter((tree) => tree.id !== selectedTree.id),
      );
      showToast(
        `Real tree ${selectedTree.treeName} has been deleted.`,
        "success",
      );
      setShowDeleteModal(false);
      setSelectedTree(null);
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
                  placeholder="Search trees by name, species, location or planted by..."
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
            {selectedTree?.treeName}? This will only remove the digital record,
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
          <p>Tree record form would go here...</p>
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
            <div className="mb-6 flex justify-center">
              {selectedTree.imageUrl ? (
                <img
                  src={selectedTree.imageUrl}
                  alt={selectedTree.treeName}
                  className="w-full max-w-sm rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full max-w-sm h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Icon icon={treeIcon} className="text-gray-400 text-5xl" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tree Name</h4>
                <p className="text-lg">{selectedTree.treeName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Species</h4>
                <p className="text-lg">{selectedTree.species}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-lg">{selectedTree.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Coordinates
                </h4>
                <p className="text-lg">
                  {selectedTree.coordinates.latitude.toFixed(6)},{" "}
                  {selectedTree.coordinates.longitude.toFixed(6)}
                </p>
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
                  Planted By
                </h4>
                <p className="text-lg">
                  {selectedTree.plantedBy} ({selectedTree.studentId})
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Height</h4>
                <p className="text-lg">{selectedTree.heightCm} cm</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <StatusBadge status={selectedTree.status} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Last Inspection
                </h4>
                <p className="text-lg">
                  {formatDate(selectedTree.lastInspection)}
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
