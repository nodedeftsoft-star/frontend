"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2, Pencil } from "lucide-react";

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
import { Buyer } from "@/types/buyers-agent";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { useBuyersBuyerStore } from "@/store/sheets";

const Actions = ({ buyer }: { buyer: Buyer }) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { openView, openEdit } = useBuyersBuyerStore();

  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get IDs of selected buyers
      const buyerIds = [buyer?.id];

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

      toast.success(`Successfully deleted buyer`);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      setOpen(false);
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete buyer. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => openView(buyer?.id)}>
        <Eye size={16} color="#57738E" strokeWidth={1.75} />
      </Button>
      <Button variant="ghost" onClick={() => openEdit(buyer?.id)}>
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
            <DialogTitle>Delete Buyer</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this buyer and all their associated information. this action cannot
            be undone.
            <br />
            <br />
            Are you sure you want to proceed?
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" className="bg-[#F9F9F9] border border-[#E5E8EB]" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="bg-[#E35B4F] hover:bg-[#DD3222]" onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete"}{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const columns: ColumnDef<Buyer>[] = [
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
    accessorKey: "fullname",
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
    cell: ({ row }) => {
      return (
        <div>
          {row.original.firstName} {row.original.lastName}
        </div>
      );
    },
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
    cell: ({ row }) => {
      return <div>{formatPhoneToInternational(row.original.phoneNumber)}</div>;
    },
  },

  {
    accessorKey: "isActive",
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
            row.getValue("isActive") === false
              ? "bg-[#ced1d4] text-black"
              : row.getValue("isActive") == true
              ? "bg-[#defddf] text-black font-normal border border-[#E5E8EB]"
              : "bg-[#E8F3FB] text-[#176FAA]"
          }`}
        >
          {row.getValue("isActive") ? "Active" : "Inactive"}
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
    cell: ({ row }) => <Actions buyer={row.original} />,
    enableSorting: false,
    enableHiding: false,
    // Custom styling for the actions column
    meta: {
      headerClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
      cellClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
    },
  },
];
