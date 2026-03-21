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

import { MapPin, User, Bed, Bath, Clock, Search } from "lucide-react";
import { Separator } from "./ui/separator";
import { Buyer } from "@/types/buyers-agent";
import MatchFinderSkeleton from "./match-finder-skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "./ui/sheet";
import ViewMatch from "./view-match-property";
import { PropertyMatch, Match } from "@/types/shared";
import { differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { useBuyersBuyerStore } from "@/store/sheets";

// const PROPERTY_TYPES = [
// 	{
// 		id: 'House/Townhouse',
// 		label: 'House/Townhouse',
// 	},
// 	{
// 		id: 'Condo/Co-op',
// 		label: 'Condo/Co-op',
// 	},
// 	{
// 		id: 'Lot/Land',
// 		label: 'Lot/Land',
// 	},
// 	{
// 		id: 'Multi-Family',
// 		label: 'Multi-Family',
// 	},
// 	{
// 		id: 'Commercial',
// 		label: 'Commercial',
// 	},
// ] as const;

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);

  const days = differenceInDays(now, date);
  if (days > 0) return `${days}d`;

  const hours = differenceInHours(now, date);
  if (hours > 0) return `${hours}h`;

  const minutes = differenceInMinutes(now, date);
  return `${minutes}m`;
};

const formatPrice = (price: number) => {
  if (price >= 100000) {
    return `${(price / 1000000).toFixed(1)}M`;
  } else {
    return `${(price / 1000).toFixed(1)}K`;
  }
};

type MatchStatus = "potential" | "followUp" | "pending" | "shown" | "dead";

type KanbanMatch = PropertyMatch;

const KanbanBoard = ({
  matches,
  onMatchUpdate,
  params: _params,
  search,
  userId,
  userNotes,
}: {
  matches: KanbanMatch[];
  onMatchUpdate: (matchId: string, newStatus: string) => void;
  params: { id: string };
  search: string;
  userId: string;
  userNotes?: { _id: string; note: string; timestamp: number }[];
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tempItems, setTempItems] = useState<KanbanMatch[]>(matches);
  const [globalViewMatch, setGlobalViewMatch] = useState(false);
  const [globalSelectedMatch, setGlobalSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    setTempItems(matches);
  }, [matches]);

  const handleMatchUpdate = (matchId: string, newStatus: string) => {
    setTempItems((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? { ...match, matchKind: newStatus as "potential" | "followUp" | "pending" | "shown" | "dead" }
          : match
      )
    );
  };

  const openGlobalModal = (match: KanbanMatch) => {
    setGlobalSelectedMatch(match as unknown as Match);
    setGlobalViewMatch(true);
  };

  const closeGlobalModal = () => {
    setGlobalViewMatch(false);
    setGlobalSelectedMatch(null);
  };

  const items = tempItems;

  const displayItems = items?.filter(
    (match) =>
      match.property.address.streetAddress.toLowerCase().includes(search.toLowerCase()) ||
      match.property.address.city.toLowerCase().includes(search.toLowerCase()) ||
      match.property.address.state.toLowerCase().includes(search.toLowerCase()) ||
      match.property.address.zipcode.toLowerCase().includes(search.toLowerCase()) ||
      match.property.address.parentRegionName.toLowerCase().includes(search.toLowerCase())
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

    const activeMatch = items.find((m) => m.id === active.id);
    if (!activeMatch) return;

    // Get the target container ID
    let targetContainerId: string | undefined;

    if (over.data.current?.type === "container") {
      targetContainerId = over.id.toString();
    } else if (over.data.current?.type === "card") {
      targetContainerId = over.data.current.containerId;
    }

    if (!targetContainerId) return;

    // Update the match status
    const newStatus = targetContainerId as MatchStatus;
    if (activeMatch.matchKind !== newStatus) {
      // Remove from current position
      const updatedItems = items?.filter((match) => match.id !== activeMatch.id);
      // Add to the top of the new container
      setTempItems([{ ...activeMatch, matchKind: newStatus }, ...updatedItems]);
      onMatchUpdate(activeMatch.id, newStatus);
    } else {
      // Handle reordering within the same container
      if (over.id !== active.id) {
        const overMatch = items.find((m) => m.id === over.id);
        if (overMatch) {
          const newItems = [...items];
          const activeIndex = newItems.findIndex((m) => m.id === activeMatch.id);
          const overIndex = newItems.findIndex((m) => m.id === overMatch.id);

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

  const getMatchesByStatus = (status: MatchStatus) => {
    return displayItems?.filter((match) => match.matchKind === status);
  };

  const SortableMatchCard = ({
    match,
    userId: _userId,
    matchIndex,
    onOpenModal,
  }: {
    match: KanbanMatch;
    userId: string;
    matchIndex: number;
    onOpenModal: (match: KanbanMatch) => void;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: match.id,
      data: {
        type: "card",
        match,
        containerId: match.matchKind,
      },
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: "move",
    };

    const handleClick = () => {
      onOpenModal(match);
    };

    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className=" bg-white rounded-lg shadow-sm border border-[#E5E5E6] mb-2 relative cursor-pointer"
          onClick={handleClick}
        >
          <div className="absolute -top-2 -left-2 h-[24px] w-[24px] bg-[#13AF59] rounded-full flex items-center justify-center text-white text-[12px] font-medium">
            {matchIndex + 1}
          </div>
          <div className="flex flex-col  ">
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-600" />
                <p className="font-medium text-sm text-gray-900">{match?.property?.address?.streetAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="flex-shrink-0 text-gray-600" />
                <p className="text-sm text-gray-600">{match?.property?.attribution?.agentName || "Janifer Yegorkov"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-[#13AF59] font-semibold">${formatPrice(match?.property?.price)}</span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1">
                  <Bed size={16} className="text-gray-600" />
                  {match?.property?.bedrooms}
                </span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1">
                  <Bath size={16} className="text-gray-600" />
                  {match?.property?.bathrooms}
                </span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1">
                  <Clock size={16} className="text-gray-600" />
                  {formatTimeAgo(match?.property?.createdAt)}
                </span>
              </div>
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
          <DroppableContainer id="potential" title="Potential Matches" count={getMatchesByStatus("potential").length}>
            <SortableContext
              items={getMatchesByStatus("potential").map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {getMatchesByStatus("potential").map((match, index) => (
                <SortableMatchCard
                  key={match.id}
                  userId={userId}
                  match={match}
                  matchIndex={index}
                  onOpenModal={openGlobalModal}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="followUp" title="Follow Up" count={getMatchesByStatus("followUp").length}>
            <SortableContext
              items={getMatchesByStatus("followUp").map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {getMatchesByStatus("followUp").map((match, index) => (
                <SortableMatchCard
                  key={match.id}
                  userId={userId}
                  match={match}
                  matchIndex={index}
                  onOpenModal={openGlobalModal}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="pending" title="Scheduled Showing" count={getMatchesByStatus("pending").length}>
            <SortableContext
              items={getMatchesByStatus("pending").map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {getMatchesByStatus("pending").map((match, index) => (
                <SortableMatchCard
                  key={match.id}
                  userId={userId}
                  match={match}
                  matchIndex={index}
                  onOpenModal={openGlobalModal}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="shown" title="Shown" count={getMatchesByStatus("shown").length}>
            <SortableContext
              items={getMatchesByStatus("shown").map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {getMatchesByStatus("shown").map((match, index) => (
                <SortableMatchCard
                  key={match.id}
                  userId={userId}
                  match={match}
                  matchIndex={index}
                  onOpenModal={openGlobalModal}
                />
              ))}
            </SortableContext>
          </DroppableContainer>

          <DroppableContainer id="dead" title="Dead" count={getMatchesByStatus("dead").length}>
            <SortableContext items={getMatchesByStatus("dead").map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {getMatchesByStatus("dead").map((match, index) => (
                <SortableMatchCard
                  key={match.id}
                  userId={userId}
                  match={match}
                  matchIndex={index}
                  onOpenModal={openGlobalModal}
                />
              ))}
            </SortableContext>
          </DroppableContainer>
        </div>

        <DragOverlay>
          {activeId
            ? (() => {
                const match = items.find((m) => m.id === activeId);
                return match ? (
                  <SortableMatchCard userId={userId} match={match} matchIndex={0} onOpenModal={openGlobalModal} />
                ) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      <Sheet open={globalViewMatch} onOpenChange={setGlobalViewMatch}>
        <SheetContent className="sm:w-[1264px] rounded-t-lg rounded-b-lg w-full" onClick={(e) => e.stopPropagation()}>
          <ViewMatch
            match={globalSelectedMatch}
            userId={userId}
            onClose={closeGlobalModal}
            userType="Buyer"
            onMatchUpdate={handleMatchUpdate}
            userNotes={userNotes}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default function MatchFinder(Data: { Data: Buyer }) {
  const params = useParams();

  console.log("RENDERING MATCH FINDER:", Data);

  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const [kanbanMatches, setKanbanMatches] = useState<KanbanMatch[]>([]);

  const [matchesSearch, setMatchesSearch] = useState("");
  const pathname = usePathname();

  const { closeAll } = useBuyersBuyerStore();

  //console.log("DATA ID:", Data.Data.id);

  //console.log("DATA:", Data, Data.Data._id);

  const queryClient = useQueryClient();

  //console.log("PARAMS:", params);

  const updateMatch = async (propertyId: string, matchKind: string) => {
    // console.log("Updating match:", propertyId, matchKind, params.id);
    try {
      const response = await fetch("/api/buyers/update-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          matchKind,
          id: params.id || Data.Data._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update match");
      }

      const buyerId = params.id || Data.Data._id;
      queryClient.setQueryData(["buyer", buyerId], (oldData: Buyer | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          matches: oldData.matches?.map((match) =>
            match.property.id === propertyId ? { ...match, matchKind } : match
          ),
        };
      });
      toast.success("Match updated successfully");
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update match");
    }
  };

  const filteredKanbanMatches = kanbanMatches;

  const fetchBuyer = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setKanbanMatches(Data.Data.matches || []);
      //console.log("MATCHES", Data.Data.matches);
    } catch (error) {
      console.error("Error fetching buyer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyer();

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
                placeholder="Search for a property"
                value={matchesSearch}
                onChange={(e) => setMatchesSearch(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                closeAll();
                if (pathname.includes(Data.Data._id || "")) {
                  router.push(`${pathname}/find-matches`);
                } else {
                  router.push(`${pathname}/${Data.Data._id || ""}/find-matches`);
                }
              }}
            >
              <Search size={16} />
              Find Matches
            </Button>
          </div>
          <KanbanBoard
            search={matchesSearch}
            matches={filteredKanbanMatches}
            onMatchUpdate={async (matchId, newStatus) => {
              const match = kanbanMatches.find((m) => m.id === matchId);
              if (match) {
                await updateMatch(match.property.id, newStatus);
              }
            }}
            userId={Data.Data.id}
            params={{ id: params.id as string }}
            userNotes={Data.Data.activityNotes}
          />
        </div>
      </div>
    </div>
  );
}
