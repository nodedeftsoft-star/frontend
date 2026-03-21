"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleArrowUp, Loader2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompensationDialog } from "@/components/compensation-dialog";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Richtext";
import { matchData } from "@/types/matches";
import { useParams, useRouter } from "next/navigation";

async function fetchMatchRentals(id: string) {
  const response = await fetch(`/api/match/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("RENTALS MATCH DATA", data);
  return data.data.matches[0] as matchData;
}

export default function MatchRentalsDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localActivityNotes, setLocalActivityNotes] = useState<Array<{ note: string; timestamp: number }>>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInContract, setConfirmInContract] = useState(false);
  const [confirmClosed, setConfirmClosed] = useState(false);
  const [compensationModal, setCompensationModal] = useState(false);
  const [addingComponsation, setAddingCompensation] = useState(false);

  const queryClient = useQueryClient();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [localActivityNotes]);

  const { data: matchRentalsData, isLoading } = useQuery({
    queryKey: ["match-rental", id],
    queryFn: () => fetchMatchRentals(id as string),
    enabled: !!id,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["match-rental", id]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Initialize state when data loads
  useEffect(() => {
    if (matchRentalsData) {
      setStage(matchRentalsData.stage || "");
      setStatus(matchRentalsData.status || "");
      setLocalActivityNotes(matchRentalsData.activityNotes || []);
    }
  }, [matchRentalsData]);

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/match/note/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: activityNote,
          matchId: matchRentalsData?._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add note");
      }

      const _responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["match-rental", id] });
      queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });

      //console.log("CREATE NOTE RESPONSE:", responseData);

      // Add the new note to the local state
      const newNote = {
        note: activityNote,
        timestamp: Date.now(),
      };
      setLocalActivityNotes((prev) => [newNote, ...prev]);

      setIsSubmittingActivity(false);

      toast.success("Note added successfully");

      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      console.error("Error creating note:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to add note",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleUpdateStage = async (stage: string, skipConfirmation = false) => {
    if (stage === "Deposit in" && confirmInContract === false && !skipConfirmation) {
      return setConfirmInContract(true);
    }

    if (stage === "Closed" && !skipConfirmation) {
      return setConfirmClosed(true);
    }

    try {
      setIsUpdatingStage(true);

      const response = await fetch("/api/match/change-stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId: matchRentalsData?._id, matchStage: stage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update match stage");
      }

      await fetch(`/api/match/note/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: `Stage changed to ${stage}`,
          matchId: matchRentalsData?._id,
        }),
      });

      if (stage === "Closed") {
        const response = await fetch("/api/listings/change-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: matchRentalsData?.property?.id,
            propertyStatus: "closed",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update Listing Status");
        }

        queryClient.invalidateQueries({ queryKey: ["listing-rental", matchRentalsData?.property?.id] });
        queryClient.invalidateQueries({ queryKey: ["listingsRentals"] });
      }

      if (stage === "Deposit in") {
        const response = await fetch("/api/listings/change-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: matchRentalsData?.property?.id,
            propertyStatus: "inContract",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update Listing Status");
        }

        queryClient.invalidateQueries({ queryKey: ["listing-rental", matchRentalsData?.property?.id] });
        queryClient.invalidateQueries({ queryKey: ["listingsRentals"] });
      }

      queryClient.invalidateQueries({ queryKey: ["match-rental", id] });
      queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });

      setIsUpdatingStage(false);
      setConfirmInContract(false);
      setStage(stage);

      toast.success("Match stage updated successfully");
    } catch (error) {
      setIsUpdatingStage(false);
      console.error("Error updating match stage:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to update match stage",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleAddCompensation = async (value: number) => {
    try {
      setAddingCompensation(true);

      const response = await fetch("/api/listings/add-compensation", {
        method: "PUT",
        body: JSON.stringify({
          propertyId: matchRentalsData?.property?.id,
          compensation: Number(value),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to save compensation");
      }

      toast.success("Compensation Saved");

      // After successful compensation save, update stage to Closed
      setCompensationModal(false);
      await handleUpdateStage("Closed", true); // Skip confirmation since we already confirmed
    } catch (error) {
      console.error("Error saving compensation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setAddingCompensation(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/match/change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId: matchRentalsData?._id, matchStatus: status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update match status");
      }

      queryClient.invalidateQueries({ queryKey: ["match-rental", id] });
      queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Match status updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      console.error("Error updating status:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to update match status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchRentalsData?._id) return;

    try {
      setIsDeleting(true);

      const response = await fetch("/api/match/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchIds: [matchRentalsData._id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete match");
      }

      toast.success("Match deleted successfully");

      // Invalidate queries and navigate back
      queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });
      router.push("/matches/rentals");
    } catch (error) {
      console.error("Error deleting match:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to delete match",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!matchRentalsData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>No match data found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-light-text text-2xl font-bold">
            {matchRentalsData?.customer?.firstName} {matchRentalsData?.customer?.lastName}
          </h1>
          <span className="px-2 rounded-[8px] text-[#07192C] font-normal border  bg-purple-200">Renter</span>
        </div>
        <div className="flex gap-2 pr-12">
          <Select
            value={stage}
            defaultValue={matchRentalsData?.stage}
            onValueChange={(e) => handleUpdateStage(e)}
            disabled={isUpdatingStage}
          >
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Hot" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Match Stage</SelectLabel>
                <SelectItem value="Shown">Shown</SelectItem>
                <SelectItem value="Docs pending">Docs Pending</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Deposit in">Deposit In</SelectItem>

                <SelectItem value="Closed">Closed</SelectItem>

                <SelectItem value="Lost interest">Lost Interest</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Dead">Dead</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={status}
            defaultValue={matchRentalsData?.status}
            onValueChange={(e) => handleUpdateStatus(e)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant={"ghost"} size={"icon"} className="bg-transparent" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 color="#c3011c" />
          </Button>
        </div>
      </div>
      <ScrollArea className="w-full h-[900px] px-8 pb-36">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
          <div className="w-full ">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Client Information</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Type", value: "Rental Match" },
                  { label: "Email", value: matchRentalsData?.customer.email },
                  { label: "Mobile", value: formatPhoneToInternational(matchRentalsData?.customer.phoneNumber || "") },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {typeof value === "string" ? <p className="truncate">{value}</p> : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Agent</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Name", value: matchRentalsData?.property.attribution.agentName },
                  {
                    label: "Contact",
                    value: formatPhoneToInternational(matchRentalsData?.property.attribution.agentContactInfo || ""),
                  },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {typeof value === "string" ? <p className="truncate">{value}</p> : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Brokerage</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Name", value: matchRentalsData?.property.attribution.brokerName },
                  {
                    label: "Contact",
                    value: formatPhoneToInternational(matchRentalsData?.property.attribution.brokerContactInfo || ""),
                  },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {typeof value === "string" ? <p className="truncate">{value}</p> : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Listing Information</p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    label: "Address",
                    value: `${matchRentalsData?.property.address.streetAddress}, ${matchRentalsData?.property.address.city}, ${matchRentalsData?.property.address.state} ${matchRentalsData?.property.address.zipcode}`,
                  },
                  {
                    label: "Location",
                    value: matchRentalsData?.property.address.parentRegionName,
                  },
                  {
                    label: "Type",
                    value: matchRentalsData?.property.homeType,
                  },
                  {
                    label: "Price",
                    value: matchRentalsData?.property.price?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    }),
                  },
                  {
                    label: "Bedrooms",
                    value: matchRentalsData?.property.bedrooms,
                  },
                  {
                    label: "Bathrooms",
                    value: matchRentalsData?.property.bathrooms,
                  },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4 pr-4">
                    <p className="text-light-text-secondary text-sm w-24 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal  wrap-normal">
                      {typeof value === "string" ? <p>{value}</p> : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
              <p className="font-bold text-light-text mb-4">Notes</p>
              <div>
                <ScrollArea className="h-[325px] w-full">
                  <div className="pb-6 mx-1">
                    {localActivityNotes.map((item, index) => (
                      <div key={index} className="relative pl-5 pb-9">
                        <div className="absolute left-0.5 top-0 bottom-0 w-px bg-[#5B7083]" />

                        <div className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full bg-[#5B7083]" />

                        <div className="">
                          <p dangerouslySetInnerHTML={{ __html: item.note }} className="text-light-text font-medium" />
                          <p className="text-light-text-secondary text-sm">{formatTimestamp(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                <div className="mt-6 px-4 bg-white flex gap-2 border-1 border-neutral-200 rounded-md ">
                  {/* <Textarea
                    placeholder="Add a new note here"
                    className="h-[91px] px-6 py-4 border-none active:border-none focus:border-none focus-visible:border-none focus-visible:ring-ring-none focus-visible:ring-0 shadow-none drop-shadow-none"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                  /> */}
                  <RichTextEditor
                    placeholder="Add a new note here"
                    value={activityNote}
                    onChange={(html) => setActivityNote(html)}
                    className="h-[91px] px-6 py-4 border-none active:border-none focus:border-none focus-visible:border-none focus-visible:ring-ring-none focus-visible:ring-0 shadow-none drop-shadow-none"
                  />
                  <button onClick={submitActivity} disabled={isSubmittingActivity || activityNote.length <= 0}>
                    {!isSubmittingActivity ? (
                      <CircleArrowUp size={25} className="" color="#57738E" />
                    ) : (
                      <Loader2 size={25} className="text-light-text-secondary animate-spin" color="#57738E" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete Rental Match</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You&apos;re about to permanently delete this rental match and all associated information. This action cannot
            be undone.
            <br />
            <br />
            Are you sure you want to proceed?
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="ghost"
              className="bg-[#F9F9F9] border border-[#E5E8EB]"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-[#E35B4F] hover:bg-[#DD3222]"
              onClick={handleDeleteMatch}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit In Confirmation Dialog */}
      <Dialog open={confirmInContract} onOpenChange={setConfirmInContract}>
        <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg">
          <DialogHeader>
            <DialogTitle>Confirm Status Change.</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            This listing&apos;s status will be changed to <span className="font-bold">In Contract</span> on Rental
            Listing. Please Confirm.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="bg-[#F9F9F9] border border-[#E5E8EB]"
              onClick={() => setConfirmInContract(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => handleUpdateStage("Deposit in", true)}
              disabled={isUpdatingStage}
            >
              {isUpdatingStage ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closed Confirmation Dialog */}
      <Dialog open={confirmClosed} onOpenChange={setConfirmClosed}>
        <DialogContent showCloseButton={false} className="sm:w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Confirm Stage Change to Closed</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            You are about to mark this match as <span className="font-bold">Closed</span>. You will be prompted to enter
            the compensation amount next. Please confirm.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="bg-[#F9F9F9] border border-[#E5E8EB]"
              onClick={() => setConfirmClosed(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setConfirmClosed(false);
                setCompensationModal(true);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compensation Modal */}
      <CompensationDialog
        open={compensationModal}
        onOpenChange={setCompensationModal}
        onSubmit={handleAddCompensation}
        isLoading={addingComponsation}
      />
    </>
  );
}
