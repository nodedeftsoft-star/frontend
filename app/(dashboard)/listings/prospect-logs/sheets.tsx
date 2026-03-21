"use client";
import FormSheet from "@/components/ui/form-sheet";
import { useProspectSheetsStore } from "@/store/sheets";
import EditProspectForm from "./edit-prospect-logs-form";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import ViewProspect from "./view-prospect";
import { sections } from "./data-table";
import { Prospect } from "@/types/listings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchProspect(id: string) {
  const response = await fetch(`/api/prospects/${id}`, {
    method: "GET",
  });
  const data = await response.json();

  return data.data.prospects[0] as Prospect;
}

export default function Sheets() {
  const { openView, openEdit, closeView, viewOpen, closeEdit, editOpen, selectedId, closeAll } =
    useProspectSheetsStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: Prospect, isLoading: _isLoading } = useQuery({
    queryKey: ["prospect", selectedId],
    queryFn: () => fetchProspect(selectedId as string),
    enabled: !!selectedId,
    initialData: () => {
      return queryClient.getQueryData(["prospect", selectedId]);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleEditSuccess = () => {
    openView(selectedId || "");
    closeEdit();
  };

  if (_isLoading || !Prospect) {
    return null;
  }

  console.log("Prospect in sheets:", Prospect);

  return (
    <>
      <FormSheet
        buttonText="Edit Prospect"
        title="Edit Prospect"
        sections={sections}
        open={editOpen}
        onOpenChange={closeEdit}
        onSuccess={handleEditSuccess}
        icon
        showIcon={false}
      >
        <EditProspectForm prospect={Prospect as Prospect} onSuccess={handleEditSuccess} />
      </FormSheet>

      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewProspect
            Prospect={Prospect as Prospect}
            openEdit={() => {
              closeView();
              openEdit(selectedId || "");
            }}
            closeAll={closeAll}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
