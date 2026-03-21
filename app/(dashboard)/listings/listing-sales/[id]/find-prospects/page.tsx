"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronDownIcon, ChevronUp, Loader2, Save, Search } from "lucide-react";
import Image from "next/image";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEffect, useMemo, useState } from "react";
import data from "@/data.json";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SliderWithTooltip } from "@/components/ui/slider-with-tooltip";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { columns } from "./columns";
import { cn } from "@/lib/utils";
import MainPageSkeleton from "@/components/main-page-skeleton";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams, useRouter } from "next/navigation";
import { getCountiesForNeighborhoods } from "@/lib/findCounties";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListingSales } from "@/types/listings";

const bedroombathroomOptions = [
  "0",
  "0+",
  "1",
  "1+",
  "2",
  "2+",
  "3",
  "3+",
  "4",
  "4+",
  "5",
  "5+",
  "6",
  "6+",
  "7",
  "7+",
  "8",
  "8+",
  "9",
  "9+",
  "10",
  "10+",
  "11",
  "11+",
];

type FetchMatchesParams = {
  targetAreas: string[];
  bathrooms: string | undefined;
  bedrooms: string | undefined;
  price?: string;
  homeType: string[];
  petOwned?: "both";
  amenities?: string[];
  contactType?: string;
  searchRange?: number;
};

async function fetchMatches(params: FetchMatchesParams) {
  const response = await fetch("/api/contacts/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();

  //console.log("PROSPECTS:", data.data?.prospects);

  // For listings API, return properties array
  return data.data?.prospects || [];
}

async function fetchListingSale(id: string) {
  const response = await fetch(`/api/listings/${id}`, {
    method: "GET",
  });
  const data = await response.json();
  //console.log("BUYER DATA:", data);
  return data.data.properties[0] as ListingSales;
}

export default function FindMatches() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  //console.log("FIND MATCHES ID:", params);

  const { data: buyerData } = useQuery({
    queryKey: ["buyerDetails", params],
    queryFn: () => fetchListingSale(params.id as string),
    enabled: !!params.id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!buyerData) {
      return;
    }

    setCounties(getCountiesForNeighborhoods([buyerData?.neighborhood]));
    setNeighborhoods(buyerData.neighborhood ? [buyerData.neighborhood] : []);
    setHomeTypes(buyerData.homeType ? [buyerData.homeType] : []);
    setPrice(String(buyerData.price) || "");
    setBedrooms(bedroombathroomOptions.findIndex((option) => option === String(buyerData.bedrooms)) || 0);
    setBathrooms(bedroombathroomOptions.findIndex((option) => option === String(buyerData.bathrooms)) || 0);
    setPetsAllowed(
      buyerData?.petFriendly?.allowsLargeDogs?.toLocaleLowerCase() == "no" ||
        buyerData?.petFriendly?.allowsCats?.toLocaleLowerCase() == "no"
        ? "yes"
        : "yes"
    );
    // setAmenities(() => {
    //   const amenities = [];
    //   if (buyerData?.amenities?.includes("laundryInUnit")) {
    //     amenities.push("laundry");
    //   }

    //   if (buyerData?.amenities?.includes("parkingSpace")) {
    //     amenities.push("parking");
    //   }

    //   if (buyerData?.amenities?.includes("swimmingPool")) {
    //     amenities.push("pool");
    //   }

    //   return amenities;
    // });
  }, [buyerData]);

  const [openAll, setOpenAll] = useState(false);
  const [openFilters, setOpenFilters] = useState({
    county: false,
    neighbourhoods: false,
    price: false,
    homeType: false,
    bedrooms: false,
    bathrooms: false,
    amenities: false,
    searchRange: false,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [counties, setCounties] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [homeTypes, setHomeTypes] = useState<string[]>([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [search, setSearch] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [bathrooms, setBathrooms] = useState<number>(0);
  const [petsAllowed, setPetsAllowed] = useState("no");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [searchRange, setSearchRange] = useState<number | undefined>(undefined);
  const [savingMatches, setSavingMatches] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [loadedMatches, setLoadedMatches] = useState(false);

  const handleSetOpenAll = (open: boolean) => {
    setOpenAll(open);
    setOpenFilters({
      county: open,
      neighbourhoods: open,
      price: open,
      homeType: open,
      bedrooms: open,
      bathrooms: open,
      amenities: open,
      searchRange: open,
    });
  };

  const debouncedPrice = useDebounce(price, 300);

  const {
    data: matches,
    isLoading: isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "matches",
      { neighborhoods, homeTypes, debouncedPrice, bedrooms, bathrooms, petsAllowed, amenities, searchRange },
    ],
    queryFn: () =>
      fetchMatches({
        targetAreas: neighborhoods,
        bedrooms: bedroombathroomOptions[bedrooms] == "0" ? undefined : bedroombathroomOptions[bedrooms],
        bathrooms: bedroombathroomOptions[bathrooms] == "0" ? undefined : bedroombathroomOptions[bathrooms],
        price: debouncedPrice,
        homeType: homeTypes,
        petOwned: petsAllowed === "yes" ? "both" : undefined,
        amenities,
        contactType: "Buyer",
        searchRange,
      }),
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const filteredNeighborhoodsByCounty = useMemo(() => {
    const selectedCounties = counties;
    if (!selectedCounties || selectedCounties.length === 0) {
      return [];
    }

    const countiesWithNeighborhoods = data.counties
      .filter((county) => selectedCounties.includes(county.name))
      .map((county) => {
        const filteredNeighborhoods = neighborhoodSearch
          ? county.neighborhoods.filter((neighborhood) =>
              neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())
            )
          : county.neighborhoods;

        return {
          countyName: county.name,
          neighborhoods: filteredNeighborhoods,
        };
      })
      .filter((county) => county.neighborhoods.length > 0);

    return countiesWithNeighborhoods;
  }, [neighborhoodSearch, counties]);

  const clearAllFilters = () => {
    setCounties([]);
    setNeighborhoods([]);
    setHomeTypes([]);
    setPrice("");
    setBedrooms(0);
    setBathrooms(0);
    setNeighborhoodSearch("");
    setPetsAllowed("no");
    setAmenities([]);
    setSearchRange(undefined);
  };

  const filtersCount = useMemo(() => {
    return (
      neighborhoods.length +
      homeTypes.length +
      (price ? 1 : 0) +
      (bedrooms > 0 ? 1 : 0) +
      (bathrooms > 0 ? 1 : 0) +
      (petsAllowed === "yes" ? 1 : 0) +
      amenities.length +
      (searchRange ? 1 : 0)
    );
  }, [neighborhoods, homeTypes, price, bedrooms, bathrooms, petsAllowed, amenities, searchRange]);

  const filteredData = useMemo(() => {
    if (!matches) return [];
    return matches;
  }, [matches]);

  const matchesTable = useReactTable({
    data: filteredData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  // Get selected rows directly without memoization to ensure reactivity
  const selectedRows = matchesTable?.getSelectedRowModel?.()?.rows || [];

  const handleSave = async () => {
    if (selectedRows.length <= 0) {
      return;
    }
    try {
      setSavingMatches(true);

      // Separate contacts and existing prospects
      const contactsToConvert = selectedRows.filter((row) => !row.original?.isProspect);
      const prospectsToUpdate = selectedRows.filter((row) => row.original?.isProspect);

      let contactsResponse = null;
      let prospectsResponse = null;

      // Handle contacts (convert to prospects)
      if (contactsToConvert.length > 0) {
        const prospects = contactsToConvert.map((row) => ({
          id: row.original?.id || "",
          firstName: row.original?.firstName || "Unknown",
          lastName: row.original?.lastName || "Contact",
          phoneNumber: row.original?.phoneNumber || "",
          email: row.original?.email || "",
          adultCount: row.original?.adultCount || 1,
          childrenCount: row.original?.childrenCount || 0,
          targetAreas: row.original?.targetAreas || [],
          propertyType: row.original?.propertyType || "House/Townhouse",
          bedroomCount: row.original?.bedroomCount || "1",
          bathroomCount: row.original?.bathroomCount || "1",
          havePet: row.original?.havePet || false,
          petOwned: row.original?.petOwned,
          amenities: row.original?.amenities || [],
          financingType: row.original?.financingType || undefined,
          preApproved: row.original?.preApproved || false,
          preApprovedAmount: row.original?.preApprovedAmount || 0,
          maxPurchasePrice: row.original?.maxPurchasePrice || 0,
          buyersNote: row.original?.buyersNote || {
            text: `Interested in listing ${params.id}`,
            timestamp: Date.now(),
          },
          listingUrl: "",
          property: params.id,
          prospectStatus: "follow up", // Changed from "prospect" to "follow up"
          activityNotes: row.original?.activityNotes || [],
        }));

        //console.log("Contacts to convert:", prospects);

        contactsResponse = await fetch("/api/prospects/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prospects: prospects,
            listing: params.id,
            prospectType: "Buyer",
          }),
        });

        if (!contactsResponse.ok) {
          const errorData = await contactsResponse.json();
          throw new Error(errorData.message || "Failed to convert contacts to prospects");
        }
      }

      // Handle existing prospects (bulk update)
      if (prospectsToUpdate.length > 0) {
        const prospectIds = prospectsToUpdate.map((row) => row.original?.id || row.original?._id);
        const updates = {
          property: params.id,
          prospectStatus: "follow up",
        };

        //console.log("Prospects to update:", { ids: prospectIds, updates });

        prospectsResponse = await fetch("/api/prospects/bulk-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: prospectIds,
            updates: updates,
          }),
        });

        if (!prospectsResponse.ok) {
          const errorData = await prospectsResponse.json();
          throw new Error(errorData.message || "Failed to update existing prospects");
        }
      }

      setSavingMatches(false);

      // Create success message based on what was processed
      let successMessage = "";
      if (contactsToConvert.length > 0 && prospectsToUpdate.length > 0) {
        successMessage = `Successfully converted ${contactsToConvert.length} contact(s) and updated ${prospectsToUpdate.length} prospect(s)!`;
      } else if (contactsToConvert.length > 0) {
        successMessage = `Successfully converted ${contactsToConvert.length} contact(s) to prospects!`;
      } else if (prospectsToUpdate.length > 0) {
        successMessage = `Successfully updated ${prospectsToUpdate.length} prospect(s)!`;
      }

      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });
      queryClient.invalidateQueries({ queryKey: ["renters"] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });

      toast.success(successMessage);

      router.push(`/listings/listing-sales/${params.id}?t=prospectfinder`);

      //console.log("Contacts Response:", contactsResponse ? await contactsResponse.json() : null);
      //console.log("Prospects Response:", prospectsResponse ? await prospectsResponse.json() : null);
    } catch (error) {
      if (error instanceof Error && error?.message == "You already have a prospect with that email") {
        toast.success("Successfully added prospects");
        router.push(`/listings/listing-sales/${params.id}?t=prospectfinder`);
      } else {
        toast("Error", {
          description: error instanceof Error ? error.message : "An unexpected error occurred while saving prospects",
          className: "border-l-4 border-l-[#FF0000] bg-white",
        });
      }

      setSavingMatches(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 flex-1 h-fit overflow-y-scroll pb-26 ">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        Find Prospects for <span className="text-primary underline">{buyerData?.address?.streetAddress}</span>
        <Badge className="bg-neutral-200 text-black"> Showing {matches?.length || 0} Results</Badge>
      </h1>

      <div className="flex gap-4 w-full h-full  ">
        <div className="flex flex-col  w-[20%] border-light-border border-1 h-full rounded-lg overflow-hidden bg-neutral-50 ">
          {/* All Filters */}
          <Collapsible
            open={openAll}
            onOpenChange={handleSetOpenAll}
            className="flex w-full flex-col gap-2  border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-1  bg-neutral-200">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Filters</h1>{" "}
                {filtersCount > 0 && <span className="text-xs text-neutral-500">({filtersCount})</span>}
                <Button
                  variant="ghost"
                  className="p-0 disabled:text-neutral-500 text-primary font-normal bg-transparent hover:bg-transparent"
                  disabled={filtersCount === 0}
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all text-neutral-500 ">
                  {openAll ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* <CollapsibleContent className="flex flex-col gap-2 p-4">
              <div className="rounded-md border px-4 py-2 font-mono text-sm">@radix-ui/colors</div>
              <div className="rounded-md border px-4 py-2 font-mono text-sm">@stitches/react</div>
            </CollapsibleContent> */}
          </Collapsible>

          {/* County */}
          <Collapsible
            open={openFilters.county}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                county: !openFilters.county,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>County</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all ">
                  {openFilters.county ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0 ">
              <div className="rounded-md border px-4 py-2  text-sm gap-y-2 flex flex-col bg-white">
                {data.counties.map((county) => (
                  <div key={county.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={counties.includes(county.name)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...counties, county.name]
                          : counties.filter((value: string) => value !== county.name);
                        setCounties(updatedValue);
                      }}
                      className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                    />
                    <Label className="text-[16px] font-[400]">{county.name}</Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Neighborhoods */}
          <Collapsible
            open={openFilters.neighbourhoods}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                neighbourhoods: !openFilters.neighbourhoods,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Neighborhoods</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all text-neutral-500 ">
                  {openFilters.neighbourhoods ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                    disabled={counties.length === 0}
                  >
                    {neighborhoods.length > 0 ? `${neighborhoods.length}  Selected` : "Select neighborhoods"}
                    <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[400px] p-4 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4 border border-gray-200 rounded-sm px-2 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search neighborhoods..."
                      value={neighborhoodSearch}
                      onChange={(e) => setNeighborhoodSearch(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                  </div>
                  {filteredNeighborhoodsByCounty.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      {counties.length === 0 ? "Please select at least one county first" : "No neighborhoods found"}
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredNeighborhoodsByCounty.map((county, countyIndex) => (
                        <div key={countyIndex} className="mb-4">
                          <div className="font-semibold text-[#07192C] text-sm mb-2 px-1 border-b border-gray-200 pb-1">
                            {county.countyName}
                          </div>
                          <div className="grid grid-cols-1 gap-2 ml-2">
                            {county.neighborhoods.map((neighborhood, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Checkbox
                                  checked={neighborhoods.includes(neighborhood)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...neighborhoods, neighborhood]
                                      : neighborhoods.filter((value: string) => value !== neighborhood);
                                    setNeighborhoods(updatedValue);
                                  }}
                                  className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                                />
                                <Label className="text-[16px] font-[400]">{neighborhood}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CollapsibleContent>
          </Collapsible>

          {/* Price */}
          <Collapsible
            open={openFilters.price}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                price: !openFilters.price,
              })
            }
            className="flex w-full flex-col  border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2  bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Max. Purchase Price</h1>
              </div>
              <CollapsibleTrigger asChild className="bg-transparent">
                <Button variant="ghost" size="icon" className="size-8 transition-all text-neutral-500  ">
                  {openFilters.price ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0">
              {/* <Input
                type="number"
                placeholder="Enter a number (eg: 2)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="!bg-white"
              /> */}
              <Input
                type="text"
                placeholder="in USD. Example: $2,500,000"
                value={
                  price
                    ? Number(price).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : ""
                }
                onChange={(e) => {
                  // Remove non-numeric characters and convert to number
                  const value = e.target.value.replace(/[^0-9.]/g, "");

                  setPrice(value);
                }}
                className="pr-12 bg-white"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Home Type */}
          <Collapsible
            open={openFilters.homeType}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                homeType: !openFilters.homeType,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Home Type</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all ">
                  {openFilters.homeType ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0 ">
              <div className="rounded-md border px-4 py-2  text-sm gap-y-2 flex flex-col bg-white">
                {["House/Townhouse", "Lot/Land", "Multi-Family", "Condo/Co-op", "Commercial"].map((homeType, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      checked={homeTypes.includes(homeType)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...homeTypes, homeType]
                          : homeTypes.filter((value: string) => value !== homeType);
                        setHomeTypes(updatedValue);
                      }}
                      className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                    />
                    <Label className="text-[16px] font-[400]">{homeType}</Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bedrooms */}
          <Collapsible
            open={openFilters.bedrooms}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                bedrooms: !openFilters.bedrooms,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Bedrooms</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all ">
                  {openFilters.bedrooms ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0 px-4 bg-white">
              <div className="  text-sm gap-y-2 flex flex-col bg-white">
                <SliderWithTooltip
                  value={[bedrooms]}
                  onValueChange={(value) => setBedrooms(value[0])}
                  max={23}
                  step={1}
                  className={"mt-3"}
                  tooltipContent={(value) => bedroombathroomOptions[value]}
                />
                <div className="flex items-center gap-2 justify-between w-full text-xs text-gray-500 text-md">
                  <span>0</span>
                  <span>5+</span>
                  <span>11+</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bathrooms */}
          <Collapsible
            open={openFilters.bathrooms}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                bathrooms: !openFilters.bathrooms,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Bathrooms</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all ">
                  {openFilters.bathrooms ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0 px-4 bg-white">
              <div className="  text-sm gap-y-2 flex flex-col bg-white">
                <SliderWithTooltip
                  value={[bathrooms]}
                  onValueChange={(value) => setBathrooms(value[0])}
                  max={23}
                  step={1}
                  className={"mt-3"}
                  tooltipContent={(value) => bedroombathroomOptions[value]}
                />
                <div className="flex items-center gap-2 justify-between w-full text-xs text-gray-500 text-md">
                  <span>0</span>
                  <span>5+</span>
                  <span>11+</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="text-sm gap-2 flex flex-col p-4 bg-white">
            <Label className="font-semibold">Pets</Label>
            <RadioGroup value={petsAllowed} onValueChange={(value) => setPetsAllowed(value)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="yes"
                  id="pets-yes"
                  className="text-[#13AF59] checked:bg-primary checked:border-primary h-[20px] w-[20px]"
                />
                <Label htmlFor="pets-yes" className="text-[16px] font-[400]">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="no"
                  id="pets-no"
                  className="text-[#13AF59] checked:bg-primary checked:border-primary h-[20px] w-[20px]"
                />
                <Label htmlFor="pets-no" className="text-[16px] font-[400]">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amenities */}
          <Collapsible
            open={openFilters.amenities}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                amenities: !openFilters.amenities,
              })
            }
            className="flex w-full flex-col   border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Amenities</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all ">
                  {openFilters.amenities ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex flex-col gap-2 p-2 pt-0 ">
              <div className="rounded-md border px-4 py-2  text-sm gap-y-2 flex flex-col bg-white">
                {[
                  { value: "laundry", label: "Laundry" },
                  { value: "parking", label: "Parking" },
                  { value: "pool", label: "Swimming Pool" },
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      checked={amenities.includes(amenity.value)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...amenities, amenity.value]
                          : amenities.filter((value: string) => value !== amenity.value);
                        setAmenities(updatedValue);
                      }}
                      className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                    />
                    <Label className="text-[16px] font-[400]">{amenity.label}</Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Search Range */}
          <Collapsible
            open={openFilters.searchRange}
            onOpenChange={() =>
              setOpenFilters({
                ...openFilters,
                searchRange: !openFilters.searchRange,
              })
            }
            className="flex w-full flex-col border-b-[1px]"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-2 h-fit bg-transparent">
              <div className="text-sm font-semibold flex gap-2 items-center">
                <h1>Search Range</h1>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 transition-all">
                  {openFilters.searchRange ? (
                    <ChevronUp className="transition-all duration-100" />
                  ) : (
                    <ChevronDown className="transition-all duration-100" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="px-4 pb-4">
                <Select value={searchRange?.toString()} onValueChange={(value) => setSearchRange(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue className=" placeholder:text-xs" placeholder="Select Last Activity Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="2">2 months</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="4">4 months</SelectItem>
                    <SelectItem value="5">5 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="flex flex-col gap-4 w-[80%]">
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex gap-2 items-center border-light-border border-1 rounded-lg px-4 h-10">
              <Search size={16} />
              <Input
                placeholder="Search"
                className="w-[300px] border-none m-0 p-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Dialog open={openSaveModal} onOpenChange={setOpenSaveModal}>
              <DialogTrigger asChild>
                <Button
                  disabled={selectedRows?.length <= 0 || savingMatches}
                  className="bg-primary text-white disabled:opacity-100 disabled:bg-white disabled:text-black disabled:border-light-border disabled:border-[1px] hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  size="sm"
                  onClick={() => setOpenSaveModal(true)}
                >
                  <Save size={16} />
                  {selectedRows.length <= 0
                    ? "Select Prospects"
                    : `${savingMatches ? "Saving" : "Save"} ${selectedRows.length} Prospect${
                        selectedRows.length > 1 ? "s" : ""
                      }`}
                  {savingMatches && <Loader2 className="ml-2 animate-spin">...</Loader2>}
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false} className="sm:w-[1264px] rounded-t-lg rounded-b-lg ">
                <DialogHeader>
                  <DialogTitle>Save Prospects</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  You are about to save{" "}
                  <span className="font-bold">
                    {selectedRows.length} potential prospect{selectedRows.length > 1 ? "s" : ""}
                  </span>{" "}
                  for this listing. These contacts will appear in the Prospect Log with a Follow Up Status. <br />
                  <br />
                  Please confirm to continue.
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    className="bg-[#F9F9F9] border border-[#E5E8EB]"
                    onClick={() => setOpenSaveModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={savingMatches}>
                    {savingMatches ? <Loader2 className="m-4 w-4 animate-spin" /> : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {matches?.length <= 0 ? (
            <div className="flex flex-col gap-4 w-full border-light-border border-1 h-full rounded-lg p-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 p-15 justify-center items-center">
                  <h1 className="text-2xl text-primary font-bold">
                    {filtersCount > 0 ? "No Matches Found!" : "Select Filters First!"}
                  </h1>
                  <p className="text-lg ">Start filtering to explore relevant properties for your buyer.</p>
                  <p className="text-md text-light-text-secondary">
                    Once you&apos;ve found listings, use the checkboxes to save matches.
                  </p>
                  <div className="flex gap-2 border-light-border border-1 rounded-lg bg-light-focused w-full h-[408px] p-20 justify-center items-center bg-neutral-50">
                    <Image
                      src="/find-matches-ill.svg"
                      alt="No Matches"
                      height={244}
                      width={244}
                      className="h-full w-auto object-contain object-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-scroll max-w-[60vw]">
              {isLoading || isFetching ? (
                <div className="p-4">
                  <MainPageSkeleton />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    {matchesTable?.getHeaderGroups().map((headerGroup) => (
                      <TableRow className="rounded-t-2xl bg-[#F9F9F9]" key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const meta = header.column.columnDef.meta as { headerClassName?: string } | undefined;
                          return (
                            <TableHead key={header.id} className={cn(meta?.headerClassName)}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {matchesTable?.getRowModel().rows?.length ? (
                      matchesTable?.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => {
                            const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                            return (
                              <TableCell key={cell.id} className={cn(meta?.cellClassName)}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
