"use client";

import { useMatchesSalesStore } from "@/store/sheets";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import ViewMatchSales from "./view-match-sales";
import { matchData } from "@/types/matches";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

async function fetchMatchSales(id: string) {
  const response = await fetch(`/api/match/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("SALES MATCH DATA", data);
  return data.data.matches[0] as matchData;
}

export default function Sheets() {
  const { closeView, viewOpen, selectedId, closeAll } = useMatchesSalesStore();
  const pathname = usePathname();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (viewOpen) {
      closeAll();
    }
  }, [pathname, closeAll]);

  const { data: matchSalesData, isLoading } = useQuery({
    queryKey: ["match-sale", selectedId],
    queryFn: () => fetchMatchSales(selectedId as string),
    enabled: !!selectedId,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["match-sale", selectedId]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !matchSalesData) {
    return null;
  }

  return (
    <>
      <Sheet open={viewOpen} onOpenChange={closeView}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full">
          <ViewMatchSales matchSales={matchSalesData as matchData} closeAll={closeAll} />
        </SheetContent>
      </Sheet>
    </>
  );
}
