"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLeadsSellerStore } from "@/store/sheets";
import ViewLeadSeller from "./view-lead-seller";
import { useQuery } from "@tanstack/react-query";
import { LeadsSeller } from "@/types/leads";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "./data-table";
import EditLeadsSellerForm from "./edit-seller-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchLeadsSeller(id: string) {
  const response = await fetch(`/api/leads/seller/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("LEADS SELLER DATA", data);
  return data.data.sellers[0] as LeadsSeller;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useLeadsSellerStore();
  const pathname = usePathname();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: leadSeller, isLoading: _isLoading } = useQuery({
    queryKey: ["lead-seller", selectedId],
    queryFn: () => fetchLeadsSeller(selectedId as string),
    enabled: !!selectedId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  return (
    <>
      {" "}
      <FormSheet
        buttonText="Edit Seller"
        title="Edit Seller"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditLeadsSellerForm leadsSeller={leadSeller as LeadsSeller} onSuccess={handleEditSuccess} />
      </FormSheet>{" "}
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] sm:max-w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewLeadSeller leadsSeller={leadSeller as LeadsSeller} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
