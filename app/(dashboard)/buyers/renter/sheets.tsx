"use client";
import { useBuyersRenterStore } from "@/store/sheets";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import ViewRenter from "./view-renter";
import { Renter } from "@/types/buyers-agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "./data-table";
import EditRenterForm from "./edit-renter-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchRenter(id: string) {
  const response = await fetch(`/api/renters/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch renter");
  }
  const data = await response.json();
  const renter = data.data?.renter;
  if (!renter) {
    throw new Error("Renter not found");
  }
  return renter as Renter;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useBuyersRenterStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  useEffect(() => {
    // Only close if navigating away from buyer pages
    if (viewOpen && !pathname.includes('/buyers/')) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: renter, isLoading } = useQuery({
    queryKey: ["renter", selectedId],
    queryFn: () => fetchRenter(selectedId as string),
    enabled: !!selectedId,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["renter", selectedId]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !renter) {
    return null;
  }

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  return (
    <>
      <FormSheet
        buttonText="Edit Renter"
        title="Edit Renter"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditRenterForm renter={renter as Renter} onSuccess={handleEditSuccess} />
      </FormSheet>
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewRenter renter={renter as Renter} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
