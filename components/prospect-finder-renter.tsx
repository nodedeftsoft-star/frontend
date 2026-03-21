"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";
// import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";

import { Input } from "@/components/ui/input";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { User, Mail, Phone, Search } from "lucide-react";

import MatchFinderSkeleton from "./match-finder-skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "./ui/sheet";
import { ListingRentals, Prospect } from "@/types/listings";
import { formatPhoneToInternational } from "@/lib/formatNumber";

type ProspectStatus = "follow up" | "pending" | "converted" | "dead";

type KanbanProspect = Prospect;

const KanbanBoard = ({
  prospects,
  onProspectUpdate,
  params: _params,
  search,
  listingId,
}: {
  prospects: KanbanProspect[];
  onProspectUpdate: (prospectId: string, newStatus: string) => void;
  params: { id: string };
  search: string;
  listingId: string;
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tempItems, setTempItems] = useState<KanbanProspect[]>(prospects);
  const [globalViewProspect, setGlobalViewProspect] = useState(false);
  // const [globalSelectedProspect, setGlobalSelectedProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    setTempItems(prospects);
  }, [prospects]);

  // const openGlobalModal = (prospect: KanbanProspect) => {
  //   setGlobalSelectedProspect(prospect);
  //   setGlobalViewProspect(true);
  // };

  const items = tempItems;

  const displayItems = items?.filter(
    (prospect) =>
      prospect.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.phoneNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeProspect = items.find((p) => p.id === active.id);
    if (!activeProspect) return;

    // Get the target container ID
    let targetContainerId: string | undefined;

    if (over.data.current?.type === "container") {
      targetContainerId = over.id.toString();
    } else if (over.data.current?.type === "card") {
      targetContainerId = over.data.current.containerId;
    }

    if (!targetContainerId) return;

    // Update the prospect status
    const newStatus = targetContainerId as ProspectStatus;
    if (activeProspect.prospectStatus !== newStatus) {
      // Remove from current position
      const updatedItems = items?.filter((prospect) => prospect.id !== activeProspect.id);
      // Add to the top of the new container
      setTempItems([{ ...activeProspect, prospectStatus: newStatus }, ...updatedItems]);
      onProspectUpdate(activeProspect.id, newStatus);
    } else {
      // Handle reordering within the same container
      if (over.id !== active.id) {
        const overProspect = items.find((p) => p.id === over.id);
        if (overProspect) {
          const newItems = [...items];
          const activeIndex = newItems.findIndex((p) => p.id === activeProspect.id);
          const overIndex = newItems.findIndex((p) => p.id === overProspect.id);

          // Remove the active item
          const [draggedItem] = newItems.splice(activeIndex, 1);

          // Insert at the over index (this will place it after the target card)
          newItems.splice(overIndex, 0, draggedItem);

          setTempItems(newItems);
        }
      }
    }

    setActiveId(null);
  };

  const getProspectsByStatus = (status: ProspectStatus) => {
    return displayItems?.filter((prospect) => prospect.prospectStatus === status) || [];
  };

  const SortableProspectCard = ({
    prospect,
    listingId: _listingId,
    prospectIndex,
  }: {
    prospect: KanbanProspect;
    listingId: string;
    prospectIndex: number;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: prospect.id,
      data: {
        type: "card",
        prospect,
        containerId: prospect.prospectStatus,
      },
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: "move",
    };

    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className=" bg-white rounded-lg shadow-sm border border-[#E5E5E6] mb-2 relative cursor-pointer"
        >
          <div className="absolute -top-2 -left-2 h-[24px] w-[24px] bg-[#13AF59] rounded-full flex items-center justify-center text-white text-[12px] font-medium">
            {prospectIndex + 1}
          </div>
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2 px-4">
              <User size={16} className="flex-shrink-0 text-gray-600" />
              <p className="font-medium text-sm text-gray-900">
                {prospect?.firstName} {prospect?.lastName}
              </p>
            </div>
            <div className="bg-neutral-200 h-[1px] w-full" />
            <div className="flex items-center gap-2 px-4">
              <Mail size={16} className="flex-shrink-0 text-gray-600" />
              <p className="text-sm text-gray-600 truncate">{prospect?.email || "No email"}</p>
            </div>
            <div className="flex items-center gap-2 px-4 ">
              <Phone size={16} className="flex-shrink-0 text-gray-600" />
              <p className="text-sm text-gray-600">
                {prospect?.phoneNumber ? formatPhoneToInternational(prospect.phoneNumber) : "No phone"}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const DroppableContainer = ({
    id,
    title,
    children,
    count,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
    count: number;
  }) => {
    const { setNodeRef } = useDroppable({
      id,
      data: {
        type: "container",
        accepts: ["card"],
      },
    });

    return (
      <div className="flex flex-col w-[288px] min-w-[288px] gap-4 border bg-[#FBFBFB] rounded-[16px] h-full">
        <div className="p-3">
          <h3 className="font-semibold  flex items-center gap-2">
            {title} <span className="text-gray-500 font-normal">{count.toString().padStart(2, "0")}</span>
          </h3>
        </div>
        <div ref={setNodeRef} className="p-2 h-full overflow-y-scroll">
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 w-full h-full overflow-x-scroll">
          <DroppableContainer id="follow up" title="Follow Up" count={getProspectsByStatus("follow up").length}>
            <SortableContext
              items={getProspectsByStatus("follow up").map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {getProspectsByStatus("follow up").map((prospect, index) => (
                <SortableProspectCard
                  key={prospect.id}
                  listingId={listingId}
                  prospect={prospect}
                  prospectIndex={index}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="pending" title="Pending" count={getProspectsByStatus("pending").length}>
            <SortableContext
              items={getProspectsByStatus("pending").map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {getProspectsByStatus("pending").map((prospect, index) => (
                <SortableProspectCard
                  key={prospect.id}
                  listingId={listingId}
                  prospect={prospect}
                  prospectIndex={index}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="converted" title="Converted" count={getProspectsByStatus("converted").length}>
            <SortableContext
              items={getProspectsByStatus("converted").map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {getProspectsByStatus("converted").map((prospect, index) => (
                <SortableProspectCard
                  key={prospect.id}
                  listingId={listingId}
                  prospect={prospect}
                  prospectIndex={index}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="dead" title="Dead" count={getProspectsByStatus("dead").length}>
            <SortableContext
              items={getProspectsByStatus("dead").map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {getProspectsByStatus("dead").map((prospect, index) => (
                <SortableProspectCard
                  key={prospect.id}
                  listingId={listingId}
                  prospect={prospect}
                  prospectIndex={index}
                />
              ))}
            </SortableContext>
          </DroppableContainer>
        </div>

        <DragOverlay>
          {activeId
            ? (() => {
                const prospect = items.find((p) => p.id === activeId);
                return prospect ? (
                  <SortableProspectCard listingId={listingId} prospect={prospect} prospectIndex={0} />
                ) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      <Sheet open={globalViewProspect} onOpenChange={setGlobalViewProspect}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full" onClick={(e) => e.stopPropagation()}>
          {/* TODO: Create ViewProspect component */}
          <div className="p-4">
            <h2 className="text-xl font-semibold">Prospect Details</h2>
            <p>{/* {globalSelectedProspect?.firstName} {globalSelectedProspect?.lastName} */}</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default function ProspectFinderRenter(Data: { Data: ListingRentals }) {
  const params = useParams();

  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const [kanbanProspects, setKanbanProspects] = useState<KanbanProspect[]>([]);

  const [matchesSearch, setMatchesSearch] = useState("");
  const pathname = usePathname();

  //console.log("DATA ID:", Data.Data.id);

  //console.log("DATA:", Data, Data.Data._id);

  const queryClient = useQueryClient();

  //console.log("PARAMS:", params);

  const updateProspect = async (prospectId: string, prospectStatus: string) => {
    try {
      const response = await fetch("/api/prospects/change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: prospectId,
          status: prospectStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update prospect");
      }

      queryClient.invalidateQueries({
        queryKey: ["listingProspects"],
      });
      toast.success("Prospect updated successfully");
    } catch (error) {
      console.error("Error updating prospect:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update prospect");
    }
  };

  const filteredKanbanProspects = kanbanProspects;

  async function fetchProspects() {
    try {
      const response = await fetch("/api/prospects/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyId: Data.Data._id }),
      });
      const data = await response.json();

      //console.log("PROSPECTS:", data);

      setKanbanProspects(data.data.prospects || []);
      //console.log("PROSPECTS DATA", data.data.prospects);
    } catch (_error) {
      // console.error("Error fetching prospects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProspects();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Data, params.id]);

  if (isLoading) {
    return <MatchFinderSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 px-1 md:px-5 h-full overflow-y-scroll w-full">
      <div className="w-full overflow-scroll">
        <div className="flex flex-col gap-4 w-full h-[75vh] overflow-scroll">
          <div className="flex gap-2  justify-between items-center">
            <div className="flex flex-col gap-2 mb-4">
              <Input
                placeholder="Search for a prospect"
                value={matchesSearch}
                onChange={(e) => setMatchesSearch(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() =>
                pathname.includes(Data.Data._id || "")
                  ? router.push(`${pathname}/find-prospects`)
                  : router.push(`${pathname}/${Data.Data._id || ""}/find-prospects`)
              }
            >
              <Search size={16} />
              Find Prospects
            </Button>
          </div>
          <KanbanBoard
            search={matchesSearch}
            prospects={filteredKanbanProspects}
            onProspectUpdate={async (prospectId: string, newStatus: string) => {
              await updateProspect(prospectId, newStatus);
            }}
            listingId={Data.Data.id}
            params={{ id: params.id as string }}
          />
        </div>
      </div>
    </div>
  );
}
