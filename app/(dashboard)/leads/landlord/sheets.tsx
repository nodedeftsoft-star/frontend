"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLeadsLandlordStore } from "@/store/sheets";
import ViewLeadLandlord from "./view-lead-landlord";
import { useQuery } from "@tanstack/react-query";
import { LeadsLandLord } from "@/types/leads";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "./data-table";
import EditLeadsLandlordForm from "./edit-landlord-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchLeadsLandlord(id: string) {
  const response = await fetch(`/api/leads/landlord/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("LEADS LANDLORD DATA", data);
  return data.data.landlords[0] as LeadsLandLord;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useLeadsLandlordStore();
  const pathname = usePathname();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: leadLandlord, isLoading: _isLoading } = useQuery({
    queryKey: ["lead-landlord", selectedId],
    queryFn: () => fetchLeadsLandlord(selectedId as string),
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
      <FormSheet
        buttonText="Edit Landlord"
        title="Edit Landlord"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditLeadsLandlordForm leadsLandlord={leadLandlord as LeadsLandLord} onSuccess={handleEditSuccess} />
      </FormSheet>{" "}
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] sm:max-w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewLeadLandlord leadsLandlord={leadLandlord as LeadsLandLord} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
