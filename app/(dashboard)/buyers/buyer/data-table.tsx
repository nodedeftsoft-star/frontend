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
import BuyerForm from "./add-buyer-form";
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

import { Buyer } from "@/types/buyers-agent";

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

type FetchBuyersParams = {
  search: string;
  status: string;
  type: string;
};

async function fetchBuyers(params: FetchBuyersParams) {
  const response = await fetch("/api/buyers/fetch", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json();

  // //console.log("BUYERS:", data);
  return data.data.buyers;
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store with fallback defaults
  const storeFilters = useSortingFiltersStore((state) => state?.filters?.buyersAgentsBuyer);
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
  const [addBuyerOpen, setAddBuyerOpen] = useState(false);
  const queryClient = useQueryClient();

  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch all data once without filters
  const {
    data: allBuyerData,
    isLoading: isBuyersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["buyers", debouncedSearch],
    queryFn: () =>
      fetchBuyers({
        search: debouncedSearch,
        status: "",
        type: "",
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (allBuyerData) {
      allBuyerData.forEach((buyer: Buyer) => {
        queryClient.setQueryData(["buyer", buyer._id], buyer);
      });
    }
  }, [allBuyerData, queryClient]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    let data = allBuyerData || [];

    // Filter by status
    if (statusFilter == "Active") {
      data = data.filter((item: Buyer) => item.isActive);
    }

    if (statusFilter == "Inactive") {
      data = data.filter((item: Buyer) => !item.isActive);
    }

    // Filter by search (check fullname and email)
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      data = data.filter((item: Buyer) => {
        const fullname = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
        return (
          fullname.includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.phoneNumber?.includes(searchInput)
        );
      });
    }

    return data;
  }, [allBuyerData, statusFilter, searchInput]);

  const buyerTable = useReactTable({
    data: filteredData as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: useCallback(
      (updaterOrValue: Updater<SortingState>) => {
        const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
        setSorting("buyersAgentsBuyer", newSorting);
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

  const selectedRows = buyerTable?.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleAddBuyerSuccess = useCallback(() => {
    setAddBuyerOpen(false);
  }, []);

  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setStatusFilter("buyersAgentsBuyer", status);
    },
    [setStatusFilter]
  );

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected buyers
      const buyerIds = selectedRows.map((row) => (row.original as Buyer)._id);

      const response = await fetch("/api/buyers/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buyerIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete buyers");
      }

      toast.success(`Successfully deleted ${selectedRows.length} buyer${selectedRows.length > 1 ? "s" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete buyers. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  if (isBuyersLoading && !searchInput) {
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
              buttonText="Add Buyer"
              title="Add Buyer"
              sections={sections}
              open={addBuyerOpen}
              onOpenChange={setAddBuyerOpen}
              onSuccess={handleAddBuyerSuccess}
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
            <DialogTitle>Delete {selectedCount === 1 ? "Buyer" : "Buyers"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} buyer{selectedCount === 1 ? "" : "s"} and all their
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
              {buyerTable?.getHeaderGroups().map((headerGroup) => (
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
              {buyerTable?.getRowModel().rows?.length ? (
                buyerTable?.getRowModel().rows.map((row) => (
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
