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

import { useLayoutEffect, useRef, useState } from "react";
import { formatPhoneToInternational } from "@/lib/formatNumber";
// import { getCountiesForNeighborhoods } from "@/lib/findCounties";
// import { Amenities } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Richtext";
// import { useRouter } from "next/navigation";
import { ListingSales } from "@/types/listings";
import { useParams, useSearchParams } from "next/navigation";
import UserDetailsSkeleton from "@/components/user-details-skeleton";
import FormSheet from "@/components/ui/form-sheet";
import EditListingSalesForm from "../edit-listing-sales-form";
import { sections } from "../data-table";
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
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProspectFinder from "@/components/prospect-finder";
import { formatTimestamp } from "@/lib/Timestamps";
import { CompensationDialog } from "@/components/compensation-dialog";

async function fetchListingSale(id: string) {
  const response = await fetch(`/api/listings/${id}`, {
    method: "GET",
  });
  const data = await response.json();
  //console.log("LISTING:", data.data.properties[0]);
  return data.data.properties[0] as ListingSales;
}

export default function ViewListingSales() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabType = searchParams.get("t") || "listing";
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [activityNote, setActivityNote] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editLeadBuyerOpen, setEditLeadBuyerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalStage, setModalStage] = useState(true);
  const [modal, setModal] = useState(false);
  const [addCompensation, setAddCompensation] = useState(false);

  const {
    data: ListingsSale,
    // isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["listing-sale", id],
    queryFn: () => fetchListingSale(id as string),
    enabled: !!id,
    // Use cached data immediately for instant display
    initialData: () => {
      return queryClient.getQueryData(["listing-sale", id]);
    },
    // Allow caching for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [activityNote]);

  const handleLeadEditBuyerSuccess = () => {
    setEditLeadBuyerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["listing-sale", id] });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/listings/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyIds: [ListingsSale?._id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      toast.success("Listing deleted successfully");

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["listingsSales"] });

      // Navigate to listings page
      router.push("/listings/listing-sales");
    } catch (error) {
      toast("Error", {
        description: "Failed to delete listing. Please try again.",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  async function submitActivity() {
    try {
      setIsSubmittingActivity(true);

      const response = await fetch(`/api/listings/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: ListingsSale?._id,
          note: activityNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add  notes");
      }

      // const responseData = await response.json();

      queryClient.invalidateQueries({ queryKey: ["listing-sale", id] });
      queryClient.invalidateQueries({ queryKey: ["listingsSales"] });

      setIsSubmittingActivity(false);

      toast.success("Note created successfully");

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

      if (status === "closed") {
        setModal(true);
        return;
      }

      await updateStatus(status);
    } catch (error) {
      console.error("Error updating landlord:", error);
      toast("Error", {
        description: "Failed to update listing status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateStatus = async (status: string) => {
    const response = await fetch("/api/listings/change-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: ListingsSale?._id,
        propertyStatus: status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      //console.log("ERROR DATA:", errorData);
      throw new Error(errorData.message || "Failed to update Listing Status");
    }

    queryClient.invalidateQueries({ queryKey: ["listing-sale", id] });
    queryClient.invalidateQueries({ queryKey: ["listingsSales"] });
    toast.success("Listing Status Updated successfully");
  };

  const handleAddCompensation = async (value: number) => {
    try {
      setAddCompensation(true);

      const response = await fetch("/api/listings/add-compensation", {
        method: "PUT",
        body: JSON.stringify({
          propertyId: ListingsSale?.id,
          compensation: Number(value),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to save compensation");
      }

      toast.success("Compensation Saved");
      setModal(false);

      await updateStatus("closed");
    } catch (error) {
      console.error("Error saving compensation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setAddCompensation(false);
    }
  };

  if (isFetching) {
    return <UserDetailsSkeleton />;
  }

  return (
    <>
      {/* Confirmation Dialog */}
      <Dialog open={modal && modalStage} onOpenChange={(open) => !open && setModal(false)}>
        <DialogContent className="sm:max-w-[412px] w-full">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-semibold">Edit Stage?</DialogTitle>
            <DialogDescription className="text-[16px] font-[400]">
              This listing status will be changed to Closed Sales Listing Please confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex flex-row justify-between  p-0">
            <Button variant="outline" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant={"default"} onClick={() => setModalStage(false)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compensation Dialog */}
      <CompensationDialog
        open={modal && !modalStage}
        onOpenChange={(open) => {
          if (!open) {
            setModalStage(true);
            setModal(false);
          }
        }}
        onSubmit={handleAddCompensation}
        isLoading={addCompensation}
      />
      <div className="flex justify-between w-full px-2 mb-8">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-light-text text-2xl font-bold">{ListingsSale?.address?.streetAddress}</h1>
          <div className="flex items-center gap-4">
            {ListingsSale?.address?.streetAddress && ListingsSale?.address?.city && (
              <span className="rounded-[8px] text-[#07192C] font-normal">
                {`${ListingsSale.address.streetAddress}, ${ListingsSale.address.city}, ${
                  ListingsSale.address.state?.toLocaleUpperCase() || ""
                } ${ListingsSale.address.zipcode || ""}`}
              </span>
            )}
            <span className="px-2 rounded-[8px] text-[#07192C] font-normal  bg-neutral-200">Listing Details</span>
          </div>
        </div>
        <div className="flex gap-2 pr-12">
          <Select
            defaultValue={ListingsSale?.propertyStatus}
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
                <SelectItem value="inContract">In Contract</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Edit Listing Form Sheet */}
          <FormSheet
            open={editLeadBuyerOpen}
            onOpenChange={setEditLeadBuyerOpen}
            title="Edit Listing"
            buttonText="Edit"
            sections={sections}
            onSuccess={handleLeadEditBuyerSuccess}
            icon
          >
            <EditListingSalesForm listing={ListingsSale as ListingSales} onSuccess={handleLeadEditBuyerSuccess} />
          </FormSheet>
          {/* <Button variant={"ghost"} size={"icon"} className="bg-transparent">
            <Link href={"/listings/listing-sales/" + ListingsSale?._id}>
              <Image alt="expand-ico" width={24} height={24} src="/expand.svg" />
            </Link>
          </Button> */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={"ghost"} size={"icon"} className="bg-transparent">
                <Trash2 color="#c3011c" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Listing</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this listing? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="w-full max-w-full h-[900px] px-8 overflow-x-scroll">
        <Tabs
          defaultValue={tabType}
          className=" border border-[#E5E8EB] p-6 rounded-lg shadow min-h-[900px] overflow-x-scroll w-full max-w-[68vw]"
        >
          <TabsList className="w-full bg-transparent h-14 mb-4">
            <TabsTrigger
              value="listing"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Listing Information
            </TabsTrigger>
            <TabsTrigger
              value="prospectfinder"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Prospect Finder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listing" className="h-full max-h-[800px] w-full overflow-y-auto pb-36">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow ">
              <div className="w-full">
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <p className="font-bold text-light-text mb-4">Details</p>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Listing Type", value: "Sales", highlight: true },
                      { label: "Location", value: ListingsSale?.address?.parentRegionName },
                      { label: "Property Type", value: ListingsSale?.homeType },
                      {
                        label: "Price",
                        value: ListingsSale?.price?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        }),
                      },

                      {
                        label: "Allowed Pets",
                        value:
                          ListingsSale?.petFriendly?.allowsLargeDogs || ListingsSale?.petFriendly?.allowsCats == "yes"
                            ? "Yes"
                            : "No",
                      },
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
                      {
                        label: "Name",
                        value: ListingsSale?.owner?.firstName + " " + ListingsSale?.owner?.lastName,
                      },
                      { label: "Contact", value: formatPhoneToInternational(ListingsSale?.owner?.phoneNumber || "") },
                      { label: "Email", value: ListingsSale?.owner?.email },
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
                      {
                        label: "Name",
                        value: ListingsSale?.attribution?.agentName,
                      },
                      {
                        label: "Contact",
                        value: formatPhoneToInternational(ListingsSale?.attribution?.agentContactInfo || ""),
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
                  <p className="font-bold text-light-text mb-4">Brokerage</p>
                  <div className="flex flex-col gap-4">
                    {[
                      {
                        label: "Name",
                        value: ListingsSale?.attribution?.brokerName,
                      },
                      {
                        label: "Contact",
                        value: formatPhoneToInternational(ListingsSale?.attribution?.brokerContactInfo || ""),
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

              <div className="w-full h-full gap-y-4 flex flex-col">
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 min-h-[470px] h-fit">
                  <p className="font-bold text-light-text mb-4">Notes</p>
                  <div className="flex flex-col justify-between h-full">
                    <ScrollArea className="h-[325px] w-full ">
                      <div className="pb-6 mx-1">
                        {ListingsSale?.salesNote?.map((item, index) => (
                          <div key={index} className="relative pl-5 pb-9">
                            <div className="absolute left-0.5 top-0 bottom-0 w-px bg-[#5B7083]" />

                            <div className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full bg-[#5B7083]" />

                            <div className="">
                              <p
                                dangerouslySetInnerHTML={{ __html: item.text }}
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
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <p className="font-bold text-light-text mb-4">Access</p>
                  <div className="text-[#07192C] font-normal flex-1 ">{ListingsSale?.description}</div>
                </div>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="prospectfinder" className="h-full w-full max-h-[800px] overflow-hidden">
            <div className="h-full w-full overflow-x-auto">
              <ProspectFinder Data={(ListingsSale as ListingSales) || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
