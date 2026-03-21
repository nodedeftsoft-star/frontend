import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function UserDetailsSkeleton() {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex justify-between px-8 mb-4">
        <div className="flex items-center gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <div className="flex gap-2 pr-12">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-[900px] px-8 overflow-x-scroll">
        <Tabs
          defaultValue="buyerinfo"
          className="border border-[#E5E8EB] p-6 rounded-lg shadow min-h-[900px] overflow-x-scroll"
        >
          <TabsList className="w-full bg-transparent h-14 mb-4">
            <TabsTrigger
              value="buyerinfo"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Info
            </TabsTrigger>
            <TabsTrigger
              value="matchfinder"
              className="w-full bg-neutral-100 data-[state=active]:bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:border-b data-[state=active]:border-b-blue-500 rounded-none"
            >
              Finder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyerinfo" className="h-full max-h-[800px] w-full overflow-y-auto pb-36">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-between">
              {/* Column 1 - Personal Information & Financials */}
              <div className="w-full">
                {/* Personal Information Card */}
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <Skeleton className="h-5 w-40 mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4].map((idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financials Card */}
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <Skeleton className="h-5 w-24 mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2 - Preferences & Amenities */}
              <div className="w-full">
                {/* Preferences Card */}
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <Skeleton className="h-5 w-32 mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        {idx === 2 ? (
                          <div className="flex flex-wrap gap-2 flex-1">
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-28 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                          </div>
                        ) : (
                          <Skeleton className="h-4 flex-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities Card */}
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6 mb-4">
                  <Skeleton className="h-5 w-24 mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3 - Notes */}
              <div className="w-full">
                <div className="border border-[#E5E8EB] w-full flex flex-col rounded-lg p-6">
                  <Skeleton className="h-5 w-16 mb-4" />
                  <div>
                    {/* Notes Timeline */}
                    <div className="h-[325px] w-full">
                      <div className="pb-6 mx-1">
                        {[1, 2, 3].map((index) => (
                          <div key={index} className="relative pl-5 pb-9">
                            <Skeleton className="absolute left-0.5 top-0 bottom-0 w-px h-full" />
                            <Skeleton className="absolute -left-1 bottom-[50px] w-3 h-3 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Textarea Skeleton */}
                    <div className="mt-6">
                      <Skeleton className="h-[91px] w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="matchfinder" className="h-full max-h-[800px] overflow-hidden">
            <div className="h-full w-full overflow-x-auto">
              {/* Match Finder Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                    <Skeleton key={idx} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
