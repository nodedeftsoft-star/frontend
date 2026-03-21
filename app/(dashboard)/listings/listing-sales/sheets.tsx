"use client";
import { useListingSalesStore } from "@/store/sheets";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { sections } from "./data-table";

import ViewListingSales from "./view-listing-sales";
import { ListingSales } from "@/types/listings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FormSheet from "@/components/ui/form-sheet";
import EditListingSalesForm from "./edit-listing-sales-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchListingSale(id: string) {
  const response = await fetch(`/api/listings/${id}`, {
    method: "GET",
  });
  const data = await response.json();
  //console.log("LISTING:", data.data.properties[0]);
  return data.data.properties[0] as ListingSales;
}
export default function Sheets() {
  const { openView, closeView, viewOpen, selectedId, editOpen, closeEdit, closeAll } = useListingSalesStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: ListingsSale, isLoading: _isLoading } = useQuery({
    queryKey: ["listing-sale", selectedId],
    queryFn: () => fetchListingSale(selectedId as string),
    enabled: !!selectedId,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["listing-sale", selectedId]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (_isLoading || !ListingsSale) {
    return null;
  }

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  return (
    <>
      <FormSheet
        buttonText="Edit Listing Sale"
        title="Edit Listing Sale"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditListingSalesForm listing={ListingsSale as ListingSales} onSuccess={handleEditSuccess} />
      </FormSheet>
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewListingSales ListingsSale={ListingsSale as ListingSales} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
