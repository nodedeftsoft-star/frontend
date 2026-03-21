import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";

const KanbanColumnSkeleton = ({ title, count }: { title: string; count: number }) => {
  return (
    <div className="flex flex-col w-[288px] min-w-[288px] gap-4 border bg-[#FBFBFB] rounded-[16px]">
      <div className="p-3">
        <h3 className="font-semibold flex items-center gap-2 !text-neutral-300">{title}</h3>
      </div>
      <div className="p-2 h-full overflow-y-scroll">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-[#E5E5E6] mb-2 relative">
            <div className="absolute -top-2 -left-2 h-[24px] w-[24px] bg-gray-200 rounded-full flex items-center justify-center">
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 flex-shrink-0" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MatchFinderSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-1 md:px-5 h-full overflow-y-scroll w-full">
      <div className="w-full overflow-scroll">
        <div className="flex flex-col gap-4 w-full h-[75vh] overflow-scroll">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex flex-col gap-2 mb-4">
              <Skeleton className="w-[300px] h-10" />
            </div>
            <Skeleton className="w-32 h-10" />
          </div>

          <div className="flex gap-4 w-full h-full overflow-x-scroll">
            <KanbanColumnSkeleton title="Potential Matches" count={3} />
            <KanbanColumnSkeleton title="Follow Up" count={2} />
            <KanbanColumnSkeleton title="Pending" count={1} />
            <KanbanColumnSkeleton title="Shown" count={2} />
            <KanbanColumnSkeleton title="Dead" count={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
