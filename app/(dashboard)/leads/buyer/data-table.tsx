"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, Trash2, Loader2, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

import Filters from "@/components/ui/filters";
import BuyerForm from "./add-buyer-form";
import FormSheet from "@/components/ui/form-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainPageSkeleton from "@/components/main-page-skeleton";
import { BulkImportTemplate, LeadsBuyer } from "@/types/leads";
import { useDebounce } from "@/hooks/useDebounce";
import { parseExcelBuyerFile, validateFile } from "@/lib/bulkUpload";
import { toast } from "sonner";
import { useSortingFiltersStore } from "@/store/sortingFilters";
import Sheets from "./sheets";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export const sections = [
  { id: "leadtype", name: "Lead Type" },
  { id: "personalinformation", name: "Personal Information" },
  { id: "preferences", name: "Preferences" },
  { id: "financials", name: "Financials" },
  { id: "amenities", name: "Amenities" },
  { id: "buyernotes", name: "Buyer Notes" },
];

type FetchBuyersParams = {
  search: string;
  status: string;
  type: string;
};

async function fetchLeadsBuyers(params: FetchBuyersParams) {
  const response = await fetch("/api/leads/buyer/fetch", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json();

  // //console.log("LEADS BUYER:", data);
  return data.data.buyers;
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store
  const {
    sorting,
    statusFilter,
    typeFilter: leadTypeFilter,
  } = useSortingFiltersStore((state) => state.filters.leadsBuyers);
  const { setSorting, setStatusFilter, setTypeFilter } = useSortingFiltersStore();

  // Local state for search (not persisted)
  const [searchInput, setSearchInput] = useState("");

  // Local UI state only
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [open, setOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [addLeadBuyerOpen, setAddLeadBuyerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Bulk import states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BulkImportTemplate[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Sections as objects with both display name and DOM ID

  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch all data once without filters
  const {
    data: allLeadsBuyerData,
    isLoading: isLeadsBuyersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["leadsBuyers", debouncedSearch],
    queryFn: () =>
      fetchLeadsBuyers({
        search: debouncedSearch,
        status: "",
        type: "",
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (allLeadsBuyerData) {
      allLeadsBuyerData.forEach((leadBuyer: LeadsBuyer) => {
        queryClient.setQueryData(["lead-buyer", leadBuyer._id], leadBuyer);
      });
    }
  }, [allLeadsBuyerData, queryClient]);

  // Compute the type filter value
  const typeFilter = useMemo(() => {
    return leadTypeFilter.length === 1 ? leadTypeFilter[0] : "";
  }, [leadTypeFilter]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    let data = allLeadsBuyerData || [];

    // Filter by status
    if (statusFilter) {
      data = data.filter((item: LeadsBuyer) => item.status === statusFilter);
    }

    // Filter by lead type
    if (typeFilter) {
      data = data.filter((item: LeadsBuyer) => item.leadType === typeFilter);
    }

    // Filter by search (check fullname and email)
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      data = data.filter((item: LeadsBuyer) => {
        const fullname = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
        return (
          fullname.includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.phoneNumber?.includes(searchInput)
        );
      });
    }

    return data;
  }, [allLeadsBuyerData, statusFilter, typeFilter, searchInput]);

  const contactsTable = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
      setSorting("leadsBuyers", newSorting);
    },
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedRows = contactsTable?.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleLeadAddBuyerSuccess = () => {
    setAddLeadBuyerOpen(false);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadedFile(file);
    setParseErrors([]);

    // Parse the Excel file
    const { data, errors } = await parseExcelBuyerFile(file);
    setParsedData(data);
    // //console.log("PARSED DATA:", data);
    setParseErrors(errors);

    if (errors.length > 0) {
      toast.warning(`Found ${data.length} valid contacts with ${errors.length} errors`);
    } else if (data.length > 0) {
      toast.success(`Found ${data.length} valid contacts`);
    } else {
      toast.error("No valid contacts found in the file");
    }
  };

  // Handle bulk upload to API
  const handleBulkUpload = async () => {
    if (!parsedData.length) return;

    setIsUploading(true);
    try {
      const response = await fetch("/api/leads/buyer/bulk-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error("Failed to upload leads");
      }

      const _result = await response.json();
      // //console.log("RESULt:", result);
      toast.success(`Successfully uploaded ${parsedData.length} leads`);

      // Reset states and close dialog
      setOpen(false);
      setUploadedFile(null);
      setParsedData([]);
      setParseErrors([]);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });
    } catch (_error) {
      toast.error("Failed to upload leads. Please try again.");
      // console.error("Bulk upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset dialog state when closed
  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setUploadedFile(null);
      setParsedData([]);
      setParseErrors([]);
      setIsDragging(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected buyers
      const leadBuyersIds = selectedRows.map((row) => (row.original as LeadsBuyer)._id);

      const response = await fetch("/api/leads/buyer/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadBuyersIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete buyers");
      }

      toast.success(`Successfully deleted ${selectedRows.length} buyer${selectedRows.length > 1 ? "s" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });
    } catch (_error) {
      toast.error("Failed to delete buyers. Please try again.");
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  if (isLeadsBuyersLoading && !searchInput) {
    return <MainPageSkeleton />;
  }

  return (
    <div className="relative pb-[100px]">
      <div className="flex items-center justify-between mb-4 sm:sticky top-[1px] z-1 bg-white">
        <div className="flex gap-2">
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilter === ""
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => setStatusFilter("leadsBuyers", "")}
          >
            All
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilter === "Active"
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => setStatusFilter("leadsBuyers", "Active")}
          >
            Active
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilter === "Inactive"
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => setStatusFilter("leadsBuyers", "Inactive")}
          >
            Inactive
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center py-4 relative">
            <Search size={16} className="absolute left-4 text-light-text-secondary" />
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-10 w-[223px] h-[32px]"
            />
            {isFetching && <Loader2 size={16} className="absolute right-4 text-light-text-secondary animate-spin" />}
          </div>

          <Filters
            title="Lead Type"
            filters={[
              { label: "Hot", value: "Hot" },
              { label: "Cold", value: "Cold" },
            ]}
            onFilterChange={(filter, checked) => {
              const newFilters = checked ? [...leadTypeFilter, filter] : leadTypeFilter.filter((f) => f !== filter);
              setTypeFilter("leadsBuyers", newFilters);
            }}
            value={leadTypeFilter}
          />
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-neutral-200 hover:bg-neutral-200/90 text-black font-normal">
                <Upload size={16} strokeWidth={1.75} /> Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="sm:min-w-[500px] !sm:max-w-[500px] w-full rounded-b-lg p-6"
            >
              <DialogHeader>
                <DialogTitle className="flex flex-col gap-2">
                  <p className="text-light-text-secondary text-sm font-normal">
                    {uploadedFile ? "Step 2 of 2" : "Step 1 of 2"}
                  </p>
                  <p className=" text-md font-bold">
                    {uploadedFile ? "Review uploaded contacts" : "Upload a file with contacts"}
                  </p>
                  <p className="text-light-text-secondary text-sm font-normal mt-2">
                    {uploadedFile
                      ? "Review the contacts found in your file before uploading."
                      : "Please upload Excel files (.xlsx) and make sure the file size is under 12 MB."}
                  </p>
                </DialogTitle>
                <Separator />
              </DialogHeader>
              <DialogDescription>
                Upload Contacts for: <span className="font-bold text-black">Buyer</span>
              </DialogDescription>
              <div className="space-y-4">
                {!uploadedFile ? (
                  <label
                    className={cn(
                      "border border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-36 mt-2 cursor-pointer transition-colors",
                      isDragging
                        ? "border-blue-500 bg-blue-100 scale-[1.02]"
                        : "border-blue-300 bg-blue-50 hover:bg-blue-100"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.currentTarget === e.target) {
                        setIsDragging(false);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);

                      const files = e.dataTransfer?.files;
                      if (files && files.length > 0) {
                        const file = files[0];
                        handleFileUpload(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <Upload className={cn("w-8 h-8 mb-2", isDragging ? "text-blue-600" : "text-blue-500")} />
                    <span
                      className={cn("text-sm font-normal", isDragging ? "text-blue-900" : "text-light-text-secondary")}
                    >
                      {isDragging ? (
                        "Drop your file here"
                      ) : (
                        <>
                          Drop file or <span className="text-primary">click to browse</span>
                        </>
                      )}
                    </span>
                    <span
                      className={cn("text-sm font-normal", isDragging ? "text-blue-800" : "text-light-text-secondary")}
                    >
                      Format: Excel (.xlsx) & max. file size: 12 MB
                    </span>
                  </label>
                ) : (
                  <div className="mt-4 space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div className="flex-1">
                        <span className="font-medium text-sm block">{uploadedFile.name}</span>
                        <span className="text-xs text-gray-600 block">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      {parsedData.length > 0 && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>

                    {/* Contact Count */}
                    {parsedData.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-900 block">
                          {parsedData.length} contacts found
                        </span>
                        {parseErrors.length > 0 && (
                          <span className="text-xs text-orange-600 mt-1 block">
                            {parseErrors.length} rows had errors and were skipped
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error List */}
                    {parseErrors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium text-red-900 mb-2 block">Errors:</span>
                        {parseErrors.slice(0, 5).map((error, idx) => (
                          <span key={idx} className="text-xs text-red-700 block">
                            • {error}
                          </span>
                        ))}
                        {parseErrors.length > 5 && (
                          <span className="text-xs text-red-700 mt-1 block">
                            ... and {parseErrors.length - 5} more errors
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!uploadedFile && (
                <div className="mb-4 p-3 rounded-lg flex justify-center">
                  <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
                    <a href="/templates/import_buyer_renter.xlsx" download="import_buyer_renter.xlsx">
                      <Download className="w-4 h-4" />
                      Download Excel Template
                    </a>
                  </Button>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="bg-[#F9F9F9] border border-[#E5E8EB]"
                  onClick={() => handleDialogClose(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                {!uploadedFile ? (
                  <Button className="bg-primary hover:bg-primary/90" disabled>
                    Upload to Continue
                  </Button>
                ) : (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleBulkUpload}
                    disabled={parsedData.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Confirm Upload (${parsedData.length})`
                    )}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedCount === 0 ? (
            <FormSheet
              buttonText="Add Buyer"
              title="Add Buyer"
              sections={sections}
              open={addLeadBuyerOpen}
              onOpenChange={setAddLeadBuyerOpen}
              onSuccess={handleLeadAddBuyerSuccess}
            >
              <BuyerForm />
            </FormSheet>
          ) : (
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222] flex items-center gap-2"
            >
              <Trash2 size={16} color="#c3011c" />
              {selectedCount === 1 ? "Delete Selected Buyer" : "Delete Selected Buyers"}
            </Button>
          )}
        </div>
      </div>

      <Sheets />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount === 1 ? "Buyer Lead" : "Buyer Leads"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} buyer lead{selectedCount === 1 ? "" : "s"} and all
            their associated information. This action cannot be undone.
            <br />
            <br />
            Are you sure you want to proceed?
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="ghost"
              className="bg-[#F9F9F9] border border-[#E5E8EB]"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={isDeletingBulk}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222]"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
            >
              {isDeletingBulk ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedCount === 1 ? "Buyer" : "Buyers"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[calc(100vh-220px)] overflow-auto relative">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b rounded-t border-[#E5E8EB] sticky top-0 z-10 bg-[#F9F9F9]">
              {contactsTable.getHeaderGroups().map((headerGroup) => (
                <TableRow className="rounded-t-2xl bg-[#F9F9F9] hover:bg-[#F9F9F9]" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { headerClassName?: string } | undefined;
                    return (
                      <TableHead key={header.id} className={cn(meta?.headerClassName)}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </thead>
            <TableBody>
              {contactsTable.getRowModel().rows?.length ? (
                contactsTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                      return (
                        <TableCell key={cell.id} className={cn(meta?.cellClassName)}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>
    </div>
  );
}
