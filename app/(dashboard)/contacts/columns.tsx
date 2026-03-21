"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
import Contact from "@/types/contact";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import ViewContact from "./view-contact";

// This type is used to define the shape of our data?.
// You can use a Zod schema here if you want?.

const Actions = ({ contact }: { contact: Contact }) => {
  const [open, setOpen] = useState(false);
  const [viewLeadBuyer, setViewLeadBuyer] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get IDs of selected contact
      const contactIds = [contact?._id];

      const response = await fetch("/api/contacts/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }

      toast.success(`Successfully deleted contact`);

      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
    } catch (_error) {
      toast("Error", {
        description: "Failed to delete contact. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      // console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center">
      <Sheet>
        <SheetTrigger className="" asChild>
          <Button variant="ghost">
            <Eye size={16} color="#57738E" strokeWidth={1.75} />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
          <ViewContact contact={contact} />
        </SheetContent>
      </Sheet>

      <Sheet open={viewLeadBuyer} onOpenChange={setViewLeadBuyer}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewContact contact={contact} />
        </SheetContent>
      </Sheet>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">
            <Trash2 size={16} color="#c3011c" strokeWidth={1.75} />
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this contact and all associated information?. This action cannot be
            undone?.
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

export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="">
        <Checkbox
          className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2"
          checked={table?.getIsAllPageRowsSelected() || (table?.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table?.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="">
        <Checkbox
          className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2"
          checked={row?.getIsSelected()}
          onCheckedChange={(value) => row?.toggleSelected(!!value)}
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
    accessorFn: (row) => `${row?.contact?.firstName} ${row?.contact?.lastName} `,
    id: "fullname",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column?.toggleSorting(column?.getIsSorted() === "asc")}
        >
          Full Name
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize text-center w-[200px] overflow-hidden text-ellipsis">
        {row.original.contact.firstName} {row.original.contact.lastName}
      </div>
    ),
    meta: {
      headerClassName: "border-r border-[#E5E8EB]",
      cellClassName: "border-r border-[#E5E8EB] flex item-center justify-center",
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
      return <div>{formatPhoneToInternational(row.original.contact.phoneNumber)}</div>;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return <div>{formatPhoneToInternational(row.original.contact.email)}</div>;
    },
  },

  {
    accessorKey: "contactType",

    sortingFn: (rowA, rowB) => {
      const getKey = (contact: Contact) => {
        if (contact?.contactType?.toLowerCase() === "prospect") {
          return contact.contact?.prospectType?.toLowerCase() ?? "";
        }
        return contact.contactType?.toLowerCase() ?? "";
      };

      const a = getKey(rowA.original);
      const b = getKey(rowB.original);

      return a.localeCompare(b);
    },

    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column?.toggleSorting(column?.getIsSorted() === "asc")}
        >
          Type
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      const typeColors: Record<string, string> = {
        buyer: "bg-[#D2E3F9]",
        renter: "bg-[#D9D3F8]",
        agent: "bg-[#CAF7F5]",
        seller: "bg-[#F7E6CA]",
        landlord: "bg-[#D9E5FC]",
      };

      const getDisplayTypeAndColor = (contact: Contact) => {
        // First check if it's a prospect type
        if (contact?.contactType?.toLowerCase() === "prospect") {
          const prospectType = contact.contact?.prospectType;
          return {
            displayType: prospectType,
            bgColor: typeColors[prospectType?.toLowerCase()] || "bg-purple-200",
          };
        }

        // Otherwise use the direct contactType
        const contactType = contact?.contactType;
        return {
          displayType: contactType,
          bgColor: typeColors[contactType?.toLowerCase()] || "bg-purple-200",
        };
      };

      const { displayType, bgColor } = getDisplayTypeAndColor(row.original);

      return (
        <div className="flex justify-center">
          <div className={`px-2 py-1 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] ${bgColor}`}>
            {displayType}
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column?.toggleSorting(column?.getIsSorted() === "asc")}
        >
          Status
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <div
          className={`px-2 capitalize py-1 rounded-[8px] ${
            row?.getValue("status") === "inactive"
              ? "bg-[#ced1d4] text-black"
              : row?.getValue("status") == "active"
              ? "bg-[#defddf] text-black font-normal border "
              : "bg-[#E8F3FB] text-[#176FAA]"
          }`}
        >
          {row?.getValue("status")}
        </div>
      </div>
    ),
  },

  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column?.toggleSorting(column?.getIsSorted() === "asc")}
        >
          Date Added
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row?.original?.createdAt)?.toLocaleString("en-US", {
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
    cell: ({ row }) => <Actions contact={row?.original} />,
    enableSorting: false,
    enableHiding: false,
    // Custom styling for the actions column
    meta: {
      headerClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
      cellClassName: "w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]",
    },
  },
];
