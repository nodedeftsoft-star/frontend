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
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import formatPhoneNumber, { formatPhoneToInternational } from "@/lib/formatNumber";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Richtext";
import { Contact } from "@/types/contact";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";
import { getPetOwned } from "@/lib";
import ExpandedViewSkeleton from "@/components/expanded-view-skeleton";

export default function ViewContact({ contact }: { contact?: Contact | undefined | null }) {
  const params = useParams();
  // const router = useRouter();
  const queryClient = useQueryClient();

  // Detect if component is being used as a page or modal
  const isPageView = Boolean(!contact && params?.id);
  const contactId = isPageView ? (params.id as string) : contact?._id;

  // If neither contact prop nor ID param is available, show error

  const [contactData, setContactData] = useState<Contact | null>(contact || null);
  const [isLoading, setIsLoading] = useState<boolean>(isPageView);
  const [error, setError] = useState<string | null>(null);

  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localActivityNotes, setLocalActivityNotes] = useState<Array<{ note: string; timestamp: number }>>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [activityNote]);

  // Fetch contact data when used as a page
  useEffect(() => {
    if (isPageView && contactId) {
      fetchContactData();
    }
  }, [isPageView, contactId]);

  // Initialize state when contact data changes
  useEffect(() => {
    if (contactData) {
      setStatus(contactData?.status || "");
      setLocalActivityNotes(contactData?.contact?.activityNotes || []);
    }
  }, [contactData]);

  // Sync local notes when props change (for modal usage)
  useEffect(() => {
    if (contact?.contact?.activityNotes) {
      setLocalActivityNotes(contact?.contact?.activityNotes);
    }
  }, [contact]);

  if (!contact && !contactId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">No contact data or ID provided</p>
      </div>
    );
  }
  const fetchContactData = async () => {
    if (!contactId) return;

    try {
      setIsLoading(true);
      setError(null);

      const cachedData = queryClient.getQueryData(["contacts", contactId]);
      if (cachedData) {
        setContactData(cachedData as Contact);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/contacts/${contactId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch contact data");
      }

      const data = await response.json();
      setContactData(data.data.contacts[0]);

      // Cache the fetched data
      queryClient.setQueryData(["contact", contactId], data.data.contacts[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contact data");
      toast("Error", {
        description: "Failed to fetch contact data",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state when fetching data as a page
  if (isLoading) {
    return <ExpandedViewSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchContactData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  // Show message if no contact data
  if (!contactData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No contact data available</p>
      </div>
    );
  }

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      let response;

      const contactType = contactData?.contactType.toLocaleLowerCase();

      if (contactType === "buyer") {
        response = await fetch(`/api/buyers/note/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: activityNote,
            buyerId: contactData?.contact.id,
          }),
        });
      } else if (contactType === "renter") {
        response = await fetch(`/api/renters/note/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: activityNote,
            renterId: contactData?.contact.id,
          }),
        });
      } else {
        response = await fetch(`/api/prospect/note/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: activityNote,
            prospectId: contactData?.contact.id,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add note");
      }

      const _responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

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
      // console.error("Error creating note:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to add note",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/contacts/change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status, id: contactData?._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update contact status");
      }

      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Contact status updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      // console.error("Error updating status:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to update contact status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-light-text text-2xl font-bold">
            {contactData?.contact?.firstName} {contactData?.contact?.lastName}
          </h1>

          <span
            className={`px-2 rounded-[8px] text-[#07192C] font-normal border ${(() => {
              const type =
                contactData?.contactType?.toLowerCase() === "prospect"
                  ? contactData.contact.prospectType?.toLowerCase()
                  : contactData?.contactType?.toLowerCase();

              return (
                {
                  buyer: "bg-[#D2E3F9]",
                  renter: "bg-[#D9D3F8]",
                  agent: "bg-[#CAF7F5]",
                  seller: "bg-[#F7E6CA]",
                  landlord: "bg-[#D9E5FC]",
                }[type] || "bg-purple-200"
              );
            })()}`}
          >
            {contactData?.contactType?.toLowerCase() === "prospect"
              ? contactData?.contact?.prospectType
              : contactData?.contactType}
          </span>
        </div>
        <div className="flex gap-2 pr-12">
          <Select
            value={status}
            defaultValue={contactData?.status}
            onValueChange={(e) => handleUpdateStatus(e)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Pencil />
          </Button> */}
          {/* Only show expand button when used as modal */}
          {!isPageView && (
            <Button variant={"ghost"} size={"icon"} className="bg-transparent">
              <Link href={"/contacts/" + contactData?._id}>
                <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
              </Link>
            </Button>
          )}
          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Trash2 color="#E35B4F" />{" "}
          </Button> */}
        </div>
      </div>
      <ScrollArea className="h-[900px] pb-36 mx-8 ">
        {/* BUYER */}
        {(contactData?.contactType?.toLowerCase() == "buyer" ||
          contactData?.contact?.prospectType?.toLowerCase() == "buyer") && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow">
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Listing Type",
                      value: (
                        <p className="text-[#07192C] px-2 w-fit rounded-lg bg-[#D2E3F9]">
                          {contactData?.contactType?.toLowerCase() === "prospect"
                            ? contactData?.contact?.prospectType
                            : contactData?.contactType}
                        </p>
                      ),
                    },
                    { label: "Email", value: contactData?.contact?.email },
                    { label: "Mobile", value: formatPhoneNumber(contactData?.contact?.phoneNumber || "") },
                    { label: "#Adults", value: contactData?.contact?.adultCount },
                    { label: "#Children", value: contactData?.contact?.childrenCount },
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
                <p className="font-bold text-light-text mb-4">Financials</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Financing Type", value: contactData?.contact?.financingType },
                    {
                      label: "Max. Budget",
                      value: `$${
                        contactData?.contact?.maxPurchasePrice
                          ? contactData?.contact?.maxPurchasePrice.toLocaleString("en-US")
                          : "-"
                      }`,
                    },
                    { label: "Pre-approved?", value: contactData?.contact?.preApproved ? "Yes" : "No" },
                    ...(contactData?.contact?.preApproved
                      ? [
                          {
                            label: "Pre-approved Amount",
                            value: `$${
                              contactData?.contact?.preApprovedAmount
                                ? contactData?.contact?.preApprovedAmount.toLocaleString("en-US")
                                : "-"
                            }`,
                          },
                        ]
                      : []),
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
            </div>
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Preferences</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "County",
                      value:
                        getCountiesForNeighborhoods(contactData?.contact?.targetAreas || []).length > 0
                          ? getCountiesForNeighborhoods(contactData?.contact?.targetAreas || [])
                          : "-",
                    },
                    {
                      label: "Neighborhoods",
                      value: contactData?.contact?.targetAreas,
                    },
                    { label: "Property Type", value: contactData?.contact?.propertyType },

                    { label: "#Bedrooms", value: contactData?.contact?.bedroomCount },
                    { label: "#Bathrooms", value: contactData?.contact?.bathroomCount },
                    { label: "Pets", value: getPetOwned(contactData?.contact?.petOwned || "") },
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
                            {value.map((item: string) => (
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
                    {
                      label: "Laundry",
                      value: contactData?.contact?.amenities?.includes("laundryInUnit") ? "Yes" : "No",
                    },

                    {
                      label: "Swimming Pool",
                      value: contactData?.contact?.amenities?.includes("swimmingPool") ? "Yes" : "No",
                    },
                    {
                      label: "Parking",
                      value: contactData?.contact?.amenities?.includes("parkingSpace") ? "Yes" : "No",
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

            <div className="w-full h-full">
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
        )}

        {/* RENTER */}
        {(contactData?.contactType.toLowerCase() == "renter" ||
          contactData?.contact?.prospectType?.toLowerCase() == "renter") && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full ">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Listing Type",
                      value: (
                        <p className="text-[#07192C] px-2 w-fit rounded-lg bg-[#D9D3F8]">
                          {contactData?.contactType?.toLowerCase() === "prospect"
                            ? contactData?.contact?.prospectType
                            : contactData?.contactType}
                        </p>
                      ),
                    },
                    { label: "Email", value: contactData?.contact?.email },
                    { label: "Mobile", value: formatPhoneToInternational(contactData?.contact?.phoneNumber || "") },
                    { label: "#Adults", value: contactData?.contact?.adultCount },
                    { label: "#Children", value: contactData?.contact?.childrenCount },
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
                <p className="font-bold text-light-text mb-4">Financials</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "HH Income/year",
                      value: contactData?.contact?.annualHouseholdIncome?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }),
                    },
                    {
                      label: "Max. Budget",
                      value: contactData?.contact?.maxRentalPrice?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }),
                    },
                    {
                      label: "Credit Score",
                      value: contactData?.contact?.creditScore,
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
                <p className="font-bold text-light-text mb-4">Voucher</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Owns a voucher?", value: contactData?.contact?.voucher || "No" },
                    ...(contactData?.contact?.voucher == "Yes" && contactData?.contact?.voucherAmount
                      ? [
                          {
                            label: "Voucher Amount",
                            value: contactData?.contact?.voucherAmount?.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            }),
                          },
                        ]
                      : []),
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
                    { label: "County", value: getCountiesForNeighborhoods(contactData?.contact?.targetAreas || []) },
                    {
                      label: "Neighborhoods",
                      value: contactData?.contact?.targetAreas || [],
                    },
                    { label: "Property Type", value: contactData?.contact?.propertyType },
                    { label: "#Bedrooms", value: contactData?.contact?.bedroomCount },
                    { label: "#Bathrooms", value: contactData?.contact?.bathroomCount },
                    {
                      label: "Pets",
                      value: contactData?.contact?.havePet ? `Yes, ${contactData?.contact?.petOwned}` : "No",
                    },
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
                            {value.map((item: string) => (
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
                    {
                      label: "Laundry",
                      value: contactData?.contact?.amenities?.includes("laundryInUnit") ? "Yes" : "No",
                    },
                    {
                      label: "Swimming Pool",
                      value: contactData?.contact?.amenities?.includes("swimmingPool") ? "Yes" : "No",
                    },
                    {
                      label: "Parking",
                      value: contactData?.contact?.amenities?.includes("parkingSpace") ? "Yes" : "No",
                    },
                  ].map(({ label, value }, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                      <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        <p className="truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full h-full">
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
        )}

        {/* {"AGENT"} */}
        {contactData?.contact?.prospectType?.toLowerCase() == "agent" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full ">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Listing Type",
                      value: (
                        <p className="text-[#07192C] px-2 w-fit rounded-lg bg-[#CAF7F5]">
                          {contactData?.contact.propertyType}
                        </p>
                      ),
                    },
                    { label: "Email", value: contactData?.contact?.email },
                    { label: "Mobile", value: formatPhoneToInternational(contactData?.contact?.phoneNumber || "") },
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
                <p className="font-bold text-light-text mb-4">Brokerage</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Full Name", value: contactData?.contact?.brokerName },
                    { label: "Email", value: contactData?.contact?.brokerEmail },
                    {
                      label: "Mobile",
                      value:
                        contactData?.contact?.brokerPhoneNumber &&
                        formatPhoneNumber(contactData?.contact?.brokerPhoneNumber),
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
                <p className="font-bold text-light-text mb-4">Preferences</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "County", value: getCountiesForNeighborhoods(contactData?.contact?.targetAreas || []) },
                    {
                      label: "Neighborhoods",
                      value: contactData?.contact?.targetAreas || [],
                    },
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
                            {value.map((item: string) => (
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
            </div>
          </section>
        )}

        {/* SELLER */}
        {contactData?.contact?.prospectType?.toLowerCase() == "seller" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Details</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Listing Type",
                      value: (
                        <p className="text-[#07192C] px-2 w-fit rounded-lg bg-[#F7E6CA]">
                          {contactData?.contact.propertyType}
                        </p>
                      ),
                    },
                    { label: "Address Line 1", value: contactData?.contact?.propertyAddress },
                    { label: "Address Line 2", value: contactData?.contact?.propertyState },
                    { label: "Location", value: contactData?.contact?.propertyCounty },
                    { label: "Property Type", value: contactData?.contact?.propertyType },
                    {
                      label: "Price",
                      value: `$${
                        contactData?.contact?.propertyPrice
                          ? contactData?.contact?.propertyPrice.toLocaleString("en-US")
                          : "-"
                      }`,
                    },
                    { label: "Allowed Pets", value: contactData?.contact?.havePet ? "Yes" : "No" },
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
                <p className="font-bold text-light-text mb-4">Owner</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Name", value: contactData?.contact?.firstName + " " + contactData?.contact?.lastName },
                    { label: "Contact", value: formatPhoneToInternational(contactData?.contact?.phoneNumber || "") },
                    { label: "Email", value: contactData?.contact?.email },
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

            <div className="w-full h-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 h-full">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {localActivityNotes.map((item, index) => (
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
        )}

        {/* LANDLORD */}
        {contactData?.contact?.prospectType?.toLowerCase() == "landlord" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Details</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Listing Type",
                      value: (
                        <p className="text-[#07192C] px-2 w-fit rounded-lg bg-[#D9E5FC]">
                          {contactData?.contact.propertyType}
                        </p>
                      ),
                    },
                    { label: "Address Line 1", value: contactData?.contact?.propertyAddress },
                    { label: "Address Line 2", value: contactData?.contact?.propertyState },
                    { label: "Location", value: contactData?.contact?.propertyCounty },
                    { label: "Property Type", value: contactData?.contact?.propertyType },
                    {
                      label: "Price",
                      value: `$${
                        contactData?.contact?.propertyPrice
                          ? contactData?.contact?.propertyPrice.toLocaleString("en-US")
                          : "-"
                      }`,
                    },
                    { label: "Allowed Pets", value: contactData?.contact?.havePet ? "Yes" : "No" },
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
                <p className="font-bold text-light-text mb-4">Landlord</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Name", value: contactData?.contact?.firstName + " " + contactData?.contact?.lastName },
                    { label: "Contact", value: formatPhoneToInternational(contactData?.contact?.phoneNumber || "") },
                    { label: "Email", value: contactData?.contact?.email },
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

            <div className="w-full h-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 h-full">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {localActivityNotes.map((item, index) => (
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
        )}

        {/* AGENT */}
        {contactData?.contactType.toLowerCase() == "landlord" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Details</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Name", value: contactData?.contact?.firstName + " " + contactData?.contact?.lastName },
                    { label: "Contact", value: formatPhoneToInternational(contactData?.contact?.phoneNumber || "") },
                    { label: "Email", value: contactData?.contact?.email },
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

            <div className="w-full h-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 h-full">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {localActivityNotes.map((item, index) => (
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
        )}
      </ScrollArea>
    </>
  );
}
