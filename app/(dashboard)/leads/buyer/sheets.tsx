"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLeadsBuyerStore } from "@/store/sheets";
import ViewLeadBuyer from "./view-lead-buyer";
import { useQuery } from "@tanstack/react-query";
import { LeadsBuyer } from "@/types/leads";
import { sections } from "./data-table";
import FormSheet from "@/components/ui/form-sheet";
import EditLeadsBuyerForm from "./edit-buyer-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchLeadsBuyer(id: string) {
  const response = await fetch(`/api/leads/buyer/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  // //console.log("LEADS BUYER DATA", data);
  return data.data.buyers[0] as LeadsBuyer;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useLeadsBuyerStore();
  const pathname = usePathname();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: leadBuyer, isLoading: _isLoading } = useQuery({
    queryKey: ["lead-buyer", selectedId],
    queryFn: () => fetchLeadsBuyer(selectedId as string),
    enabled: !!selectedId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  // console.log("LEADS BUYER:", leadBuyer);

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
        <EditLeadsBuyerForm leadsBuyer={leadBuyer as LeadsBuyer} onSuccess={handleEditSuccess} />
      </FormSheet>{" "}
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] sm:max-w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewLeadBuyer leadsBuyer={leadBuyer as LeadsBuyer} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
