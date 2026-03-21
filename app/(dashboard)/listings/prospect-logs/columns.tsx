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

import { Prospect } from "@/types/listings";

import { useProspectSheetsStore } from "@/store/sheets";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

const Actions = ({ Prospect }: { Prospect: Prospect }) => {
  const [open, setOpen] = useState(false);
  // const [viewLeadBuyer, setViewLeadBuyer] = useState(false);
  // const [editLeadBuyerOpen, setEditLeadBuyerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { openView, openEdit } = useProspectSheetsStore();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get ID of the prospect to delete
      const prospectIds = [Prospect?._id];

      const response = await fetch("/api/prospects/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prospectIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete prospect");
      }

      toast.success("Successfully deleted prospect");

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });
      setOpen(false);
    } catch (error) {
      toast("Error", {
        description: "Failed to delete prospect. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => openView(Prospect?._id || Prospect?.id)}>
        <Eye size={16} color="#57738E" strokeWidth={1.75} />
      </Button>
      <Button variant="ghost" onClick={() => openEdit(Prospect?._id || Prospect?.id)}>
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
            <DialogTitle>Delete Prospect</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this prospect and all its associated information. This action cannot
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

export const columns: ColumnDef<Prospect>[] = [
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
      `${row?.property?.address?.streetAddress} ${row?.property?.address?.parentRegionName} ${row?.property?.address?.city}, ${row?.property?.address?.state} ${row?.property?.address?.zipcode}`,
    id: "listing",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Listing
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-left overflow-hidden w-[300px] 2xl:w-[450px] text-ellipsis">
        {row.original.property
          ? `${row.original.property.address.streetAddress}, ${row.original.property.address.city}, ${row.original.property.address.state} ${row.original.property.address.zipcode}`
          : "-"}
      </div>
    ),
    meta: {
      headerClassName: "border-r border-[#E5E8EB] w-[450px]",
      cellClassName: "border-r border-[#E5E8EB] w-[450px]",
    },
  },
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName} `,
    id: "client name",
    header: ({ column }) => {
      return (
        <div
          className={"flex  gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Client Name
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-left  w-[150px] 2xl:w-[200px] truncate px-6">{`${
        row.original.firstName || "-"
      }${" "} ${row.original.lastName || "-"}`}</div>
    ),
    meta: {
      headerClassName: " w-[150px] 2xl:w-[200px]",
      cellClassName: " w-[150px] 2xl:w-[200px] px-2",
    },
  },
  {
    accessorKey: "prospectType",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <div
          className={`px-2 py-1 rounded-[8px] ${
            row.original.prospectType.toLocaleLowerCase() === "agent"
              ? "bg-[#caf7f5] text-black border "
              : row.original.prospectType.toLocaleLowerCase() === "renter"
              ? "bg-[#d9d3f8] text-black border "
              : row.original.prospectType.toLocaleLowerCase() === "buyer"
              ? "bg-[#d2e3f9] text-black border "
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {row.original.prospectType}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "prospectStatus",
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
          className={`px-2 py-1 capitalize rounded-[8px] ${
            row.original.prospectStatus === "pending"
              ? "bg-[#ecebfe] text-black border "
              : row.original.prospectStatus === "converted"
              ? "bg-[#c9e8f8] text-black border "
              : row.original.prospectStatus === "dead"
              ? "bg-[#ebdbdb] text-black border "
              : row.original.prospectStatus === "follow up"
              ? "bg-[#faefd1] text-black border "
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {row.original.prospectStatus && row.original.prospectStatus.toLowerCase() == "pending"
            ? "Scheduled"
            : row.original.prospectStatus}
        </div>
      </div>
    ),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const order = ["pending", "follow up", "converted", "dead"];
      const a = rowA.original.prospectStatus?.toLowerCase() || "";
      const b = rowB.original.prospectStatus?.toLowerCase() || "";

      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row.original.updatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <Actions Prospect={row.original} />,
    enableSorting: false,
    enableHiding: false,
    // Custom styling for the actions column
    meta: {
      headerClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
      cellClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
    },
  },
];
