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
import { Search, Trash2, Loader2 } from "lucide-react";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainPageSkeleton from "@/components/main-page-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useSortingFiltersStore } from "@/store/sortingFilters";
import { matchData } from "@/types/matches";
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
  stage: string[];
};

async function fetchLeadsBuyers(params: FetchBuyersParams) {
  const response = await fetch("/api/match/buyers", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json();

  //console.log("SALES MATCHES:", data);
  return data.data.matches.filter((match: matchData) => match.customer);
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store
  const storeFilters = useSortingFiltersStore((state) => state?.filters?.matchesSales);
  const { setSorting, setStatusFilter, setTypeFilter } = useSortingFiltersStore();

  // Use stable defaults to prevent re-render loops
  const sorting = useMemo(() => storeFilters?.sorting || [], [storeFilters?.sorting]);
  const typeFilter = useMemo(() => storeFilters?.typeFilter || [], [storeFilters?.typeFilter]);
  const statusFilter = storeFilters?.statusFilter || "";

  // Local state for search (not persisted)
  const [searchInput, setSearchInput] = useState("");

  // Local UI state only
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  const queryClient = useQueryClient();

  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  // Sections as objects with both display name and DOM ID

  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch data with search only - status and stage filtering will be done locally
  const {
    data: allLeadsBuyerData,
    isLoading: isLeadsBuyersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["matchesSales", debouncedSearch],
    queryFn: () =>
      fetchLeadsBuyers({
        search: debouncedSearch,
        status: "", // Don't filter by status in API
        stage: [], // Don't filter by stage in API
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Prime cache with individual match details for instant navigation
  useEffect(() => {
    if (allLeadsBuyerData) {
      allLeadsBuyerData.forEach((match: matchData) => {
        queryClient.setQueryData(["match-sale", match._id], match);
      });
    }
  }, [allLeadsBuyerData, queryClient]);

  // Apply local filtering for status and stage
  const filteredData = useMemo(() => {
    if (!allLeadsBuyerData) return [];

    let filtered = [...allLeadsBuyerData];

    // Apply status filter locally
    if (statusFilter) {
      filtered = filtered.filter((match: matchData) => match?.status === statusFilter);
    }

    // Apply stage filter locally
    if (typeFilter.length > 0) {
      filtered = filtered.filter((match: matchData) => typeFilter.includes(match.stage?.toLowerCase() || ""));
    }

    return filtered;
  }, [allLeadsBuyerData, statusFilter, typeFilter]);

  const contactsTable = useReactTable({
    data: filteredData as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
      setSorting("matchesSales", newSorting);
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

  // Handle file upload

  // Reset dialog state when closed

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected matches
      const matchIds = selectedRows.map((row) => (row.original as matchData)._id);

      const response = await fetch("/api/match/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete matches");
      }

      toast.success(`Successfully deleted ${selectedRows.length} match${selectedRows.length > 1 ? "es" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["matchesSales"] });
    } catch (error) {
      toast("Error", {
        description: "Failed to delete matches. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      console.error("Bulk delete error:", error);
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
            onClick={() => setStatusFilter("matchesSales", "")}
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
            onClick={() => setStatusFilter("matchesSales", "Active")}
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
            onClick={() => setStatusFilter("matchesSales", "Inactive")}
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
            title="Match Stages"
            filters={[
              { value: "Shown", label: "Shown" },
              { value: "Offer sent", label: "Offer Sent" },
              { value: "Counter offer", label: "Counter Offer" },
              { value: "Accepted", label: "Accepted" },
              { value: "Inspection", label: "Inspection" },
              { value: "In contract", label: "In Contract" },
              { value: "Closing set", label: "Closing Set" },
              { value: "Closed", label: "Closed" },
              { value: "Rejected", label: "Rejected" },
              { value: "Backup offer", label: "Backup Offer" },
              { value: "Lost interest", label: "Lost Interest" },
              { value: "Dead", label: "Dead" },
            ]}
            onFilterChange={(filter, checked) => {
              const lowerFilter = filter.toLowerCase();
              const newFilters = checked
                ? [...typeFilter, lowerFilter]
                : typeFilter.filter((f: string) => f !== lowerFilter);
              setTypeFilter("matchesSales", newFilters);
            }}
            value={typeFilter}
          />

          {selectedCount > 0 && (
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222] flex items-center gap-2"
            >
              <Trash2 size={16} color="#c3011c" />
              {selectedCount === 1 ? "Delete Selected Match" : "Delete Selected Matches"}
            </Button>
          )}
        </div>
      </div>

      <Sheets />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount === 1 ? "Sales Match" : "Sales Matches"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} sales match{selectedCount === 1 ? "" : "es"} and all
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
