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
import {
  Dialog,
  DialogContent,
  // DialogDescription,
  // DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLayoutEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { LeadsBuyer } from "@/types/leads";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";
import { Amenities } from "@/types/shared";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Richtext";
import { useRouter } from "next/navigation";
import { SheetClose } from "@/components/ui/sheet";
import FormSheet from "@/components/ui/form-sheet";
import EditBuyerForm from "./edit-buyer-form";
import { sections } from "./data-table";

export default function ViewLeadBuyer({
  leadsBuyer,
  closeAll,
}: {
  leadsBuyer: LeadsBuyer | undefined | null;
  closeAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [leadType, setLeadType] = useState<string>(leadsBuyer?.leadType || "");
  const [status, setStatus] = useState<string>(leadsBuyer?.status || "");
  const [isUpdatingleadType, setIsUpdatingleadType] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const handleEditSuccess = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["lead-buyer", leadsBuyer?._id] });
    queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });
  };

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [activityNote]);

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/leads/buyer/activities/${leadsBuyer?._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: activityNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Buyer");
      }

      queryClient.invalidateQueries({ queryKey: ["lead-buyer", leadsBuyer?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      // console.error("Error creating note:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to create buyer",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleSignLead = async () => {
    try {
      setIsSigning(true);
      router.push("/buyers/buyer/convert-lead" + `/${leadsBuyer?._id}`);
    } catch (error) {
      setIsSigning(false);
      // console.error("Error creating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to sign leads buyer",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateLeadType = async (leadType: string) => {
    try {
      setIsUpdatingleadType(true);

      const response = await fetch("/api/leads/buyer/update-leadtype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsBuyer?._id, leadType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to edit Buyer");
      }

      setOpen(false);

      queryClient.invalidateQueries({ queryKey: ["lead-buyer", leadsBuyer?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });

      setIsUpdatingleadType(false);
      setLeadType(leadType);

      toast.success("Buyer Updated successfully");
    } catch (error) {
      setIsUpdatingleadType(false);
      // console.error("Error creating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to sign leads buyer",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/leads/buyer/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsBuyer?._id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads Buyer Status");
      }

      queryClient.invalidateQueries({ queryKey: ["lead-buyer", leadsBuyer?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Buyer Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      // console.error("Error updating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to update leads buyer status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const getMissingFields = (lead: LeadsBuyer) => {
    const missingFields: string[] = [];

    // Full name
    if (!lead?.firstName || !lead?.lastName) {
      missingFields.push("Full name (first and last name)");
    }

    // Contact
    if (!lead?.phoneNumber) missingFields.push("Phone number");
    if (!lead?.email) missingFields.push("Email address");

    // Counts
    // if (!lead?.adultCount) {
    //   missingFields.push("Number of adults");
    // }
    // if (!lead?.childrenCount ) missingFields.push("Number of children");
    if (!lead?.bathroomCount) missingFields.push("Bathroom count");
    if (!lead?.bedroomCount) missingFields.push("Bedroom count");

    // Pets
    // if (!lead?.petOwned) missingFields.push("Pet owned");
    if (lead?.havePet && !lead?.petOwned) {
      missingFields.push("Pet details");
    }

    // Location
    // if (!lead?.county || lead?.county.length === 0) missingFields.push("County");
    if (!lead?.targetAreas || lead?.targetAreas.length === 0) {
      missingFields.push("Target areas");
    }

    // Property
    if (!lead?.propertyType) missingFields.push("Property type");

    // Financing
    if (!lead?.financingType) missingFields.push("Financing type");
    if (lead?.preApproved && (!lead?.preApprovedAmount || lead?.preApprovedAmount <= 0)) {
      missingFields.push("Pre-approved amount");
    }

    // Amenities
    // if (!lead?.amenities || lead?.amenities.length === 0) {
    //   missingFields.push("Amenities");
    // }

    return missingFields;
  };

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-light-text text-2xl font-bold">
            {leadsBuyer?.firstName} {leadsBuyer?.lastName}
          </h1>
          <span className="px-2 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] bg-[#D2E3F9]">
            Buyer
          </span>
        </div>
        <div className="flex gap-2 pr-12">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size={"sm"} disabled={leadsBuyer?.isSigned}>
                {leadsBuyer?.isSigned ? "Signed" : "Sign"}
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              {getMissingFields(leadsBuyer as LeadsBuyer).length === 0 && (
                <>
                  <DialogHeader>
                    <DialogTitle>Signed Lead?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    Move lead to <span className="font-bold">Buyer&apos;s Agent Portal</span>
                    <Separator className="my-4" />
                    If you have signed a contract with this lead, this will convert the lead as a{" "}
                    <span className="font-bold">Buyer</span> in the Buyer&apos;s Agent Portal.
                    <br />
                    <br />
                    Are you sure you want to proceed?
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="bg-[#F9F9F9] border border-[#E5E8EB]"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSignLead}
                      disabled={leadsBuyer?.isSigned}
                    >
                      {isSigning ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                    </Button>
                  </DialogFooter>
                </>
              )}
              {getMissingFields(leadsBuyer as LeadsBuyer).length > 0 && (
                <>
                  {" "}
                  <DialogHeader className="gap-6">
                    <DialogTitle className="text-xl font-semibold">Sign Client</DialogTitle>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <p>Please provide the following missing information to Sign this Client:</p>
                      <ul className="list-disc pl-4 mt-2">
                        {getMissingFields(leadsBuyer as LeadsBuyer).map((field, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {field}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-500 mt-2">
                        These details are required in order to sign a Client.
                      </p>
                    </div>
                  </DialogHeader>
                  <div className="flex w-full self-auto justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      // className="rounded-[16px] h-[48px]"
                    >
                      Cancel
                    </Button>
                    <SheetClose
                      onClick={() => setEditOpen(true)}
                      className="bg-primary text-white h-8 px-4 rounded-lg text-center hover:bg-primary hover:text-white cursor-pointer"
                    >
                      Edit Information
                    </SheetClose>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          <Select value={status} onValueChange={(e) => handleUpdateStatus(e)} disabled={isUpdatingStatus}>
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Active" defaultValue={leadsBuyer?.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={leadType} onValueChange={(e) => handleUpdateLeadType(e)} disabled={isUpdatingleadType}>
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Hot" defaultValue={leadsBuyer?.leadType} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Type</SelectLabel>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Cold">Cold</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <FormSheet
            buttonText="Edit Buyer Lead"
            title="Edit Buyer Lead"
            sections={sections}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={handleEditSuccess}
            icon
          >
            <EditBuyerForm leadsBuyer={leadsBuyer as LeadsBuyer} onSuccess={handleEditSuccess} />
          </FormSheet>

          <Button variant={"ghost"} size={"icon"} className="bg-transparent" onClick={closeAll}>
            <Link href={"/leads/buyer/" + leadsBuyer?._id}>
              <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
            </Link>
          </Button>
          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Trash2 color="#E35B4F" />{" "}
          </Button> */}
        </div>
      </div>
      <ScrollArea className="w-full h-[900px] px-8 pb-36">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
          <div className="w-full ">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
              <p className="font-bold text-light-text mb-4">Personal Information</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Email", value: leadsBuyer?.email },
                  { label: "Mobile", value: formatPhoneToInternational(leadsBuyer?.phoneNumber || "") },
                  { label: "#Adults", value: leadsBuyer?.adultCount },
                  { label: "#Children", value: leadsBuyer?.childrenCount },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-24 shrink-0">{label}</p>
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
                  { label: "Financing Type", value: leadsBuyer?.financingType || "-" },
                  {
                    label: "Max. Budget",
                    value:
                      leadsBuyer?.maxPurchasePrice?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }) || "-",
                  },
                  { label: "Pre-approved?", value: leadsBuyer?.preApproved ? "Yes" : "No" },
                  leadsBuyer?.preApproved
                    ? {
                        label: "Pre-approved Amount",
                        value: leadsBuyer?.preApprovedAmount?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }),
                      }
                    : {},
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-32 shrink-0 capitalize">{label}</p>
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
                      getCountiesForNeighborhoods(leadsBuyer?.targetAreas || []).length > 0
                        ? getCountiesForNeighborhoods(leadsBuyer?.targetAreas || [])
                        : "-",
                  },
                  {
                    label: "Neighborhoods",
                    value:
                      leadsBuyer?.targetAreas && leadsBuyer?.targetAreas?.length > 0 ? leadsBuyer?.targetAreas : "-",
                  },
                  { label: "Property Type", value: leadsBuyer?.propertyType || "-" },

                  { label: "#Bedrooms", value: leadsBuyer?.bedroomCount || "0+" },
                  { label: "#Bathrooms", value: leadsBuyer?.bathroomCount || "0+" },
                  { label: "Pets", value: leadsBuyer?.petOwned ? `Yes, ${leadsBuyer?.petOwned}` : "No" },
                ].map(({ label, value }, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 ${typeof value === "object" ? "flex-col items-start" : ""}`}
                  >
                    <p className="text-light-text-secondary text-sm w-24 shrink-0">{label}</p>
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
                  {
                    label: "Laundry",
                    value: leadsBuyer?.amenities?.includes(Amenities.LaundryInUnit) ? "Yes" : "No",
                  },
                  {
                    label: "Swimming Pool",
                    value: leadsBuyer?.amenities?.includes(Amenities.SwimmingPool) ? "Yes" : "No",
                  },
                  {
                    label: "Parking",
                    value: leadsBuyer?.amenities?.includes(Amenities.ParkingSpace) ? "Yes" : "No",
                  },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-24 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <p className="truncate">{value}</p>
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
                    {leadsBuyer?.activityNotes?.map((item, index) => (
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
    </>
  );
}
