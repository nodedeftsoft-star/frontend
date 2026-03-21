"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ListingRentals } from "@/types/listings";

import { useListingRentalStore } from "@/store/sheets";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

const Actions = ({ ListingsRental }: { ListingsRental: ListingRentals }) => {
  const [open, setOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { openView, openEdit } = useListingRentalStore();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get ID of the listing to delete
      const listingIds = [ListingsRental?._id];

      const response = await fetch("/api/listings/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyIds: listingIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      toast.success(`Successfully deleted listing`);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["listingsRentals"] });
      setOpen(false);
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete listing. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => openView(ListingsRental?._id || ListingsRental?.id)}>
        <Eye size={16} color="#57738E" strokeWidth={1.75} />
      </Button>
      <Button variant="ghost" onClick={() => openEdit(ListingsRental?._id || ListingsRental?.id)}>
        <Pencil size={16} color="#57738E" strokeWidth={1.75} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">
            <Trash2 size={16} color="#c3011c" strokeWidth={1.75} />
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this listing and all its associated information. This action cannot
            be undone.
            <br />
            <br />
            Are you sure you want to proceed?
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" className="bg-[#F9F9F9] border border-[#E5E8EB]" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222]"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const columns: ColumnDef<ListingRentals>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="">
        <Checkbox
          className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="">
        <Checkbox
          className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      headerClassName: "w-12 min-w-12 max-w-12 px-4",
      cellClassName: "w-12 min-w-12 max-w-12",
    },
  },
  {
    accessorFn: (row) =>
      `${row.address.streetAddress} ${row.address.parentRegionName} ${row.address.city} ${row.address.state}`,
    id: "address",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Address
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-left w-[300px] 2xl:w-[400px] overflow-hidden text-ellipsis">
        {`${row.original.address.streetAddress}, ${row.original.address.city}, ${row.original.address.state} ${row.original.address.zipcode}`}
      </div>
    ),
    meta: {
      headerClassName: "border-r border-[#E5E8EB] w-[300px] 2xl:w-[400px]",
      cellClassName: "border-r border-[#E5E8EB] w-[300px] 2xl:w-[400px]",
    },
  },
  {
    accessorKey: "propertyStatus",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stage
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <div
          className={`px-2 py-1 rounded-[8px] ${
            row.original.propertyStatus === "inContract"
              ? "bg-[#fffbeb] text-black border "
              : row.original.propertyStatus === "active"
              ? "bg-[#effcee] text-black border "
              : row.original.propertyStatus === "dead"
              ? "bg-[#ebdbdb] text-black border "
              : row.original.propertyStatus === "closed"
              ? "bg-[#b8efca] text-black border "
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {row.original.propertyStatus === "inContract"
            ? "In Contract"
            : row.original.propertyStatus === "active"
            ? "Active"
            : row.original.propertyStatus === "dead"
            ? "Dead"
            : row.original.propertyStatus === "closed"
            ? "Closed"
            : row.original.propertyStatus}
        </div>
      </div>
    ),
  },

  {
    accessorKey: "attribution.brokerName",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Brokerage
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => <div className="capitalize text-center">{`${row.original.attribution.brokerName || "-"}`}</div>,
  },

  {
    accessorKey: "attribution.agentName",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Agent
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-center w-full">{`${row.original.attribution.agentName || "-"}`}</div>
    ),
  },

  {
    id: "actions",
    cell: ({ row }) => <Actions ListingsRental={row.original} />,
    enableSorting: false,
    enableHiding: false,
    // Custom styling for the actions column
    meta: {
      headerClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
      cellClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
    },
  },
];
