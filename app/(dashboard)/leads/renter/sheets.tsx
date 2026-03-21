"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLeadsRenterStore } from "@/store/sheets";
import ViewLeadRenter from "./view-lead-renter";
import { useQuery } from "@tanstack/react-query";
import { LeadsRenter } from "@/types/leads";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "./data-table";
import EditRenterForm from "./edit-renter-form";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchLeadsRenter(id: string) {
  const response = await fetch(`/api/leads/renter/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("LEADS RENTER DATA", data);
  return data.data.renters[0] as LeadsRenter;
}

export default function Sheets() {
  const { openView, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } = useLeadsRenterStore();
  const pathname = usePathname();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: leadRenter, isLoading: _isLoading } = useQuery({
    queryKey: ["lead-renter", selectedId],
    queryFn: () => fetchLeadsRenter(selectedId as string),
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
        buttonText="Edit Renter"
        title="Edit Renter"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditRenterForm leadsRenter={leadRenter as LeadsRenter} onSuccess={handleEditSuccess} />
      </FormSheet>{" "}
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] sm:max-w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewLeadRenter leadsRenter={leadRenter as LeadsRenter} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
