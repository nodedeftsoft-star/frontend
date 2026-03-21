"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleArrowUp, Loader2 } from "lucide-react";
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
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FormSheet from "@/components/ui/form-sheet";
import EditRenterForm from "./edit-renter-form";
import { sections } from "./data-table";

import { Renter } from "@/types/buyers-agent";
import formatPhoneNumber from "@/lib/formatNumber";
import { useSelectedBuyersAgentStore } from "@/store/selected";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/Richtext";
import { formatTimestamp } from "@/lib/Timestamps";
import MatchFinderRenter from "@/components/match-finder-renter";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";

export default function ViewRenter({ renter, closeAll }: { renter: Renter | undefined | null; closeAll?: () => void }) {
  // console.log("RENTER", renter);
  const { selectedAgent, setSelectedAgent } = useSelectedBuyersAgentStore();
  const pathname = usePathname();

  const [status, setStatus] = useState(renter?.isActive ? "Active" : "Inactive");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [renterNotes, setRenterNotes] = useState(renter?.activityNotes || []);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleEditSuccess = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["renter", renter?._id] });
    queryClient.invalidateQueries({ queryKey: ["renters"] });
  };

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [activityNote]);

  useEffect(() => {
    setSelectedAgent(renter ? renter : null);
  }, [renter, setSelectedAgent]);

  if (!renter) {
    renter = selectedAgent as Renter;
  }

  const getPetOwned = (petOwned: string) => {
    if (petOwned === "dog") {
      return "Yes, Dogs";
    } else if (petOwned === "cat") {
      return "Yes, Cats";
    } else if (petOwned === "both") {
      return "Yes, Both";
    } else if (petOwned === "service anumal") {
      return "Yes, Service Animal";
    } else {
      return "No";
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/renters/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: renter?._id, isActive: status === "Active" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        ////console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads renter Status");
      }

      queryClient.invalidateQueries({ queryKey: ["renter", renter?._id] });
      queryClient.invalidateQueries({ queryKey: ["renters"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Renter Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      // console.error("Error updating renter:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to update renter status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/renters/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          renterId: renter?._id,
          note: activityNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add renter");
      }

      // const responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["renter", renter?._id] });
      queryClient.invalidateQueries({ queryKey: ["renters"] });

      // //console.log("CREATE renter RESPONSE:", responseData);

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      // Update local notes state for immediate UI update
      setRenterNotes([
        ...renterNotes,
        {
          note: activityNote,
          timestamp: Date.now(),
          _id: Math.random().toString(36).substring(2, 9), // Temporary ID
        },
      ]);

      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      // console.error("Error creating note:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to add note",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between  px-8 mb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-light-text text-2xl font-bold">
            {renter?.firstName} {renter?.lastName}
          </h1>
          <span className="px-2 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] bg-[#D2E3F9]">
            Renter
          </span>
        </div>
        <div className="flex gap-2 pr-12">
          <Select
            defaultValue={renter?.status}
            value={status}
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

          <FormSheet
            buttonText="Edit Renter"
            title="Edit Renter"
            sections={sections}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={handleEditSuccess}
            icon
          >
            <EditRenterForm onSuccess={handleEditSuccess} renter={renter as Renter} />
          </FormSheet>

          <Button variant={"ghost"} size={"icon"} className="bg-transparent" onClick={closeAll}>
            <Link href={`${pathname}/${renter?.id}?t=matchfinder`}>
              <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="w-full h-[900px] px-8 overflow-x-scroll">
        <Tabs
          defaultValue="buyerinfo"
          className=" border border-[#E5E8EB] p-6 rounded-lg shadow min-h-[900px] overflow-x-scroll"
        >
          <TabsList className="w-full bg-transparent h-14 mb-4">
            <TabsTrigger
              value="buyerinfo"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Renter&apos;s Info
            </TabsTrigger>
            <TabsTrigger
              value="matchfinder"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Match Finder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyerinfo" className="h-full max-h-[800px] w-full overflow-y-auto pb-36">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between">
              <div className="w-full">
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <p className="font-bold text-light-text mb-4">Personal Information</p>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Email", value: renter?.email },
                      { label: "Mobile", value: formatPhoneNumber(renter?.phoneNumber || "") },
                      { label: "#Adults", value: renter?.adultCount },
                      { label: "#Children", value: renter?.childrenCount },
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
                  <p className="font-bold text-light-text mb-4">Financals</p>
                  <div className="flex flex-col gap-4">
                    {[
                      {
                        label: "Max. Budget",
                        value: renter?.maxRentalPrice?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }),
                      },
                      {
                        label: "HH Income/year",
                        value: renter?.annualHouseholdIncome?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }),
                      },
                      { label: "Credit Score", value: renter?.creditScore },
                    ].map(({ label, value }, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                        <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap capitalize">
                          {typeof value === "string" ? <p className="truncate">{value}</p> : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <p className="font-bold text-light-text mb-4">Voucher</p>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Owns a voucher?", value: renter?.voucher || "No" },
                      renter?.voucher == "Yes" && renter?.voucherAmount
                        ? {
                            label: "Voucher Amount",
                            value: renter?.voucherAmount?.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            }),
                          }
                        : {},
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
                  <p className="font-bold text-light-text mb-4">Preferences</p>
                  <div className="flex flex-col gap-4">
                    {[
                      {
                        label: "County",
                        value:
                          getCountiesForNeighborhoods(renter?.targetAreas || []).length > 0
                            ? getCountiesForNeighborhoods(renter?.targetAreas || [])
                            : "-",
                      },
                      {
                        label: "Neighborhoods",
                        value: renter?.targetAreas,
                      },
                      { label: "Property Type", value: renter?.propertyType },

                      { label: "#Bedrooms", value: renter?.bedroomCount },
                      { label: "#Bathrooms", value: renter?.bathroomCount },
                      { label: "Pets", value: getPetOwned(renter?.petOwned || "") },
                    ].map(({ label, value }, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-4 ${typeof value === "object" ? "flex-col items-start" : ""}`}
                      >
                        <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                        <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {typeof value === "string" ? (
                            <p className="truncate">{value}</p>
                          ) : typeof value === "object" ? (
                            <div className="flex flex-wrap gap-2">
                              {value.map((item) => (
                                <p
                                  key={item}
                                  className="truncate bg-[#F9F9F9] px-2 py-1 rounded-md border border-[#E5E8EB]"
                                >
                                  {item}
                                </p>
                              ))}
                            </div>
                          ) : (
                            value
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <p className="font-bold text-light-text mb-4">Amenities</p>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Laundry", value: renter?.amenities.includes("laundryInUnit") ? "Yes" : "No" },

                      { label: "Swiming Pool", value: renter?.amenities.includes("swimmingPool") ? "Yes" : "No" },
                      { label: "Parking", value: renter?.amenities.includes("parkingSpace") ? "Yes" : "No" },
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
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
                  <p className="font-bold text-light-text mb-4">Notes</p>
                  <div>
                    <ScrollArea className="h-[325px] w-full">
                      <div className="pb-6 mx-1">
                        {renterNotes.map((item, index) => (
                          <div key={index} className="relative pl-5 pb-9">
                            <div className="absolute left-0.5 top-0 bottom-0 w-px bg-[#5B7083]" />

                            <div className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full bg-[#5B7083]" />

                            <div className="">
                              <p
                                dangerouslySetInnerHTML={{ __html: item.note }}
                                className="text-light-text font-medium"
                              />
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
          </TabsContent>
          <TabsContent value="matchfinder" className="h-full max-h-[800px] overflow-hidden">
            <div className="h-full w-full overflow-x-auto">
              <MatchFinderRenter Data={(renter as Renter) || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
