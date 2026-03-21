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
import { ListingRentals } from "@/types/listings";
import { useDebounce } from "@/hooks/useDebounce";

import { toast } from "sonner";
import { useSortingFiltersStore } from "@/store/sortingFilters";

import SellerForm from "./add-listing-rentals-form";
import Sheets from "./sheets";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export const sections = [
  { id: "stage", name: "Stage" },
  { id: "landlord", name: "Landlord" },
  { id: "location", name: "Location" },
  { id: "details", name: "Details" },
  { id: "voucher", name: "Voucher" },
  { id: "amenities", name: "Amenities" },
  { id: "brokerage", name: "Brokerage" },
  { id: "agent", name: "Agent" },
  { id: "access", name: "Access" },
];

type FetchSellersParams = {
  search: string;
  status: string;
  type: string;
};

async function fetchLeadsSeller(params: FetchSellersParams) {
  const response = await fetch("/api/listings/fetch", {
    method: "POST",
    body: JSON.stringify({ ...params, mode: "for-rent" }),
  });
  const data = await response.json();

  //console.log("LISTINGS:", data.data.properties);
  return data.data.properties;
}

export function DataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // Get persistent filters from store with fallback defaults
  const storeFilters = useSortingFiltersStore((state) => state?.filters?.listingsAgentsRentals);
  const { setSorting, setStatusFilters } = useSortingFiltersStore();

  // Get statusFilters array from store with memoization
  const statusFilters = useMemo(() => storeFilters?.statusFilters || [], [storeFilters?.statusFilters]);

  // Use stable defaults to prevent re-render loops
  const sorting = useMemo(() => storeFilters?.sorting || [], [storeFilters?.sorting]);

  // Local state for search (not persisted)
  const [searchInput, setSearchInput] = useState("");

  // Local UI state only
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [addListingRentalOpen, setAddListingRentalOpen] = useState(false);

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
    queryKey: ["listingsRentals", debouncedSearch],
    queryFn: () =>
      fetchLeadsSeller({
        search: debouncedSearch,
        status: "",
        type: "",
      }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Prime cache with individual listing details for instant navigation
  useEffect(() => {
    if (allLeadsSellerData) {
      allLeadsSellerData.forEach((listing: ListingRentals) => {
        queryClient.setQueryData(["listing-rental", listing._id], listing);
      });
    }
  }, [allLeadsSellerData, queryClient]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    let data = allLeadsSellerData || [];

    // Filter by status (array-based)
    if (statusFilters.length > 0) {
      data = data.filter((item: ListingRentals) => statusFilters.includes(item.propertyStatus));
    }

    // Filter by search (check fullname and email)
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      data = data.filter((item: ListingRentals) => {
        const fullname = `${item.owner.firstName || ""} ${item.owner.lastName || ""}`.toLowerCase();
        const address =
          `${item.address.streetAddress} ${item.address.parentRegionName} ${item.address.city} ${item.address.state}`.toLowerCase();
        return fullname.includes(searchLower) || address?.includes(searchLower);
      });
    }

    return data;
  }, [allLeadsSellerData, statusFilters, searchInput]);

  const contactsTable = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
      setSorting("listingsAgentsRentals", newSorting);
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

  const handleListingRentalSuccess = () => {
    setAddListingRentalOpen(false);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeletingBulk(true);
    try {
      // Get IDs of selected Sellers
      const ListingRentalsIds = selectedRows.map((row) => (row.original as ListingRentals)._id);

      const response = await fetch("/api/listings/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyIds: ListingRentalsIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete Listings");
      }

      toast.success(`Successfully deleted ${selectedRows.length} Listing${selectedRows.length > 1 ? "s" : ""}`);

      // Reset selection and close dialog
      setRowSelection({});
      setBulkDeleteOpen(false);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["listingsRentals"] });
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete listings. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Bulk delete error:", error);
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
            onClick={() => setStatusFilters("listingsAgentsRentals", [])}
          >
            All
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("active")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("active")
                ? statusFilters.filter((f) => f !== "active")
                : [...statusFilters, "active"];
              setStatusFilters("listingsAgentsRentals", newFilters);
            }}
          >
            Active
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("inContract")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("inContract")
                ? statusFilters.filter((f) => f !== "inContract")
                : [...statusFilters, "inContract"];
              setStatusFilters("listingsAgentsRentals", newFilters);
            }}
          >
            In Contract
          </Badge>
          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("closed")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("closed")
                ? statusFilters.filter((f) => f !== "closed")
                : [...statusFilters, "closed"];
              setStatusFilters("listingsAgentsRentals", newFilters);
            }}
          >
            Closed
          </Badge>

          <Badge
            className={cn(
              "cursor-pointer text-sm font-normal transition-colors",
              statusFilters.includes("dead")
                ? "bg-[#EFFCEE] border border-[#E5E8EB] text-light-text"
                : "bg-transparent text-light-text-secondary hover:bg-gray-100"
            )}
            onClick={() => {
              const newFilters = statusFilters.includes("dead")
                ? statusFilters.filter((f) => f !== "dead")
                : [...statusFilters, "dead"];
              setStatusFilters("listingsAgentsRentals", newFilters);
            }}
          >
            Dead
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
              buttonText="Add Rentals Listing"
              title="Add Listing - Rentals"
              sections={sections}
              open={addListingRentalOpen}
              onOpenChange={setAddListingRentalOpen}
              onSuccess={handleListingRentalSuccess}
              previousListings={allLeadsSellerData}
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
              {selectedCount === 1 ? "Delete Selected Listing" : "Delete Selected Listings"}
            </Button>
          )}
        </div>
      </div>

      <Sheets />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount === 1 ? "Rental Listing" : "Rental Listings"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete {selectedCount} rental listing{selectedCount === 1 ? "" : "s"} and
            all associated information. This action cannot be undone.
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
                `Delete ${selectedCount === 1 ? "Seller" : "Sellers"}`
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
