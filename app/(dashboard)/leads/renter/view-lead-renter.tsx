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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLayoutEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { LeadsRenter } from "@/types/leads";
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
import EditRenterForm from "./edit-renter-form";
import { sections } from "./data-table";

export default function ViewLeadRenter({
  leadsRenter,
  closeAll,
}: {
  leadsRenter: LeadsRenter | undefined | null;
  closeAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [leadType, setLeadType] = useState<string>(leadsRenter?.leadType || "");
  const [status, setStatus] = useState<string>(leadsRenter?.status || "");
  const [isUpdatingleadType, setIsUpdatingleadType] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  //console.log("LEADS RENTER:", leadsRenter);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const handleEditSuccess = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["lead-renter", leadsRenter?._id] });
    queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });
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

      const response = await fetch(`/api/leads/renter/activities/${leadsRenter?._id}`, {
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
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Renter");
      }

      // const responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["lead-renter", leadsRenter?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });

      //console.log("CREATE RENTER RESPONSE:", responseData);

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      // setLeadsRenterData(responseData?.data);
      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      // console.error("Error creating note:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Renter with this email already exists"
            : "Failed to create renter",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleSignLead = async () => {
    try {
      setIsSigning(true);
      queryClient.invalidateQueries({ queryKey: ["renters"] });
      router.push("/buyers/renter/convert-lead" + `/${leadsRenter?._id}`);
    } catch (error) {
      setIsSigning(false);
      // console.error("Error creating renter:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Renter with this email already exists"
            : "Failed to sign leads renter",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateLeadType = async (leadType: string) => {
    try {
      setIsUpdatingleadType(true);

      const response = await fetch("/api/leads/renter/update-leadtype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsRenter?._id, leadType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to edit Renter");
      }

      setOpen(false);

      queryClient.invalidateQueries({ queryKey: ["lead-renter", leadsRenter?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });

      setIsUpdatingleadType(false);
      setLeadType(leadType);

      toast.success("Renter Updated successfully");
    } catch (error) {
      setIsUpdatingleadType(false);
      // console.error("Error creating renter:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Renter with this email already exists"
            : "Failed to sign leads renter",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/leads/renter/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsRenter?._id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads Renter Status");
      }

      queryClient.invalidateQueries({ queryKey: ["lead-renter", leadsRenter?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Renter Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      // console.error("Error updating renter:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Renter with this email already exists"
            : "Failed to update leads renter status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const getMissingFields = (lead: LeadsRenter) => {
    const missingFields: string[] = [];

    if (!lead?.firstName || !lead?.lastName) {
      missingFields.push("Full name (first and last name)");
    }
    if (!lead?.phoneNumber) missingFields.push("Phone number");
    if (!lead?.email) missingFields.push("Email address");
    if (!lead?.adultCount) missingFields.push("Number of adults");
    // if (!lead?.childrenCount) missingFields.push("Number of children");
    if (!lead?.bathroomCount) missingFields.push("Bathroom count");
    // if (!lead?.petOwned) missingFields.push("Pet owned");
    // if (!lead?.county || lead?.county.length === 0) missingFields.push("County");
    if (!lead?.targetAreas || lead?.targetAreas.length === 0) missingFields.push("Target areas");
    if (!lead?.propertyType) missingFields.push("Property type");
    if (!lead?.bedroomCount) missingFields.push("Bedroom count");
    if (!lead?.creditScore) missingFields.push("Credit score");
    // if (!lead?.voucher) missingFields.push("Voucher");
    // if (!lead?.amenities || lead?.amenities.length === 0) missingFields.push("Amenities");

    return missingFields;
  };

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-light-text text-2xl font-bold">
            {leadsRenter?.firstName} {leadsRenter?.lastName}
          </h1>
          <span className="px-2 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] bg-[#D2E3F9]">
            Renter
          </span>
        </div>
        <div className="flex gap-2 pr-12">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size={"sm"} disabled={leadsRenter?.isSigned}>
                {leadsRenter?.isSigned ? "Signed" : "Sign"}
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              {getMissingFields(leadsRenter as LeadsRenter).length === 0 && (
                <>
                  <DialogHeader>
                    <DialogTitle>Signed Lead?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    Move lead to <span className="font-bold">Renter Portal</span>
                    <Separator className="my-4" />
                    If you have signed a contract with this lead, this will convert the lead as a{" "}
                    <span className="font-bold">Renter</span> in the Renter Portal.
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
                      disabled={leadsRenter?.isSigned}
                    >
                      {isSigning ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                    </Button>
                  </DialogFooter>
                </>
              )}

              {getMissingFields(leadsRenter as LeadsRenter).length > 0 && (
                <>
                  {" "}
                  <DialogHeader className="gap-6">
                    <DialogTitle className="text-xl font-semibold">Sign Client</DialogTitle>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <p>Please provide the following missing information to Sign this Client:</p>
                      <ul className="list-disc pl-4 mt-2">
                        {getMissingFields(leadsRenter as LeadsRenter).map((field, index) => (
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
                      className="bg-primary text-white h-8 px-2 rounded-lg text-center hover:bg-primary hover:text-white cursor-pointer"
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
              <SelectValue placeholder="Active" defaultValue={leadsRenter?.status} />
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
              <SelectValue placeholder="Hot" defaultValue={leadsRenter?.leadType} />
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
            buttonText="Edit Renter Lead"
            title="Edit Renter Lead"
            sections={sections}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={handleEditSuccess}
            icon
          >
            <EditRenterForm leadsRenter={leadsRenter as LeadsRenter} onSuccess={handleEditSuccess} />
          </FormSheet>

          <Button variant={"ghost"} size={"icon"} className="bg-transparent" onClick={closeAll}>
            <Link href={"/leads/renter/" + leadsRenter?._id}>
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
                  { label: "Email", value: leadsRenter?.email },
                  { label: "Mobile", value: formatPhoneToInternational(leadsRenter?.phoneNumber || "") },
                  { label: "#Adults", value: leadsRenter?.adultCount },
                  { label: "#Children", value: leadsRenter?.childrenCount },
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
              <p className="font-bold text-light-text mb-4">Financials</p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    label: "Max. Budget",
                    value: leadsRenter?.maxRentalPrice?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    }),
                  },
                  {
                    label: "HH Income/year",
                    value: leadsRenter?.annualHouseholdIncome?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    }),
                  },
                  { label: "Credit Score", value: leadsRenter?.creditScore },
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
              <p className="font-bold text-light-text mb-4">Voucher</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Owns a voucher?", value: leadsRenter?.voucher || "No" },
                  leadsRenter?.voucher == "Yes" && leadsRenter?.voucherAmount
                    ? {
                        label: "Voucher Amount",
                        value: leadsRenter?.voucherAmount?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }),
                      }
                    : {},
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
          </div>
          <div className="w-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <p className="font-bold text-light-text mb-4">Preferences</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "County", value: getCountiesForNeighborhoods(leadsRenter?.targetAreas || []) },
                  {
                    label: "Neighborhoods",
                    value: leadsRenter?.targetAreas || [],
                  },
                  { label: "Property Type", value: leadsRenter?.propertyType },
                  { label: "#Bedrooms", value: leadsRenter?.bedroomCount },
                  { label: "#Bathrooms", value: leadsRenter?.bathroomCount },
                  { label: "Pets", value: leadsRenter?.havePet ? `Yes, ${leadsRenter?.petOwned}` : "No" },
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
                    value: leadsRenter?.amenities?.includes(Amenities.LaundryInUnit) ? "Yes" : "No",
                  },
                  {
                    label: "Swimming Pool",
                    value: leadsRenter?.amenities?.includes(Amenities.SwimmingPool) ? "Yes" : "No",
                  },
                  {
                    label: "Parking",
                    value: leadsRenter?.amenities?.includes(Amenities.ParkingSpace) ? "Yes" : "No",
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
                    {leadsRenter?.activityNotes?.map((item, index) => (
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
