"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  Updater,
} from "@tanstack/react-table";

import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RenterForm from "./add-renter-form";
import FormSheet from "@/components/ui/form-sheet";
import MainPageSkeleton from "@/components/main-page-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useSortingFiltersStore } from "@/store/sortingFilters";

import { Renter } from "@/types/buyers-agent";

import { toast } from "sonner";
import Sheets from "./sheets";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export const sections = [
  { id: "personalinformation", name: "Personal Information" },
  { id: "preferences", name: "Preferences" },
  { id: "financials", name: "Financials" },
  { id: "amenities", name: "Amenities" },
  { id: "notes", name: "Notes" },
];

type FetchRenterParams = {
  search: string;
  status: string;
  type: string;
};

async function fetchRenters(params: FetchRenterParams) {
  const response = await fetch("/api/renters/fetch", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json();

  ////console.log("RENTERS:", data);
  return data.data.renters;
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store with fallback defaults
  const storeFilters = useSortingFiltersStore((state) => state?.filters?.buyersAgentsRenter);
  const { setSorting, setStatusFilter } = useSortingFiltersStore();

  // Use stable defaults to prevent re-render loops
  const sorting = useMemo(() => storeFilters?.sorting || [], [storeFilters?.sorting]);
  const statusFilter = storeFilters?.statusFilter || "";

  // Local state for search (not persisted)
  const [searchInput, setSearchInput] = useState("");

  // Local UI state only
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [addRenterOpen, setAddRenterOpen] = useState(false);
  const queryClient = useQueryClient();

  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch all data once without filters
  const {
    data: allRenterData,
    isLoading: isRentersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["renters", debouncedSearch],
    queryFn: () =>
      fetchRenters({
        search: debouncedSearch,
        status: "",
        type: "",
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (allRenterData) {
      allRenterData.forEach((renter: Renter) => {
        queryClient.setQueryData(["renter", renter._id], renter);
      });
    }
  }, [allRenterData, queryClient]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    let data = allRenterData || [];

    // Filter by status
    if (statusFilter == "Active") {
      data = data.filter((item: Renter) => item.isActive);
    }

    if (statusFilter == "Inactive") {
      data = data.filter((item: Renter) => !item.isActive);
    }

    // Filter by search (check fullname and email)
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      data = data.filter((item: Renter) => {
        const fullname = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
        return (
          fullname.includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.phoneNumber?.includes(searchInput)
        );
      });
    }

    return data;
  }, [allRenterData, statusFilter, searchInput]);

  const renterTable = useReactTable({
    data: filteredData as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: useCallback(
      (updaterOrValue: Updater<SortingState>) => {
        const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
        setSorting("buyersAgentsRenter", newSorting);
      },
      [sorting, setSorting]
    ),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedRows = renterTable?.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleAddRenterSuccess = useCallback(() => {
    setAddRenterOpen(false);
  }, []);

  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setStatusFilter("buyersAgentsRenter", status);
    },
    [setStatusFilter]
  );

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected renters
      const renterIds = selectedRows.map((row) => (row.original as Renter)._id);

      const response = await fetch("/api/renters/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ renterIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete renters");
      }

      toast.success(`Successfully deleted ${selectedRows.length} renter${selectedRows.length > 1 ? "s" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["renters"] });
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete renters. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  if (isRentersLoading && !searchInput) {
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
            onClick={() => handleStatusFilterChange("")}
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
            onClick={() => handleStatusFilterChange("Active")}
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
            onClick={() => handleStatusFilterChange("Inactive")}
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

          {selectedCount === 0 ? (
            <FormSheet
              buttonText="Add Renter"
              title="Add Renter"
              sections={sections}
              open={addRenterOpen}
              onOpenChange={setAddRenterOpen}
              onSuccess={handleAddRenterSuccess}
            >
              <RenterForm />
            </FormSheet>
          ) : (
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222] flex items-center gap-2"
            >
              <Trash2 size={16} color="#c3011c" />
              {selectedCount === 1 ? "Delete Selected Renter" : "Delete Selected Renters"}
            </Button>
          )}
        </div>
      </div>

      <Sheets />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount === 1 ? "Renter" : "Renters"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} renter{selectedCount === 1 ? "" : "s"} and all their
            associated information. This action cannot be undone.
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
                `Delete ${selectedCount === 1 ? "Renter" : "Renters"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[calc(100vh-220px)] overflow-auto relative">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b rounded-t border-[#E5E8EB] sticky top-0 z-10 bg-[#F9F9F9]">
              {renterTable?.getHeaderGroups().map((headerGroup) => (
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
              {renterTable?.getRowModel().rows?.length ? (
                renterTable?.getRowModel().rows.map((row) => (
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
