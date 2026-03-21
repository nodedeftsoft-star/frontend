"use client";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, CircleArrowUp, GitBranchIcon, Loader2 } from "lucide-react";
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
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import React, { useState, useEffect } from "react";
// import { Separator } from "@/components/ui/separator";
import { Match } from "@/types/shared";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  match: Match | null;
  userId: string;
  onClose?: () => void;
  userType?: "Buyer" | "Renter";
  onMatchUpdate?: (matchId: string, newStatus: string) => void;
  userNotes?: { _id: string; note: string; timestamp: number }[];
}

export default function ViewMatch({ match, userId, onClose: _onClose, userType, onMatchUpdate, userNotes }: Props) {
  const [open, setOpen] = useState(false);
  const [matchKind, setMatchKind] = useState(match?.matchKind);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [photoSliderOpen, setPhotoSliderOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localActivityNotes, setLocalActivityNotes] = useState<Array<{ note: string; timestamp: number }>>(
    match?.activityNotes || []
  );
  const property = match?.property as Match;
  const router = useRouter();

  //console.log("PROPERTY:", match, property, "MATCH ID: ", match?.id, "USER ID:", userId, "NOTES:", userNotes);

  const queryClient = useQueryClient();

  const openPhotoSlider = (index: number = 0) => {
    setCurrentPhotoIndex(index);
    setPhotoSliderOpen(true);
  };

  const nextPhoto = React.useCallback(() => {
    if (property?.photos && currentPhotoIndex < property.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  }, [currentPhotoIndex, property?.photos]);

  const prevPhoto = React.useCallback(() => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  }, [currentPhotoIndex]);

  const handleKeyPress = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") setPhotoSliderOpen(false);
    },
    [nextPhoto, prevPhoto]
  );

  // Add keyboard event listener when slider is open
  useEffect(() => {
    if (photoSliderOpen) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "auto";
    };
  }, [photoSliderOpen, handleKeyPress]);

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);
      let response;
      if (userType === "Buyer") {
        response = await fetch(`/api/buyers/property-note`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buyerId: userId,
            propertyId: property.id,
            note: activityNote,
          }),
        });
      } else {
        response = await fetch(`/api/renters/property-note`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            renterId: userId,
            propertyId: property.id,
            note: activityNote,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Note!");
      }

      const _responseData = await response.json();

      // if (userType === "buyer") {
      //   await queryClient.invalidateQueries({ queryKey: ["buyerDetails"] });
      // } else {
      //   await queryClient.invalidateQueries({ queryKey: ["renterDetails"] });
      // }
      //console.log("CREATE BUYER RESPONSE:", responseData);

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      // Optimistically update local state with new note
      const newNote = {
        note: activityNote,
        timestamp: Date.now(),
      };

      setLocalActivityNotes((prev: Array<{ note: string; timestamp: number }>) => [...(prev || []), newNote]);

      // setLeadsBuyerData(responseData?.data);
      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      console.error("Error creating note:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to create buyer",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleConfirmMatch = async () => {
    try {
      setIsSigning(true);

      const matchData = {
        property: property.id,
        id: userId,
        customer: userId,
        customerType: userType,
        status: "Active",
        propertyMode: property.mode,
        activityNotes: userNotes,
      };

      const response = await fetch("/api/match/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Match");
      }

      // setLeadsBuyerData({ ...leadsBuyerData, isSigned: !leadsBuyerData?.isSigned });

      if (userType == "Buyer") {
        await fetch("/api/buyers/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId, isActive: false }),
        });
        const responseData = await response.json();
        //console.log("RESPONSE:", responseData);
        queryClient.invalidateQueries({ queryKey: ["buyers"] });
        queryClient.invalidateQueries({ queryKey: ["matchesSales"] });

        router.push(`/matches/sales/${responseData?.data?.id}`);
        setOpen(false);
      }

      if (userType == "Renter") {
        await fetch("/api/renters/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId, isActive: false }),
        });
        const responseData = await response.json();
        //console.log("RESPONSE:", responseData);
        queryClient.invalidateQueries({ queryKey: ["renters"] });
        queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });

        router.push(`/matches/rentals/${responseData?.data?.id}`);
        setOpen(false);
      }

      setIsSigning(false);

      toast.success("Match added successfully");
    } catch (error) {
      setIsSigning(false);
      console.error("Error adding match:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to add Match",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);
      let response;

      if (userType == "Buyer") {
        response = await fetch("/api/buyers/update-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ propertyId: property.id, matchKind: status, id: userId }),
        });
      } else {
        response = await fetch("/api/renters/update-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ propertyId: property.id, matchKind: status, id: userId }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Match Status");
      }

      setIsUpdatingStatus(false);
      setMatchKind(status);

      // Call callback to update parent component
      if (onMatchUpdate && match?.id) {
        onMatchUpdate(match.id, status);
      }

      toast.success("Match Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      console.error("Error updating Match Status:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to update Match  status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  // return null;

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-light-text text-2xl font-bold">{property?.address?.streetAddress}</h1>
          <div className="flex  items-center gap-2">
            <h1 className="text-light-text text-md ">{`${property?.address?.city}, ${property?.address?.state} ${property?.address?.zipcode}`}</h1>
            <span className="px-2 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] bg-[#D2E3F9]">
              Listing Details
            </span>
          </div>
        </div>
        <div className="flex gap-2 pr-12 items-top pt-1">
          <Select value={matchKind} onValueChange={(e) => handleUpdateStatus(e)} disabled={isUpdatingStatus}>
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Potential Matches" defaultValue={matchKind} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="potential">Potential Match</SelectItem>
                <SelectItem value="followUp">Follow Up</SelectItem>
                <SelectItem value="pending">Scheduled Showing</SelectItem>
                <SelectItem value="shown">Shown</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size={"sm"} className="gap-2">
                <GitBranchIcon />
                {"Match"}
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              <DialogHeader>
                <DialogTitle>Confirm Match</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                You&apos;re about to mark this {userType} as a match for the current listing. This action cannot be
                undone.
              </div>
              <DialogFooter>
                <Button variant="ghost" className="bg-[#F9F9F9] border border-[#E5E8EB]" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleConfirmMatch}>
                  {isSigning ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant={"ghost"} size={"icon"} className="p-0 m-0 h-fit hover:bg-transparent" asChild>
            <Link href={property.url} target="_blank">
              <ArrowUpRight size={24} className="size-6" />
            </Link>
          </Button>
        </div>
      </div>
      <ScrollArea className="w-full h-[900px] px-8 pb-36">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="cursor-pointer" onClick={() => openPhotoSlider(0)}>
            <Image
              src={property?.photos?.[0] || "/placeholder-image.png"}
              alt="Property Image"
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-[500px]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {property?.photos?.slice(1, 6).map((photo: string, index: number) => (
              <div key={index} className="cursor-pointer w-[47%] h-[150px]" onClick={() => openPhotoSlider(index + 1)}>
                <Image
                  src={photo || "/placeholder-image.png"}
                  alt={`Property Image ${index + 1}`}
                  width={250}
                  height={150}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            ))}
            <Button className="w-[47%] h-[150px] rounded-lg" onClick={() => openPhotoSlider(0)} variant="outline">
              See all {property?.photos?.length || 0} Photos
            </Button>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
          <div className="w-full ">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Details</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Location", value: property?.address?.streetAddress || "-" },
                  { label: "Property Type", value: property?.homeType || "-" },
                  {
                    label: "Price",
                    value: property?.price
                      ? `${property?.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}`
                      : "-",
                  },
                  {
                    label: "Pet",
                    value:
                      property?.petFriendly?.allowsLargeDogs == "Yes" || property?.petFriendly?.allowsCats == "Yes"
                        ? "Yes"
                        : "No",
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
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <p className="font-bold text-light-text mb-4">Agent</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Name", value: property?.attribution?.agentName || "-" },
                  {
                    label: "Contact",
                    value: property?.attribution?.agentContactInfo || "-",
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
          </div>
          <div className="w-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <p className="font-bold text-light-text mb-4">Brokerage</p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    label: "Name",
                    value: property?.attribution?.brokerName || "-",
                  },
                  {
                    label: "Contact",
                    value: property?.attribution?.brokerContactInfo || "-",
                  },
                ].map(({ label, value }, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 ${typeof value === "object" ? "flex-col items-start" : ""}`}
                  >
                    <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <p className="truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 h-fit">
              <p className="font-bold text-light-text mb-4">Description</p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-[#07192C] font-normal  ">
                    <p>{property?.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
              <p className="font-bold text-light-text mb-4">Activity</p>
              <div>
                <ScrollArea className="h-[325px] w-full">
                  <div className="pb-6 mx-1">
                    {localActivityNotes?.map((item, index) => (
                      <div key={index} className="relative pl-5 pb-9">
                        <div className="absolute left-0.5 top-0 bottom-0 w-px bg-[#5B7083]" />

                        <div className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full bg-[#5B7083]" />

                        <div className="">
                          <p className="text-light-text font-medium"> {item.note} </p>
                          <p className="text-light-text-secondary text-sm">{formatTimestamp(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-6 px-4 bg-white flex gap-2 border-1 border-neutral-200 rounded-md ">
                  <Textarea
                    placeholder="Add a new note here"
                    className="h-[91px] px-6 py-4 border-none active:border-none focus:border-none focus-visible:border-none focus-visible:ring-ring-none focus-visible:ring-0 shadow-none drop-shadow-none"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
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

      {/* Fullscreen Photo Slider */}
      {photoSliderOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setPhotoSliderOpen(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>

            {/* Previous button */}
            {currentPhotoIndex > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={48} />
              </button>
            )}

            {/* Next button */}
            {property?.photos && currentPhotoIndex < property.photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight size={48} />
              </button>
            )}

            {/* Current photo */}
            <div className="relative max-w-7xl max-h-full p-4">
              <Image
                src={property?.photos?.[currentPhotoIndex] || "/placeholder-image.png"}
                alt={`Property Image ${currentPhotoIndex + 1}`}
                width={1200}
                height={800}
                className="rounded-lg object-contain max-h-[90vh] max-w-full"
              />
            </div>

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {currentPhotoIndex + 1} of {property?.photos?.length || 0}
            </div>

            {/* Thumbnail strip */}
            {property?.photos && property.photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 max-w-full overflow-x-auto p-2">
                {property.photos.map((photo: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 ${
                      index === currentPhotoIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                    } transition-all duration-200`}
                  >
                    <Image
                      src={photo || "/placeholder-image.png"}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={60}
                      className="rounded object-cover w-20 h-15"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
