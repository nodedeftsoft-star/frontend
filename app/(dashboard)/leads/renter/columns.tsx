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
import { LeadsRenter } from "@/types/leads";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadsRenterStore } from "@/store/sheets";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

const Actions = ({ leadsRenter }: { leadsRenter: LeadsRenter }) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { openView, openEdit } = useLeadsRenterStore();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get IDs of selected renters
      const leadRentersIds = [leadsRenter?._id];

      const response = await fetch("/api/leads/renter/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadRentersIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete renters");
      }

      toast.success(`Successfully deleted lead renter`);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });
      setOpen(false);
    } catch (_error) {
      toast.error("Failed to delete lead renter. Please try again.");
      // console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => openView(leadsRenter?._id || "")}>
        <Eye size={16} color="#57738E" strokeWidth={1.75} />
      </Button>

      <Button variant="ghost" onClick={() => openEdit(leadsRenter?._id || "")}>
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
            <DialogTitle>Delete Renter Lead</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this potential lead and all their associated information. this
            action cannot be undone.
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

export const columns: ColumnDef<LeadsRenter>[] = [
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
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "fullname",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize truncate text-center w-[200px]">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
    meta: {
      headerClassName: "border-r border-[#E5E8EB]",
      cellClassName: "border-r border-[#E5E8EB]",
    },
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mobile
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-center w-[200px]">{formatPhoneToInternational(row.original.phoneNumber)}</div>
    ),
  },

  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <div
          className={`px-2 py-1 rounded-[8px] ${
            row.getValue("status") === "Inactive"
              ? "bg-[#ced1d4] text-black"
              : row.getValue("status") == "Active"
              ? "bg-[#defddf] text-black font-normal border border-[#E5E8EB]"
              : "bg-[#E8F3FB] text-[#176FAA]"
          }`}
        >
          {row.getValue("status")}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "leadType",
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
          className={`px-2 py-1 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] ${
            (row.getValue("leadType") as string)?.toLowerCase() === "cold"
              ? "bg-[#c9e8f8]"
              : (row.getValue("leadType") as string)?.toLowerCase() === "hot"
              ? "bg-[#defddf]"
              : "bg-[#E8F3FB] text-black"
          }`}
        >
          {row.getValue("leadType")}
        </div>
      </div>
    ),
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
    cell: ({ row }) => <Actions leadsRenter={row.original} />,
    enableSorting: false,
    enableHiding: false,
    // Custom styling for the actions column
    meta: {
      headerClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
      cellClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
    },
  },
];
