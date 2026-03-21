"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDownIcon, LoaderCircle, UserPlus, Search, CalendarIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

// Temporary data
import data from "../../../../data.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useProspectSheetsStore } from "@/store/sheets";

const formSchema = z
  .object({
    prospectType: z.string().min(1, { message: "Prospect type is required" }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
    property: z.string().optional(),
    adultCount: z.string().optional(),
    childrenCount: z.string().optional(),
    counties: z.array(z.string()).optional(),
    targetAreas: z.array(z.string()).default([]).optional(),
    propertyType: z.string().optional(),
    bedroomCount: z.string().optional(),
    bathroomCount: z.string().optional(),
    havePet: z.boolean().default(false).optional(),
    petOwned: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    // Unified financing field (buyer uses "financingType" and renter had "financials")
    financingType: z.string().optional(),
    preApproved: z.boolean().default(false).optional(),
    preApprovedAmount: z.number().optional(),
    listingUrl: z.string().url().optional().or(z.literal("")),
    // Buyer-specific fields
    maxPurchasePrice: z.number().optional(),
    projectedMoveInDate: z.string().optional(),

    // Renter-specific fields
    maxRentalPrice: z.number().optional(),
    creditScore: z.string().optional(),
    annualHouseholdIncome: z.number().optional(),
    note: z.string().optional(),
    voucher: z.boolean().default(false).optional(),
    voucherAmount: z.number().optional(),
    brokerName: z.string().optional(),
    brokerPhoneNumber: z.string().optional(),
    brokerEmail: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasEmail = data.email && data.email.trim() !== "";
    const hasPhone = data.phoneNumber && data.phoneNumber.trim() !== "";

    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either email or phone number is required",
        path: ["email"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either email or phone number is required",
        path: ["phoneNumber"],
      });
    }

    // Validate email format only if email is provided
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email!)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid email address",
        path: ["email"],
      });
    }
  });

interface Property {
  homeType: string;
  propertyStatus: string;
  id: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    parentRegionName?: string;
  };
  mode?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface ListingSalesFormProps {
  onSuccess?: () => void;
}

async function fetchProperties(searchTerm = ""): Promise<Property[]> {
  const response = await fetch("/api/listings/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ search: searchTerm }),
  });
  const data = await response.json();

  return data.data?.properties || [];
}

interface FormField {
  onChange: (value: string) => void;
}

interface DropdownType {
  properties: Property[];
  field: FormField;
  propertySearch: string;
  setPropertySearch: (value: string) => void;
  isLoadingProperties: boolean;
  isFetching: boolean;
}

const PropertyDropdownContent = ({
  properties,
  field,
  propertySearch,
  setPropertySearch,
  isLoadingProperties,
  isFetching,
}: DropdownType) => {
  const context = useFormContext();
  return (
    <DropdownMenuContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 border border-gray-200 rounded-sm px-2 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search properties..."
          value={propertySearch}
          onChange={(e) => setPropertySearch(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
        />
      </div>
      {isLoadingProperties || isFetching ? (
        <div className="text-center text-gray-500 py-4">
          <LoaderCircle className="animate-spin mx-auto mb-2" size={20} />
          Loading properties...
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          <div
            className="p-3 text-gray-900 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            onClick={() => {
              field.onChange("");
              document.getElementById("property-trigger")?.click();
            }}
          >
            None
          </div>
          {properties.map((property) => (
            <div
              key={property.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                field.onChange(property.id);
                context.setValue("propertyType", property?.homeType);
                context.setValue("counties", [property?.address?.city]);
                context.setValue("targetAreas", [property?.address?.parentRegionName]);
                context.setValue("bedroomCount", property?.bedrooms?.toString());
                context.setValue("bathroomCount", property?.bathrooms?.toString());
                document.getElementById("property-trigger")?.click();
              }}
            >
              <div className="font-medium text-gray-900">
                {`${property.address?.streetAddress}, ${property.address?.parentRegionName} `}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {property.address?.city}, {property.address?.state?.toLocaleUpperCase()},{" "}
                {property.address?.zipcode?.toLocaleUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {property.bedrooms || 0} beds, {property.bathrooms || 0} baths
              </div>
            </div>
          ))}
        </div>
      )}
    </DropdownMenuContent>
  );
};

export default function ListingSalesForm({ onSuccess }: ListingSalesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { openView } = useProspectSheetsStore();

  const queryClient = useQueryClient();

  // Debounce property search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(propertySearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [propertySearch]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prospectType: "buyer",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      property: "",
      adultCount: "",
      childrenCount: "",
      counties: [],
      targetAreas: [],
      propertyType: "",
      bedroomCount: "",
      bathroomCount: "",
      havePet: false,
      petOwned: "",
      amenities: [],
      financingType: "",
      preApproved: false,
      preApprovedAmount: 0,
      listingUrl: "",
      maxPurchasePrice: 0,
      maxRentalPrice: 0,
      creditScore: "",
      annualHouseholdIncome: 0,
      note: "",
      voucher: false,
      voucherAmount: 0,
      brokerName: "",
      brokerPhoneNumber: "",
      brokerEmail: "",
      projectedMoveInDate: "",
    },
  });

  const {
    data: allProperties = [],
    isLoading: isLoadingProperties,
    isFetching,
  } = useQuery<Property[]>({
    queryKey: ["prospectProperties", debouncedSearch],
    queryFn: () => fetchProperties(debouncedSearch),
    staleTime: 0,
    gcTime: 0,
  });

  const selectedCounty = form.watch("counties");

  const filteredNeighborhoodsByCounty = useMemo(() => {
    if (!selectedCounty) {
      return [];
    }

    const countyWithNeighborhoods = data.counties
      .filter((county) => selectedCounty.includes(county.name))
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

    return countyWithNeighborhoods;
  }, [neighborhoodSearch, selectedCounty]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      let encodedData;

      if (data.prospectType == "agent") {
        encodedData = {
          ...(data.note && {
            buyersNote: {
              text: data.note || "",
              timestamp: Date.now(),
            },
          }),
          prospectType: "Agent",
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || null,
          email: data.email || null,
          targetAreas: data.targetAreas,
          property: data.property || null,
          propertyType: data.propertyType,
          prospectStatus: "follow up",
          brokerName: data.brokerName,
          brokerPhoneNumber: data.brokerPhoneNumber,
          brokerEmail: data.brokerEmail,
        };
      }

      if (data.prospectType == "buyer") {
        encodedData = {
          ...(data.note && {
            buyersNote: {
              text: data.note || "",
              timestamp: Date.now(),
            },
          }),
          prospectType: "Buyer",
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || null,
          email: data.email || null,
          property: data.property || null,
          adultCount: data.adultCount,
          childrenCount: data.childrenCount,
          targetAreas: data.targetAreas || [],
          propertyType: data.propertyType,
          bedroomCount: data.bedroomCount,
          bathroomCount: data.bathroomCount,
          havePet: data.havePet,
          petOwned: data.petOwned != "no" ? data.petOwned : undefined,
          amenities: data.amenities || [],
          financingType: data.financingType,
          preApproved: data.preApproved,
          preApprovedAmount: data.preApprovedAmount || 0,
          maxPurchasePrice: data.maxPurchasePrice || 0,
          listingUrl: data.listingUrl || "",
          prospectStatus: "follow up",
        };
      }

      if (data.prospectType == "renter") {
        encodedData = {
          ...(data.note && {
            rentersNote: {
              text: data.note || "",
              timestamp: Date.now(),
            },
          }),
          prospectType: "Renter",
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || null,
          email: data.email || null,
          property: data.property || null,
          adultCount: data.adultCount,
          childrenCount: data.childrenCount,
          targetAreas: data.targetAreas || [],
          propertyType: data.propertyType,
          bedroomCount: data.bedroomCount,
          bathroomCount: data.bathroomCount,
          havePet: data.havePet,
          projectedMoveInDate: data.projectedMoveInDate,
          petOwned: data.petOwned != "no" ? data.petOwned : undefined,
          amenities: data.amenities || [],
          maxRentalPrice: data.maxRentalPrice || 0,
          creditScore: data.creditScore || "",
          annualHouseholdIncome: data.annualHouseholdIncome || 0,
          voucher: data.voucher ? "Yes" : "No",
          voucherAmount: data.voucher ? data.voucherAmount : 0,
          prospectStatus: "follow up",
        };
      }

      const response = await fetch("/api/prospects/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encodedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Listing Sale");
      }

      const responseData = await response.json();

      queryClient.setQueryData(["prospect", responseData.data.id], responseData.data);
      queryClient.invalidateQueries({ queryKey: ["listingsProspects"] });

      setIsLoading(false);

      toast.success("Prospect created successfully");

      if (onSuccess) {
        onSuccess();
        openView(responseData.data.id);
      }

      form.reset();
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating prospect:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Prospect with this email already exists"
            : "Failed to create prospect",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  return (
    <div className="space-y-6 w-full mx-auto p-6 py-0 relative">
      <Form {...form}>
        <form id="buyer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
          {/* Personal Information Section */}

          <Card id="personalInformation">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <FormField
                  control={form.control}
                  name="prospectType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Prospect Type</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="buyer" />
                            </FormControl>
                            <FormLabel className="font-normal">Buyer</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="renter" />
                            </FormControl>
                            <FormLabel className="font-normal">Renter</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="agent" />
                            </FormControl>
                            <FormLabel className="font-normal">Agent</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          // international
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          // initialValueFormat="national"
                          placeholder="(555) 555-5555"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter a valid email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="property"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              id="property-trigger"
                              variant="outline"
                              className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                            >
                              {field?.value
                                ? allProperties.find((p: Property) => p.id === field.value)?.address?.streetAddress ||
                                  "Selected Property"
                                : "Select property"}
                              <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          {form.watch("prospectType") && (
                            <PropertyDropdownContent
                              properties={(() => {
                                const type = form.watch("prospectType").toLowerCase();
                                if (type === "agent")
                                  return allProperties.filter(
                                    (p) => p.propertyStatus !== "closed" && p.propertyStatus !== "dead"
                                  );
                                if (type === "renter")
                                  return allProperties
                                    .filter((p) => p.mode === "for-rent")
                                    .filter((p) => p.propertyStatus !== "closed" && p.propertyStatus !== "dead");
                                if (type === "buyer")
                                  return allProperties
                                    .filter((p) => p.mode === "for-sale")
                                    .filter((p) => p.propertyStatus !== "closed" && p.propertyStatus !== "dead");
                                return [];
                              })()}
                              field={field}
                              propertySearch={propertySearch}
                              setPropertySearch={setPropertySearch}
                              isLoadingProperties={isLoadingProperties}
                              isFetching={isFetching}
                            />
                          )}
                        </DropdownMenu>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("prospectType") != "agent" && (
                  <>
                    <FormField
                      control={form.control}
                      name="adultCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Adults</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter a number (eg: 2)"
                              {...field}
                              min={0}
                              onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="childrenCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Children</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter a number (eg: 2)"
                              {...field}
                              min={0}
                              onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />{" "}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}

          <Card id="preferences">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="counties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                          >
                            {field?.value?.length && field?.value?.length > 0
                              ? `${field?.value?.length} county Selected`
                              : "Select county"}
                            <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[400px] p-4 max-h-[300px] overflow-y-auto">
                          <div className="grid grid-cols-1 gap-4">
                            {data.counties.map((county) => (
                              <div key={county.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={field?.value?.includes(county.name)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), county.name]
                                      : field?.value?.filter((value: string) => value !== county.name);
                                    field.onChange(updatedValue);
                                  }}
                                  className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                                />
                                <Label className="text-[16px] font-[400]">{county.name}</Label>
                              </div>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neighborhood</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                            disabled={form?.watch("counties")?.length === 0}
                          >
                            {field?.value?.length && field?.value?.length > 0
                              ? `${field?.value?.length} Neighborhoods Selected`
                              : "Select neighborhoods"}
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
                              {form.watch("counties") && form?.watch("counties")?.length === 0
                                ? "Please select at least one county first"
                                : "No neighborhoods found"}
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
                                          checked={field?.value?.includes(neighborhood)}
                                          onCheckedChange={(checked) => {
                                            const updatedValue = checked
                                              ? [...(field?.value || []), neighborhood]
                                              : field?.value?.filter((value: string) => value !== neighborhood);
                                            field.onChange(updatedValue);
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-black w-full">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        {form.watch("prospectType") == "buyer" ? (
                          <SelectContent>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Condo/Co-op">Condo/Co-Op</SelectItem>
                            <SelectItem value="House/Townhouse">House/Townhouse</SelectItem>
                            <SelectItem value="Lot/Land">Lot/Land</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                          </SelectContent>
                        ) : form.watch("prospectType") == "renter" ? (
                          <SelectContent>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Room">Room</SelectItem>
                          </SelectContent>
                        ) : (
                          <SelectContent>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Condo/Co-op">Condo/Co-Op</SelectItem>
                            <SelectItem value="House/Townhouse">House/Townhouse</SelectItem>
                            <SelectItem value="Room">Room</SelectItem>
                            <SelectItem value="Lot/Land">Lot/Land</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                          </SelectContent>
                        )}
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedroomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                          >
                            {field.value ? `${field.value} Bedrooms` : "Select bedrooms"}
                            <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[400px] p-4">
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value)}
                            value={field.value?.toString()}
                            className="grid grid-cols-5 gap-4"
                          >
                            {[
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
                            ].map((num) => (
                              <div key={num} className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={num}
                                  id={`bed-${num}`}
                                  className="text-[#13AF59] checked:bg-primary checked:border-primary h-[24px] w-[24px]"
                                />
                                <Label htmlFor={`bed-${num}`} className="text-[16px] font-[400]">
                                  {num}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage className="text-[16px] text-[#FF0000]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bathroomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                          >
                            {field.value ? `${field.value} Bathrooms` : "Select bathrooms"}
                            <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[400px] p-4">
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value)}
                            value={field.value?.toString()}
                            className="grid grid-cols-5 gap-4"
                          >
                            {[
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
                            ].map((num) => (
                              <div key={num} className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={num}
                                  id={`bath-${num}`}
                                  className="text-[#13AF59] checked:bg-primary checked:border-primary h-[24px] w-[24px]"
                                />
                                <Label htmlFor={`bath-${num}`} className="text-[16px] font-[400]">
                                  {num}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage className="text-[16px] text-[#FF0000]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="petOwned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Owned</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-black w-full">
                            <SelectValue placeholder="Select pet owned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">Yes, Dog</SelectItem>
                          <SelectItem value="cat">Yes, Cat</SelectItem>
                          <SelectItem value="both">Yes, Both</SelectItem>
                          <SelectItem value="service animal">Yes, Service Animal</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("prospectType") == "renter" ? (
                  <FormField
                    control={form.control}
                    name="projectedMoveInDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Projected Move In Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString() || "")}
                              captionLayout="dropdown"
                              startMonth={new Date(new Date().getFullYear() - 1, 0)}
                              endMonth={new Date(new Date().getFullYear() + 3, 11)}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Financials Section */}

          {form.watch("prospectType") == "buyer" ? (
            <Card id="financials">
              <CardHeader>
                <CardTitle>Financials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="financingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financing Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select financing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mortgage">Mortgage</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxPurchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Purchase Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              placeholder="in USD. Example: $2,500,000"
                              value={field.value ? `$${field.value.toLocaleString()}` : ""}
                              onChange={(e) => {
                                // Remove non-numeric characters and convert to number
                                const value = e.target.value.replace(/[^0-9.]/g, "");
                                const numValue = value ? parseFloat(value) : 0;
                                field.onChange(numValue);
                              }}
                              onBlur={() => {
                                // Ensure proper formatting on blur
                                if (field.value) {
                                  field.onChange(parseFloat(field.value.toString()));
                                }
                              }}
                              className="pr-12"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preApproved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is Pre-Approved?</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select approval status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("preApproved") && (
                    <FormField
                      control={form.control}
                      name="preApprovedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-Approved Amount</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="in USD. Example: $2,500,000"
                              value={field.value ? `$${field.value.toLocaleString()}` : ""}
                              onChange={(e) => {
                                // Remove non-numeric characters and convert to number
                                const value = e.target.value.replace(/[^0-9.]/g, "");
                                const numValue = value ? parseFloat(value) : 0;
                                field.onChange(numValue);
                              }}
                              onBlur={() => {
                                // Ensure proper formatting on blur
                                if (field.value) {
                                  field.onChange(parseFloat(field.value.toString()));
                                }
                              }}
                              className="pr-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : form.watch("prospectType") == "renter" ? (
            <Card id="financials">
              <CardHeader>
                <CardTitle>Financials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="annualHouseholdIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Household Income</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter amount"
                            value={field.value ? `$${field.value.toLocaleString()}` : ""}
                            onChange={(e) => {
                              // Remove non-numeric characters and convert to number
                              const value = e.target.value.replace(/[^0-9.]/g, "");
                              const numValue = value ? parseFloat(value) : 0;
                              field.onChange(numValue);
                            }}
                            onBlur={() => {
                              // Ensure proper formatting on blur
                              if (field.value) {
                                field.onChange(parseFloat(field.value.toString()));
                              }
                            }}
                            className="pr-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#57738E]">Credit Score</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select credit score" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no-credit">No Credit</SelectItem>
                            <SelectItem value="<500">{"<500"}</SelectItem>
                            <SelectItem value="500-524">500-524</SelectItem>
                            <SelectItem value="525-549">525-549</SelectItem>
                            <SelectItem value="550-574">550-574</SelectItem>
                            <SelectItem value="575-599">575-599</SelectItem>
                            <SelectItem value="600-624">600-624</SelectItem>
                            <SelectItem value="625-649">625-649</SelectItem>
                            <SelectItem value="650-674">650-674</SelectItem>
                            <SelectItem value="675-699">675-699</SelectItem>
                            <SelectItem value="700-724">700-724</SelectItem>
                            <SelectItem value="725-749">725-749</SelectItem>
                            <SelectItem value="750-774">750-774</SelectItem>
                            <SelectItem value="775-799">775-799</SelectItem>
                            <SelectItem value="800+">800+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxRentalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Rental Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter amount"
                            value={field.value ? `$${field.value.toLocaleString()}` : ""}
                            onChange={(e) => {
                              // Remove non-numeric characters and convert to number
                              const value = e.target.value.replace(/[^0-9.]/g, "");
                              const numValue = value ? parseFloat(value) : 0;
                              field.onChange(numValue);
                            }}
                            onBlur={() => {
                              // Ensure proper formatting on blur
                              if (field.value) {
                                field.onChange(parseFloat(field.value.toString()));
                              }
                            }}
                            className="pr-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="voucher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#57738E]">Voucher</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select voucher type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("voucher") && (
                    <FormField
                      control={form.control}
                      name="voucherAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voucher Amount</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Enter amount"
                              value={field.value ? `$${field.value.toLocaleString()}` : ""}
                              onChange={(e) => {
                                // Remove non-numeric characters and convert to number
                                const value = e.target.value.replace(/[^0-9.]/g, "");
                                const numValue = value ? parseFloat(value) : 0;
                                field.onChange(numValue);
                              }}
                              onBlur={() => {
                                // Ensure proper formatting on blur
                                if (field.value) {
                                  field.onChange(parseFloat(field.value.toString()));
                                }
                              }}
                              className="pr-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Amenities Section */}

          {form.watch("prospectType") != "agent" && (
            <Card id="amenities">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: "laundryInUnit", label: "Laundry" },
                          { id: "swimmingPool", label: "Swimming Pool" },
                          { id: "parkingSpace", label: "Parking" },
                        ].map((amenity) => (
                          <div key={amenity.id} className="flex flex-row items-start space-x-3">
                            <Checkbox
                              checked={field.value?.includes(amenity.id)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(field.value || []), amenity.id]
                                  : field.value?.filter((value) => value !== amenity.id) || [];
                                field.onChange(updatedValue);
                              }}
                              className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                            />
                            <Label className="text-sm font-normal">{amenity.label}</Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Brokerage */}
          {form.watch("prospectType") == "agent" && (
            <Card id="brokerage">
              <CardHeader>
                <CardTitle>Brokerage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brokerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brokerage Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter broker name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brokerPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            // international
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            // initialValueFormat="national"
                            placeholder="(555) 555-5555"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brokerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter a valid email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buyer Notes Section */}

          <Card id="notes">
            <CardHeader>
              <CardTitle> Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Enter notes" className="min-h-[100px] focus:outline-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 z-50 bg-white w-full p-6 border-t border-gray-200">
        <Button
          type="submit"
          form="buyer-form"
          className="bg-primary text-white px-10 py-2 h-[38px] shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoaderCircle className="animate-spin mr-2" size={16} />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="mr-2" size={16} />
              Add Prospect
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
