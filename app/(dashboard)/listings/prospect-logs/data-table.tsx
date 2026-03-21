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
import { useEffect, useMemo, useState } from "react";
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

import FormSheet from "@/components/ui/form-sheet";
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
import { ListingSales, Prospect } from "@/types/listings";
import { useDebounce } from "@/hooks/useDebounce";

import { toast } from "sonner";
import { useSortingFiltersStore } from "@/store/sortingFilters";
import SellerForm from "./add-prospect-logs-form";

import Filters from "@/components/ui/filters";

import Sheets from "./sheets";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export const sections = [
  { id: "personalInformation", name: "Personal Information" },
  { id: "preferences", name: "Preferences" },
  { id: "financials", name: "Financials" },
  { id: "amenities", name: "Amenities" },
  { id: "notes", name: "Notes" },
];

type FetchSellersParams = {
  search: string;
  status: string;
  type: string;
};

async function fetchLeadsSeller(params: FetchSellersParams) {
  const response = await fetch("/api/prospects/fetch", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json();

  return data.data.prospects;
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store with fallback defaults
  const storeFilters = useSortingFiltersStore((state) => state?.filters?.listingsAgentsProspects);
  const { setSorting, setStatusFilters, setTypeFilter } = useSortingFiltersStore();

  // Get statusFilters array from store with memoization
  const statusFilters = useMemo(() => storeFilters?.statusFilters || [], [storeFilters?.statusFilters]);

  // Use stable defaults to prevent re-render loops
  const sorting = useMemo(() => storeFilters?.sorting || [], [storeFilters?.sorting]);
  const typeFilter = useMemo(() => storeFilters?.typeFilter || [], [storeFilters?.typeFilter]);

  // Local state for search (not persisted)
  const [searchInput, setSearchInput] = useState("");

  // Local UI state only
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [addListingSaleOpen, setAddListingSaleOpen] = useState(false);
  const queryClient = useQueryClient();
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Bulk import states

  // Sections as objects with both display name and DOM ID

  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch all data once without filters
  const {
    data: allLeadsSellerData,
    isLoading: isLeadsSellersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["listingsProspects", debouncedSearch],
    queryFn: () =>
      fetchLeadsSeller({
        search: debouncedSearch,
        status: "",
        type: "",
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (allLeadsSellerData) {
      allLeadsSellerData.forEach((listing: ListingSales) => {
        queryClient.setQueryData(["prospect", listing._id], listing);
      });
    }
  }, [allLeadsSellerData, queryClient]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    let data = allLeadsSellerData || [];

    // Filter by status (array-based)
    if (statusFilters.length > 0) {
      data = data.filter((item: Prospect) => statusFilters.includes(item.prospectType));
    }

    // Filter by search (check fullname and email)
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      data = data.filter((item: Prospect) => {
        const fullname = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
        const address =
          `${item?.property?.address?.streetAddress} ${item?.property?.address?.parentRegionName} ${item?.property?.address?.city} ${item?.property?.address?.state}`.toLowerCase();
        return fullname.includes(searchLower) || address?.includes(searchLower);
      });
    }

    if (typeFilter.length > 0) {
      data = data.filter((match: Prospect) => typeFilter.includes(match.prospectStatus?.toLowerCase() || ""));
    }

    return data;
  }, [allLeadsSellerData, statusFilters, searchInput, typeFilter]);

  const contactsTable = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
      setSorting("listingsAgentsProspects", newSorting);
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

  const handleListingSaleSuccess = () => {
    setAddListingSaleOpen(false);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected Sellers
      const ListingSalesIds = selectedRows.map((row) => (row.original as ListingSales)._id);

      const response = await fetch("/api/prospects/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prospectIds: ListingSalesIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete Prospects");
      }

      toast.success(`Successfully deleted ${selectedRows.length} Prospect${selectedRows.length > 1 ? "s" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });
    } catch (error) {
      toast("Error", {
        description: "Failed to delete Prospects. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      console.error("Bulk delete error:", error);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  if (isLeadsSellersLoading && !searchInput) {
    return <MainPageSkeleton />;
  }

  return (
    <div className="relative pb-[100px]">
      <div className="flex items-center justify-between mb-4 sm:sticky top-[1px] z-1 bg-white">
        <div className="flex gap-2">
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.length === 0
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => setStatusFilters("listingsAgentsProspects", [])}
          >
            All
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("Buyer")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("Buyer")
                ? statusFilters.filter((f) => f !== "Buyer")
                : [...statusFilters, "Buyer"];
              setStatusFilters("listingsAgentsProspects", newFilters);
            }}
          >
            Buyer
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("Renter")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("Renter")
                ? statusFilters.filter((f) => f !== "Renter")
                : [...statusFilters, "Renter"];
              setStatusFilters("listingsAgentsProspects", newFilters);
            }}
          >
            Renter
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("Agent")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("Agent")
                ? statusFilters.filter((f) => f !== "Agent")
                : [...statusFilters, "Agent"];
              setStatusFilters("listingsAgentsProspects", newFilters);
            }}
          >
            Agent
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
            title="Status"
            filters={[
              { value: "follow up", label: "Follow Up" },
              { value: "pending", label: "Scheduled" },
              { value: "converted", label: "Converted" },
              { value: "dead", label: "Dead" },
            ]}
            onFilterChange={(filter, checked) => {
              const lowerFilter = filter.toLowerCase();
              const newFilters = checked
                ? [...typeFilter, lowerFilter]
                : typeFilter.filter((f: string) => f !== lowerFilter);
              setTypeFilter("listingsAgentsProspects", newFilters);
            }}
            value={typeFilter}
          />

          {selectedCount === 0 ? (
            <FormSheet
              buttonText="Add Prospect"
              title="Add Prospect"
              sections={sections}
              open={addListingSaleOpen}
              onOpenChange={setAddListingSaleOpen}
              onSuccess={handleListingSaleSuccess}
            >
              <SellerForm />
            </FormSheet>
          ) : (
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222] flex items-center gap-2"
            >
              <Trash2 size={16} color="#c3011c" />
              {selectedCount === 1 ? "Delete Selected Prospect" : "Delete Selected Prospects"}
            </Button>
          )}
        </div>
      </div>

      <Sheets />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount === 1 ? "Prospect" : "Prospects"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} prospect{selectedCount === 1 ? "" : "s"} and all
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
                `Delete ${selectedCount === 1 ? "Prospect" : "Prospects"}`
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
              {contactsTable?.getRowModel().rows?.length ? (
                contactsTable?.getRowModel().rows.map((row) => (
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
