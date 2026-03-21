"use client";
import FormSheet from "@/components/ui/form-sheet";
import { useBuyersBuyerStore } from "@/store/sheets";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { sections } from "./data-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ViewBuyer from "./view-buyer";
import EditBuyerForm from "./edit-buyer-form";
import { Buyer } from "@/types/buyers-agent";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchBuyer(id: string) {
  const response = await fetch(`/api/buyers/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch buyer");
  }
  const data = await response.json();
  const buyer = data.data?.buyers?.[0];
  if (!buyer) {
    throw new Error("Buyer not found");
  }
  return buyer as Buyer;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useBuyersBuyerStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  
  useEffect(() => {
    // Only close if navigating away from buyer pages
    if (viewOpen && !pathname.includes('/buyers/')) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: buyer, isLoading } = useQuery({
    queryKey: ["buyer", selectedId],
    queryFn: () => fetchBuyer(selectedId as string),
    enabled: !!selectedId,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["buyer", selectedId]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  if (isLoading || !buyer) {
    return null;
  }

  return (
    <>
      <FormSheet
        buttonText="Edit Buyer"
        title="Edit Buyer"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditBuyerForm Buyer={buyer as Buyer} onSuccess={handleEditSuccess} />
      </FormSheet>

      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewBuyer buyer={buyer as Buyer} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
