"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleArrowUp, CornerDownRight, GitBranch, Loader2 } from "lucide-react";
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
import { Amenities } from "@/types/shared";
import FormSheet from "@/components/ui/form-sheet";
import EditProspectForm from "./edit-prospect-logs-form";
import { sections } from "./data-table";

import { Dispatch, SetStateAction, useLayoutEffect, useRef, useState } from "react";
import { formatPhoneToInternational } from "@/lib/formatNumber";
// import { getCountiesForNeighborhoods } from "@/lib/findCounties";
// import { Amenities } from "@/types/shared";
import { formatTimestamp } from "@/lib/Timestamps";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Richtext";
import { format } from "date-fns";
// import { useRouter } from "next/navigation";
import { Prospect as ProspectType } from "@/types/listings";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";

export default function ViewProspect({
  Prospect,
  openEdit,
  closeAll,
}: {
  Prospect: ProspectType | undefined | null;
  openEdit: Dispatch<SetStateAction<boolean>>;
  closeAll?: () => void;
}) {
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [status, setStatus] = useState<string>(Prospect?.prospectStatus || "");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [salesNotes, setSalesNotes] = useState(Prospect?.activityNotes || []);
  const [matchOpen, setMatchOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [matchCheckModal, setMatchCheckModal] = useState(false);
  const [moveCheckModal, setMoveCheckModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  console.log("PROSPECT:", Prospect);

  useLayoutEffect(() => {
    setSalesNotes(Prospect?.activityNotes || salesNotes);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [salesNotes, Prospect?.activityNotes]);

  const MatchType = Prospect?.property?.mode == "for-rent" ? "rentals" : "sales";
  const LeadsType = Prospect?.property?.mode == "for-rent" ? "renter" : "buyer";

  const queryClient = useQueryClient();

  const handleEditSuccess = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["prospect", Prospect?._id] });
    queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });
  };

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/prospects/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospectId: Prospect?._id,
          note: activityNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add notes");
      }

      // const responseData = await response.json();

      queryClient.invalidateQueries({ queryKey: ["prospect", Prospect?._id] });
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

      // setProspect(responseData?.data);
      setSalesNotes([
        ...salesNotes,
        {
          note: activityNote,
          timestamp: Date.now(),
        },
      ]);
      // console.log("NOTES:", salesNotes);
      setActivityNote("");
    } catch (error) {
      setIsSubmittingActivity(false);
      console.error("Error creating note:", error);
      toast("Error", {
        description: "Failed to add note",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsUpdatingStatus(true);

      const response = await fetch("/api/prospects/change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: Prospect?._id, status: status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Listing Status");
      }

      queryClient.invalidateQueries({ queryKey: ["prospect", Prospect?._id] });
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });

      setIsUpdatingStatus(false);
      setStatus(status);

      toast.success("Listing Status Updated successfully");
    } catch (error) {
      setIsUpdatingStatus(false);
      console.error("Error updating prospect:", error);
      toast("Error", {
        description: "Failed to update listing status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  // const handleSignLead = async () => {
  //   try {
  //     setIsSigning(true);
  //     // Add sign lead logic here
  //     setOpen(false);
  //     toast.success("Lead signed successfully");
  //   } catch (_error) {
  //     setIsSigning(false);
  //     toast("Error", {
  //       description: "Failed to sign lead",
  //       className: "border-l-4 border-l-[#FF0000] bg-white",
  //     });
  //   }
  // };

  const handleMove = async () => {
    // Check for required fields: name and at least one contact method
    if (getMissingMoveFields(Prospect as unknown as ProspectType).length > 0) {
      setMoveOpen(false);
      setMoveCheckModal(true);
      return;
    }

    setIsMoving(true);

    const response = await fetch(`/api/prospects/move`, {
      method: "POST",
      body: JSON.stringify({ id: Prospect?._id, moveTo: Prospect?.property.mode }),
    });

    const responseData = await response.json();

    if (response.ok && !responseData.message.includes("Duplicate Email")) {
      toast("Prospect moved");

      setMoveOpen(false);

      setIsMoving(false);

      // handleUpdateStatus("dead");

      queryClient.invalidateQueries({ queryKey: ["prospect", Prospect?._id] });
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });
      queryClient.setQueryData(["lead-buyer", responseData.data._id], responseData.data);
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });
      queryClient.setQueryData(["lead-renter", responseData.data._id], responseData.data);
      queryClient.invalidateQueries({ queryKey: ["leadsRenters"] });

      router.replace(`/leads/${LeadsType}/${responseData.data._id}`);
    } else if (responseData.message.includes("Duplicate Email")) {
      toast("Lead with this email already exists");
    } else if (responseData.message.includes("with that phone number")) {
      toast("Lead with this phone number already exists");
    } else {
      toast("Failed to move prospect");
    }

    setIsMoving(false);
  };

  const handleMatch = async () => {
    setIsMatching(true);
    if (getMissingFields(Prospect as unknown as ProspectType).length > 0) {
      setMatchOpen(false);
      setMatchCheckModal(true);
      setIsMatching(false);
      return;
    }

    try {
      const matchData = {
        property: Prospect?.property?._id,
        id: Prospect?._id,
        customer: Prospect?._id,
        customerType: "Prospect",
        status: "Active",
        propertyMode: Prospect?.property?.mode,
        activityNotes: Prospect?.activityNotes,
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
        throw new Error(errorData.message || "Failed to add match");
      }

      const _statusResponse = await fetch(`/api/prospects/change-status`, {
        method: "POST",
        body: JSON.stringify({ status: "converted", id: Prospect?._id }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      //console.log(statusResponse);

      const responseData = await response.json();

      //console.log("MATCH RESPONSE:", responseData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Prospect matched successfully");
      queryClient.invalidateQueries({ queryKey: ["match-sale", responseData.data._id] });
      queryClient.invalidateQueries({ queryKey: ["matchesSales"] });
      queryClient.invalidateQueries({ queryKey: ["match-rental", responseData.data._id] });
      queryClient.invalidateQueries({ queryKey: ["matchesRentals"] });
      queryClient.invalidateQueries({ queryKey: ["prospect", Prospect?._id] });
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });

      router.push(`/matches/${MatchType}/${responseData.data._id}`);

      setMatchOpen(false);
    } catch (error) {
      console.error("Error matching prospect:", error);
      toast.error("Failed to match prospect");
    } finally {
      setIsMatching(false);
    }
  };

  const getMissingFields = (prospect: ProspectType) => {
    const missingFields = [];

    // Critical fields only
    if (!prospect.firstName || !prospect.lastName) {
      missingFields.push("Full name (first and last name)");
    }

    if (!prospect.phoneNumber) {
      missingFields.push("Phone Number");
    }

    if (!prospect.email) {
      missingFields.push("Email Address");
    }

    if (!prospect?.property) {
      missingFields.push("Add a property");
    }

    return missingFields;
  };

  const getMissingMoveFields = (prospect: ProspectType) => {
    const missingFields = [];

    if (!prospect?.phoneNumber && !prospect?.email) {
      missingFields.push("Either phone number or email address");
    }

    if (!prospect?.property) {
      missingFields.push("Add a property");
    }

    return missingFields;
  };

  console.log("PROSPECT:", Prospect);

  return (
    <>
      <div className="flex justify-between  px-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-light-text text-2xl font-bold">
              {Prospect?.firstName} {Prospect?.lastName}
            </h1>
            <span
              className={`px-2 rounded-[8px] text-[#07192C] font-normal border border-[#E5E8EB] ${
                Prospect?.prospectType?.toLocaleLowerCase() == "renter"
                  ? "bg-[#d9d3f8]"
                  : Prospect?.prospectType?.toLocaleLowerCase() == "buyer"
                  ? "bg-[#d2e3f9]"
                  : "bg-[#caf7f5]"
              }`}
            >
              {Prospect?.prospectType}
            </span>
          </div>
          {Prospect?.property?.address && (
            <p className="text-light-text">
              {Prospect?.property?.address.streetAddress}, {Prospect?.property?.address.city},{" "}
              {Prospect?.property?.address.state} {Prospect?.property?.address.zipcode}
            </p>
          )}
        </div>

        <div className="flex gap-2 pr-12">
          <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
            <DialogTrigger asChild>
              <Button size={"sm"}>
                <GitBranch /> Match
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              <DialogHeader>
                <DialogTitle>Confirm Prospect Match?</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                You&apos;re about to mark this Renter as <span className="font-bold">Matched</span> with the selected
                property.
                <Separator className="my-4" />
                This prospect will be moved to the <span className="font-bold">Matches</span> section.
                <br />
                <br />
                Are you sure you want to continue?
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="bg-[#F9F9F9] border border-[#E5E8EB]"
                  onClick={() => setMatchOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleMatch}>
                  {isMatching ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
            <DialogTrigger asChild>
              <Button
                size={"sm"}
                className="bg-[#F9F9F9] hover:bg-[#F9F9F9] border-neutral-200 border-[1px]  text-black"
              >
                <CornerDownRight /> Move
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
              <DialogHeader>
                <DialogTitle>Move Prospect to Leads?</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                This prospect will be moved to the <span className="font-bold">Leads</span> section.
                <Separator className="my-4" />
                Are you sure you want to proceed?
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="bg-[#F9F9F9] border border-[#E5E8EB]"
                  onClick={() => setMoveOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleMove}>
                  {isMoving ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Select
            value={status}
            defaultValue={Prospect?.prospectStatus}
            onValueChange={(e) => handleUpdateStatus(e)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger size="sm" className="bg-[#F9F9F9]">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="follow up">Follow Up</SelectItem>
                <SelectItem value="pending">Scheduled</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <FormSheet
            buttonText="Edit Prospect Log"
            title="Edit Prospect Log"
            sections={sections}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={handleEditSuccess}
            icon
          >
            <EditProspectForm prospect={Prospect as ProspectType} onSuccess={handleEditSuccess} />
          </FormSheet>
          <Button variant={"ghost"} size={"icon"} className="bg-transparent" onClick={closeAll}>
            <Link href={`${pathname}/${Prospect?._id}`}>
              <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
            </Link>
          </Button>
          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Trash2 color="#E35B4F" />{" "}
          </Button> */}
        </div>
      </div>
      {Prospect?.prospectType == "Buyer" ? (
        <ScrollArea className="w-full h-[900px] px-8 pb-36">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full ">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Email", value: Prospect?.email },
                    { label: "Mobile", value: formatPhoneToInternational(Prospect?.phoneNumber || "") },
                    { label: "#Adults", value: Prospect?.adultCount },
                    { label: "#Children", value: Prospect?.childrenCount },
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
                    { label: "Financing Type", value: Prospect?.financingType || "-" },
                    {
                      label: "Max. Budget",
                      value:
                        Prospect?.maxPurchasePrice?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }) || "-",
                    },
                    { label: "Pre-approved?", value: Prospect?.preApproved ? "Yes" : "No" },
                    Prospect?.preApproved
                      ? {
                          label: "Pre-approved Amount",
                          value: Prospect?.preApprovedAmount?.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          }),
                        }
                      : {},
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
                        getCountiesForNeighborhoods(Prospect?.targetAreas || []).length > 0
                          ? getCountiesForNeighborhoods(Prospect?.targetAreas || [])
                          : "-",
                    },
                    {
                      label: "Neighborhoods",
                      value:
                        Prospect?.targetAreas?.length && Prospect.targetAreas.length > 0 ? Prospect?.targetAreas : "-",
                    },
                    { label: "Property Type", value: Prospect?.propertyType || "-" },

                    { label: "#Bedrooms", value: Prospect?.bedroomCount || "0+" },
                    { label: "#Bathrooms", value: Prospect?.bathroomCount || "0+" },
                    { label: "Pets", value: Prospect?.petOwned ? `Yes, ${Prospect?.petOwned}` : "No" },
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
                    {
                      label: "Laundry",
                      value: Prospect?.amenities?.includes("laundryInUnit") ? "Yes" : "No",
                    },
                    {
                      label: "Swimming Pool",
                      value: Prospect?.amenities?.includes("swimmingPool") ? "Yes" : "No",
                    },
                    {
                      label: "Parking",
                      value: Prospect?.amenities?.includes("parkingSpace") ? "Yes" : "No",
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

            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {salesNotes.map((item, index) => (
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
        </ScrollArea>
      ) : Prospect?.prospectType == "Renter" ? (
        <ScrollArea className="w-full h-[900px] px-8 pb-36">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full ">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Email", value: Prospect?.email },
                    { label: "Mobile", value: formatPhoneToInternational(Prospect?.phoneNumber || "") },
                    { label: "#Adults", value: Prospect?.adultCount },
                    { label: "#Children", value: Prospect?.childrenCount },
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
                      label: "Max. Budget",
                      value: Prospect?.maxRentalPrice?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }),
                    },
                    {
                      label: "HH Income/year",
                      value: Prospect?.annualHouseholdIncome?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }),
                    },
                    { label: "Credit Score", value: Prospect?.creditScore },
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
                    { label: "Owns a voucher?", value: Prospect?.voucher },
                    Prospect?.voucher == "Yes" && Prospect?.voucherAmount
                      ? {
                          label: "Voucher Amount",
                          value: Prospect?.voucherAmount?.toLocaleString("en-US", {
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
                    { label: "County", value: getCountiesForNeighborhoods(Prospect?.targetAreas || []) },
                    {
                      label: "Neighborhoods",
                      value: Prospect?.targetAreas || [],
                    },
                    { label: "Property Type", value: Prospect?.propertyType },
                    { label: "#Bedrooms", value: Prospect?.bedroomCount },
                    { label: "#Bathrooms", value: Prospect?.bathroomCount },
                    { label: "Pets", value: Prospect?.petOwned ? `Yes, ${Prospect?.petOwned}` : "No" },
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
                  {Prospect?.projectedMoveInDate ? (
                    <div className={`flex items-center gap-4 `}>
                      <p className="text-light-text-secondary text-sm w-32 shrink-0">{"Projected Move In Date"}</p>
                      <div className="text-[#07192C] font-normal flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {typeof Prospect?.projectedMoveInDate === "string" ? (
                          <p className="truncate">{format(new Date(Prospect?.projectedMoveInDate), "MMM d, yyyy")}</p>
                        ) : (
                          Prospect?.projectedMoveInDate
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                <p className="font-bold text-light-text mb-4">Amenities</p>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Laundry",
                      value: Prospect?.amenities?.includes(Amenities.LaundryInUnit) ? "Yes" : "No",
                    },
                    {
                      label: "Swimming Pool",
                      value: Prospect?.amenities?.includes(Amenities.SwimmingPool) ? "Yes" : "No",
                    },
                    {
                      label: "Parking",
                      value: Prospect?.amenities?.includes(Amenities.ParkingSpace) ? "Yes" : "No",
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

            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {salesNotes.map((item, index) => (
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
        </ScrollArea>
      ) : (
        <ScrollArea className="w-full h-[900px] px-8 pb-36">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
            <div className="w-full ">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4 ">
                <p className="font-bold text-light-text mb-4">Personal Information</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Email", value: Prospect?.email },
                    { label: "Mobile", value: formatPhoneToInternational(Prospect?.phoneNumber || "") },
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
                    { label: "Full Name", value: Prospect?.brokerName || "-" },
                    {
                      label: "Email",
                      value: Prospect?.brokerEmail || "-",
                    },
                    { label: "Mobile", value: formatPhoneToInternational(Prospect?.brokerPhoneNumber || "") },
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
                        getCountiesForNeighborhoods(Prospect?.targetAreas || []).length > 0
                          ? getCountiesForNeighborhoods(Prospect?.targetAreas || [])
                          : "-",
                    },
                    {
                      label: "Neighborhoods",
                      value:
                        Prospect?.targetAreas?.length && Prospect.targetAreas.length > 0 ? Prospect?.targetAreas : "-",
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
            </div>
            <div className="w-full">
              <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
                <p className="font-bold text-light-text mb-4">Notes</p>
                <div>
                  <ScrollArea className="h-[325px] w-full">
                    <div className="pb-6 mx-1">
                      {salesNotes.map((item, index) => (
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
        </ScrollArea>
      )}
      <Dialog open={matchCheckModal} onOpenChange={setMatchCheckModal}>
        <DialogClose />
        <DialogContent className="sm:max-w-[425px] gap-6">
          <DialogHeader className="gap-6">
            <DialogTitle className="text-xl font-semibold">Match Check</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              <p>Please provide the following missing information to match this prospect:</p>
              <ul className="list-disc pl-4 mt-2">
                {getMissingFields(Prospect as unknown as ProspectType).map((field, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                These details help us better match this prospect to a property.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full self-auto justify-between">
            <Button variant="outline" onClick={() => setMatchCheckModal(false)} className="rounded-[16px]">
              Cancel
            </Button>
            <Button onClick={() => openEdit(true)} className="bg-primary hover:bg-primary rounded-[8px] py-2">
              Edit Information
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={moveCheckModal} onOpenChange={setMoveCheckModal}>
        <DialogClose />
        <DialogContent className="sm:max-w-[425px] gap-6">
          <DialogHeader className="gap-6">
            <DialogTitle className="text-xl font-semibold">Missing Required Information</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              <p>Please provide the following missing information to move this prospect:</p>
              <ul className="list-disc pl-4 mt-2">
                {getMissingMoveFields(Prospect as unknown as ProspectType).map((field, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                These details help us better move this prospect to Leads Section.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full self-auto justify-between">
            <Button variant="outline" onClick={() => setMoveCheckModal(false)} className="rounded-[16px]">
              Cancel
            </Button>
            <Button
              onClick={() => (openEdit ? openEdit(true) : null)}
              className="bg-primary hover:bg-primary rounded-[8px] py-2"
            >
              Edit Information
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
