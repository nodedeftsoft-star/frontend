import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpandedViewSkeleton() {
  return (
    <>
      {/* Header section */}
      <div className="flex justify-between px-8">
        <div className="flex flex-col items-start gap-2">
          {/* Title skeleton */}
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-4">
            {/* Address/name info skeleton */}
            <Skeleton className="h-6 w-96" />
            {/* Badge skeleton */}
            <Skeleton className="h-6 w-24 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2 pr-12">
          {/* Action buttons skeleton */}
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Main content area */}
      <ScrollArea className="w-full h-[900px] px-8 pb-36">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between my-8 border border-[#E5E8EB] p-6 rounded-lg shadow">
          {/* Left column */}
          <div className="w-full">
            {/* First card skeleton */}
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Second card skeleton */}
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <Skeleton className="h-6 w-28 mb-4" />
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Third card skeleton */}
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
              <Skeleton className="h-6 w-20 mb-4" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Right column - Notes section */}
          <div className="w-full h-full">
            <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 h-full">
              <Skeleton className="h-6 w-16 mb-4" />
              <div>
                <ScrollArea className="h-[325px] w-full">
                  <div className="pb-6 mx-1">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="relative pl-5 pb-9">
                        {/* Timeline line */}
                        <div className="absolute left-0.5 top-0 bottom-0 w-px bg-gray-200" />
                        {/* Timeline dot */}
                        <div className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full bg-gray-200" />
                        {/* Note content */}
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Note input area */}
                <div className="mt-6 px-4 bg-white flex gap-2 border border-neutral-200 rounded-md">
                  <Skeleton className="h-[91px] flex-1" />
                  <Skeleton className="h-6 w-6 mt-8" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollArea>
    </>
  );
}