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

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Renter } from "@/types/buyers-agent";
import formatPhoneNumber from "@/lib/formatNumber";
import { toast } from "sonner";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatTimestamp } from "@/lib/Timestamps";
import UserDetailsSkeleton from "@/components/user-details-skeleton";
import { useLayoutEffect, useRef, useState } from "react";
import { RichTextEditor } from "@/components/Richtext";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "../data-table";
import MatchFinderRenter from "@/components/match-finder-renter";
import EditRenterForm from "../edit-renter-form";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";

async function fetchRenter(id: string) {
  const response = await fetch(`/api/renters/${id}`, {
    method: "GET",
  });
  const data = await response.json();
  return data.data.renters[0] as Renter;
}

export default function RenterDetails() {
  const searchParams = useSearchParams();
  const tabType = searchParams.get("t") || "renterinfo";
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [editRenterOpen, setEditRenterOpen] = useState(false);
 const bottomRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
  }, [activityNote]);

  const queryClient = useQueryClient();
  const { id } = useParams();

  const {
    data: renter,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["renter", id],
    queryFn: () => fetchRenter(id as string),
    enabled: !!id,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["renter", id]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getPetOwned = (petOwned: string) => {
    if (petOwned === "dog") {
      return "Yes, Dogs";
    } else if (petOwned === "cat") {
      return "Yes, Cats";
    } else if (petOwned === "both") {
      return "Yes, Both";
    } else {
      return "No";
    }
  };

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/renters/note/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: activityNote,
          renterId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to add Activity Note");
      }

      const _responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["renter", id] });
      queryClient.invalidateQueries({ queryKey: ["renters"] });

      // //console.log("CREATE renter RESPONSE:", responseData);

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

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

  const handleEditRenterSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["renter", id] });
    setEditRenterOpen(false);
  };

  if (isLoading || isFetching) {
    return <UserDetailsSkeleton />;
  }

  return (
    <div className="w-full ">
      <div className="flex justify-between  px-2 mb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-light-text text-2xl font-bold">
            {renter?.firstName} {renter?.lastName}
          </h1>
          <span className="px-2 rounded-[8px] text-[#07192C] font-normal border border-[#ebe5eb] bg-[#ebe5eb]">
            Renter
          </span>
        </div>
        <div className="flex gap-2 pr-12">
          <Select>
            <SelectTrigger size="sm" className="bg-primary !text-white">
              <SelectValue placeholder="Active" className="text-white" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <FormSheet
            buttonText="Edit renter"
            title="Edit renter"
            sections={sections}
            open={editRenterOpen}
            onOpenChange={setEditRenterOpen}
            onSuccess={handleEditRenterSuccess}
            icon
          >
            <EditRenterForm renter={renter as Renter} onSuccess={handleEditRenterSuccess} />
          </FormSheet>
          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Link href={"contacts/1"}>
              <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
            </Link>
          </Button> */}
        </div>
      </div>
      <div className="w-full max-w-full h-[900px] px-2">
        <Tabs
          defaultValue={tabType}
          className="border border-[#E5E8EB] p-6 rounded-lg shadow min-h-[900px] h-full max-w-[73vw] flex-1"
        >
          <TabsList className="w-full bg-transparent h-14 mb-4">
            <TabsTrigger
              value="renterinfo"
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

          <TabsContent value="renterinfo" className="h-full max-h-[800px] w-full overflow-y-auto pb-36">
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
                        {renter?.activityNotes.map((item, index) => (
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
                        ))}<div ref={bottomRef} />
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
          <TabsContent value="matchfinder" className="h-full max-h-[800px] w-full">
            <div className="h-full w-full overflow-auto">
              <MatchFinderRenter Data={(renter as Renter) || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
