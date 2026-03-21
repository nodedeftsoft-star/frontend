"use client";
import { useListingRentalStore } from "@/store/sheets";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import ViewListingRentals from "./view-listing-rentals";
import { ListingRentals } from "@/types/listings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "./data-table";
import EditListingRentalsForm from "./edit-listing-rentals-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchListingSale(id: string) {
  const response = await fetch(`/api/listings/${id}`, {
    method: "GET",
  });
  const data = await response.json();
  //console.log("LISTING:", data.data.properties[0]);
  return data.data.properties[0] as ListingRentals;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, selectedId, editOpen, closeEdit, closeAll } = useListingRentalStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: ListingsRental, isLoading } = useQuery({
    queryKey: ["listing-rental", selectedId],
    queryFn: () => fetchListingSale(selectedId as string),
    enabled: !!selectedId,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["listing-rental", selectedId]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !ListingsRental) {
    return null;
  }

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  return (
    <>
      <FormSheet
        buttonText="Edit Listing Rental"
        title="Edit Listing Rental"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditListingRentalsForm listing={ListingsRental as ListingRentals} onSuccess={handleEditSuccess} />
      </FormSheet>
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewListingRentals ListingsRental={ListingsRental as ListingRentals} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
