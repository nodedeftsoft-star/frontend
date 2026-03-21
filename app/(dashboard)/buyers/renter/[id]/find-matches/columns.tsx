"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

import { Match } from "@/types/shared";

export const columns: ColumnDef<Match>[] = [
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
    accessorKey: "address.streetAddress",
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
    cell: ({ row }) => {
      return <div>{row.original?.address?.streetAddress}</div>;
    },
    meta: {
      headerClassName: "border-r border-[#E5E8EB]",
      cellClassName: "border-r border-[#E5E8EB]",
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          {row.original.price ? row.original.price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }) : "Price not available"}
        </div>
      );
    },
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
    cell: ({ row }) => {
      return <div>{row.original?.attribution?.agentName}</div>;
    },
  },

  {
    accessorKey: "bedrooms",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer w-[50px]"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bedrooms
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return <div className="w-[50px]">{row.original?.bedrooms}</div>;
    },
  },

  {
    accessorKey: "bathrooms",
    header: ({ column }) => {
      return (
        <div
          className={"flex justify-center gap-2 items-center cursor-pointer w-[50px]"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bathrooms
          <Image src={"/updown.svg"} alt="arrow" width={16} height={16} />
        </div>
      );
    },
    cell: ({ row }) => {
      return <div className="w-[50px]">{row.original.bathrooms}</div>;
    },
  },
];
