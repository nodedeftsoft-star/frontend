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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLayoutEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { LeadsLandLord } from "@/types/leads";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import FormSheet from "@/components/ui/form-sheet";
import { sections } from "../data-table";
import EditLeadsLandlordForm from "../edit-landlord-form";
import { RichTextEditor } from "@/components/Richtext";
import ExpandedViewSkeleton from "@/components/expanded-view-skeleton";

async function fetchLeadsLandlord(id: string) {
  const response = await fetch(`/api/leads/landlord/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("LEADS LANDLORD DATA", data);
  return data.data.landlords[0] as LeadsLandLord;
}

export default function LeadLandlordDetails() {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [editLeadLandlordOpen, setEditLeadLandlordOpen] = useState(false);
  //   const [leadsLandlordData, setLeadsLandlordData] = useState<LeadsLandLord>(leadsLandlord as LeadsLandLord);
  const [leadType, setLeadType] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [isUpdatingleadType, setIsUpdatingleadType] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [activityNote]);

  const {
    data: leadsLandlordData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["lead-landlord", id],
    queryFn: () => fetchLeadsLandlord(id as string),
    enabled: !!id,
    initialData: () => {
      return queryClient.getQueryData(["lead-landlord", id]);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/leads/landlord/activities/${leadsLandlordData?._id}`, {
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
        throw new Error(errorData.message || "Failed to add Landlord");
      }

      const _responseData = await response.json();
      queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });

      //console.log("CREATE LANDLORD RESPONSE:", responseData);

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      // console.error("Error creating note:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Landlord with this email already exists"
            : "Failed to create landlord",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleSignLead = async () => {
    try {
      setIsSigning(true);
      router.push("/listings/listing-rentals/convert-lead" + `/${leadsLandlordData?._id}`);
    } catch (error) {
      setIsSigning(false);
      // console.error("Error creating landlord:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "landlord with this email already exists"
            : "Failed to sign leads landlord",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateLeadType = async (leadType: string) => {
    try {
      setIsUpdatingleadType(true);

      const response = await fetch("/api/leads/landlord/update-leadtype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsLandlordData?._id, leadType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to edit Landlord");
      }

      setOpen(false);

      queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });

      setIsUpdatingleadType(false);
      setLeadType(leadType);

      toast.success("Landlord Updated successfully");
    } catch (error) {
      setIsUpdatingleadType(false);
      // console.error("Error creating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Landlord with this email already exists"
            : "Failed to sign leads landlord",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/leads/landlord/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsLandlordData?._id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads Landlord Status");
      }

      queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Landlord Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      // console.error("Error updating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Landlord with this email already exists"
            : "Failed to update leads Landlord status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  const handleLeadEditLandlordSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
    queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });
    setEditLeadLandlordOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get IDs of selected landlords
      const leadLandlordsIds = [leadsLandlordData?._id];

      const response = await fetch("/api/leads/landlord/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadLandlordsIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete landlords");
      }

      toast.success(`Successfully deleted lead landlord`);

      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });
      router.push("/leads/landlord");
      setOpenDelete(false);
    } catch (_error) {
      toast.error("Failed to delete lead landlord. Please try again.");
      // console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getMissingFields = (lead: LeadsLandLord) => {
    const missingFields: string[] = [];

    // Name
    if (!lead?.firstName || !lead?.lastName) {
      missingFields.push("Full name (first and last name)");
    }

    // Contact info
    if (!lead?.phoneNumber) missingFields.push("Phone number");
    if (!lead?.email) missingFields.push("Email address");

    // Target areas
    // if (!lead?.targetAreas || lead?.targetAreas.length === 0) {
    //   missingFields.push("Target areas");
    // }

    // Property details
    if (!lead?.propertyType) missingFields.push("Property type");
    if (!lead?.bedroomCount) missingFields.push("Bedroom count");
    if (!lead?.bathroomCount) missingFields.push("Bathroom count");

    // Pets
    if (lead?.havePet && !lead?.petOwned) {
      missingFields.push("Pet details");
    }

    // Amenities
    // if (!lead?.amenities || lead?.amenities.length === 0) {
    //   missingFields.push("Amenities");
    // }

    // Financing
    // if (!lead?.financingType) missingFields.push("Financing type");
    if (lead?.preApproved && !lead?.preApprovedAmount) {
      missingFields.push("Pre-approved amount");
    }

    // Pricing
    if (!lead?.propertyPrice) missingFields.push("Property price");

    // Property address
    if (!lead?.propertyAddress) missingFields.push("Property address");
    if (!lead?.propertyCounty) missingFields.push("Property county");
    if (!lead?.propertyState) missingFields.push("Property state");
    if (!lead?.propertyZipcode) missingFields.push("Property zipcode");
    if (!lead?.propertyNeighborhood) missingFields.push("Property neighborhood");

    // Description
    // if (!lead?.description) missingFields.push("Description");

    return missingFields;
  };

  if (isLoading || isFetching) {
    return <ExpandedViewSkeleton />;
  }

  return (
    <>
      <div className="flex justify-between  px-8">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-light-text text-2xl font-bold">{leadsLandlordData?.propertyAddress}</h1>
          <div className="flex items-center gap-4">
            <span className="rounded-[8px] text-[#07192C] font-normal  ">
              {`${leadsLandlordData?.propertyAddress || ""}, ${leadsLandlordData?.propertyCounty || ""}, ${
                leadsLandlordData?.propertyState?.toLocaleUpperCase() || ""
              } ${leadsLandlordData?.propertyZipcode || ""}` || ""}
            </span>
            <span className="px-2 rounded-[8px] text-[#07192C] font-normal  bg-neutral-200">Listing Details</span>
          </div>
        </div>
        <div className="flex gap-2 pr-12">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size={"sm"} disabled={leadsLandlordData?.isSigned}>
                {leadsLandlordData?.isSigned ? "Signed" : "Sign"}
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              {getMissingFields(leadsLandlordData as LeadsLandLord).length === 0 && (
                <>
                  <DialogHeader>
                    <DialogTitle>Signed Lead?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    Move lead to <span className="font-bold">landlord&apos;s Agent Portal</span>
                    <Separator className="my-4" />
                    If you have signed a contract with this lead, this will convert the lead as a{" "}
                    <span className="font-bold">landlord</span> in the landlord&apos;s Agent Portal.
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
                      disabled={leadsLandlordData?.isSigned}
                    >
                      {isSigning ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                    </Button>
                  </DialogFooter>
                </>
              )}

              {getMissingFields(leadsLandlordData as LeadsLandLord).length > 0 && (
                <>
                  {" "}
                  <DialogHeader className="gap-6">
                    <DialogTitle className="text-xl font-semibold">Sign Listing</DialogTitle>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <p>Please provide the following missing information to Sign this Listing:</p>
                      <ul className="list-disc pl-4 mt-2">
                        {getMissingFields(leadsLandlordData as LeadsLandLord).map((field, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {field}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-500 mt-2">
                        These details are required in order to sign a Listing.
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
                    <Button
                      onClick={() => setEditLeadLandlordOpen(true)}
                      className="bg-primary text-white h-8 px-2 rounded-lg text-center hover:bg-primary hover:text-white cursor-pointer"
                    >
                      Edit Information
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          <Select
            value={status}
            defaultValue={leadsLandlordData?.status}
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
          <Select
            value={leadType}
            defaultValue={leadsLandlordData?.leadType}
            onValueChange={(e) => handleUpdateLeadType(e)}
            disabled={isUpdatingleadType}
          >
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Hot" />
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
            buttonText="Edit Landlord Lead"
            title="Edit Landlord Lead"
            sections={sections}
            open={editLeadLandlordOpen}
            onOpenChange={setEditLeadLandlordOpen}
            onSuccess={handleLeadEditLandlordSuccess}
            icon
          >
            <EditLeadsLandlordForm
              leadsLandlord={leadsLandlordData as LeadsLandLord}
              onSuccess={handleLeadEditLandlordSuccess}
            />
          </FormSheet>
          <Dialog open={openDelete} onOpenChange={setOpenDelete}>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <Trash2 size={16} color="#c3011c" strokeWidth={1.75} />
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              <DialogHeader>
                <DialogTitle>Delete Landlord Lead</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                You&apos;re about to permanently delete this potential lead and all their associated information. this
                action cannot be undone.
                <br />
                <br />
                Are you sure you want to proceed?
              </DialogDescription>
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="bg-[#F9F9F9] border border-[#E5E8EB]"
                  onClick={() => setOpenDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="bg-[#E35B4F] hover:bg-[#DD3222]"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ScrollArea className="w-full h-[900px] px-8 pb-36">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
          <div className="w-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <p className="font-bold text-light-text mb-4">Details</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Listing Type", value: "Renter", highlight: true },
                  { label: "Location", value: leadsLandlordData?.propertyAddress },
                  { label: "Property Type", value: leadsLandlordData?.propertyType },
                  {
                    label: "Monthly Rent",
                    value: leadsLandlordData?.propertyPrice?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    }),
                  },

                  { label: "Allowed Pets", value: leadsLandlordData?.petOwned || "No" },
                ].map(({ label, value, highlight }, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-light-text-secondary text-sm w-32 shrink-0">{label}</p>
                    <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap capitalize">
                      {typeof value === "string" ? (
                        <p className={`${highlight ? "bg-purple-200 px-2 py-1 rounded-md w-fit" : ""}`}>{value}</p>
                      ) : (
                        <p className="truncate">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <p className="font-bold text-light-text mb-4">Owner</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Name", value: leadsLandlordData?.firstName + " " + leadsLandlordData?.lastName },
                  { label: "Contact", value: formatPhoneToInternational(leadsLandlordData?.phoneNumber || "") },
                  { label: "Email", value: leadsLandlordData?.email },
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
              <p className="font-bold text-light-text mb-4">Description</p>
              <div className="text-[#07192C] font-normal flex-1 ">{leadsLandlordData?.description}</div>
            </div>
          </div>

          <div className="w-full h-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 h-full">
              <p className="font-bold text-light-text mb-4">Notes</p>
              <div>
                <ScrollArea className="h-[325px] w-full">
                  <div className="pb-6 mx-1">
                    {leadsLandlordData?.activityNotes.map((item, index) => (
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
