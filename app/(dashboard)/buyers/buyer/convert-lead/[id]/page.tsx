"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDownIcon, LoaderCircle, UserPlus, Search } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Temporary data
import data from "../../../../../../data.json";
import { PhoneInput } from "@/components/ui/phone-input";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCountiesForNeighborhoods } from "@/lib/findCounties";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { LeadsBuyer } from "@/types/leads";
import { Pets } from "@/types/shared";

const mapPetsToFormValue = (petOwned?: Pets): "no" | "dog" | "cat" | "both" | "other" | "service animal" => {
  if (!petOwned) return "no";
  switch (petOwned) {
    case Pets.Dog:
      return "dog";
    case Pets.Cat:
      return "cat";
    case Pets.Other:
      return "other";
    case Pets.ServiceAnimal:
      return "service animal"; // Map service animal to other
    default:
      return "no";
  }
};

const formSchema = z.object({
  // Lead Type

  // Personal Information
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  adultCount: z.string().min(1, { message: "Number of adults is required" }),
  childrenCount: z.string().min(1, { message: "Number of children is required" }),

  // Preferences
  counties: z.array(z.string()).min(1, { message: "At least one county is required" }),
  targetAreas: z.array(z.string()).min(1, { message: "Neighborhood is required" }),
  propertyType: z.string().min(1, { message: "Property Type is required" }),
  bedroomCount: z.string().min(1, { message: "Number of bedrooms is required" }),
  bathroomCount: z.string().min(1, { message: "Number of bathrooms is required" }),
  havePet: z.boolean().default(false),
  petOwned: z.enum(["dog", "cat", "both", "no", "other", "service animal"]).optional(),

  // Financials
  financingType: z.string().min(1, { message: "Financing type is required" }),
  maxPurchasePrice: z.number().min(1, "Max purchase price is required"),
  preApproved: z.boolean().default(false),
  preApprovedAmount: z.number().optional().default(0),

  // Amenities
  amenities: z.array(z.string()).default([]),

  // Notes
  buyersNote: z.string().optional(),
});

const sections = [
  { id: "personalinformation", name: "Personal Information" },
  { id: "preferences", name: "Preferences" },
  { id: "financials", name: "Financials" },
  { id: "amenities", name: "Amenities" },
  { id: "notes", name: " Notes" },
];

async function fetchLeadsBuyer(id: string) {
  const response = await fetch(`/api/leads/buyer/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  return data.data.buyers[0] as LeadsBuyer;
}

export default function BuyerForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(0);
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: leadsBuyer,
    // isLoading,
    // isFetching,
  } = useQuery({
    queryKey: ["leads-buyer", id],
    queryFn: () => fetchLeadsBuyer(id as string),
    enabled: !!id,
    // Use cached data for better performance
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      if (!scrollContainerRef.current) {
        return;
      }

      const handleScroll = () => {
        if (!scrollContainerRef.current) {
          return;
        }

        const scrollPosition = scrollContainerRef.current.scrollTop + 50;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const element = scrollContainerRef.current.querySelector(`#${section.id}`) as HTMLElement;
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(i);
              break;
            }
          }
        }
      };

      const scrollContainer = scrollContainerRef.current;
      scrollContainer.addEventListener("scroll", handleScroll);

      // Initial call to set the active section
      handleScroll();

      // Cleanup function
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, 100); // 100ms delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, []);

  const scrollToSection = (sectionIndex: number) => {
    if (!scrollContainerRef.current) return;

    const sectionId = sections[sectionIndex].id;
    const element = scrollContainerRef.current.querySelector(`#${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: leadsBuyer?.firstName || "",
      lastName: leadsBuyer?.lastName || "",
      phoneNumber: leadsBuyer?.phoneNumber || "",
      email: leadsBuyer?.email || "",
      adultCount: leadsBuyer?.adultCount?.toString() || "",
      childrenCount: leadsBuyer?.childrenCount?.toString() || "",
      bathroomCount: leadsBuyer?.bathroomCount?.toString() || "",
      bedroomCount: leadsBuyer?.bedroomCount?.toString() || "",
      targetAreas: leadsBuyer?.targetAreas || [],
      counties: getCountiesForNeighborhoods(leadsBuyer?.targetAreas || []),
      financingType: leadsBuyer?.financingType || "",
      maxPurchasePrice: leadsBuyer?.maxPurchasePrice || 0,
      preApproved: leadsBuyer?.preApproved || false,
      preApprovedAmount: leadsBuyer?.preApprovedAmount || 0,
      amenities: leadsBuyer?.amenities || [],
      buyersNote: leadsBuyer?.buyersNote?.text || "",
      propertyType: leadsBuyer?.propertyType || "",
      petOwned: mapPetsToFormValue(leadsBuyer?.petOwned),
    },
  });

  useEffect(() => {
    if (leadsBuyer) {
      form.reset({
        firstName: leadsBuyer.firstName || "",
        lastName: leadsBuyer.lastName || "",
        phoneNumber: leadsBuyer.phoneNumber || "",
        email: leadsBuyer.email || "",
        adultCount: leadsBuyer.adultCount?.toString() || "",
        childrenCount: leadsBuyer.childrenCount?.toString() || "",
        bathroomCount: leadsBuyer.bathroomCount?.toString() || "",
        bedroomCount: leadsBuyer.bedroomCount?.toString() || "",
        targetAreas: leadsBuyer.targetAreas || [],
        counties: getCountiesForNeighborhoods(leadsBuyer.targetAreas || []),
        propertyType: leadsBuyer.propertyType || "",
        financingType: leadsBuyer.financingType || "",
        maxPurchasePrice: leadsBuyer.maxPurchasePrice || 0,
        preApproved: leadsBuyer.preApproved || false,
        preApprovedAmount: leadsBuyer.preApprovedAmount || 0,
        amenities: leadsBuyer.amenities || [],
        buyersNote: leadsBuyer.buyersNote?.text || "",
        petOwned: mapPetsToFormValue(leadsBuyer.petOwned),
      });
    }
  }, [leadsBuyer]);

  useEffect(() => {
    form.reset(); // Clear form when ID changes
  }, [id]);

  const filteredNeighborhoodsByCounty = useMemo(() => {
    const selectedCounties = form.watch("counties");
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
  }, [neighborhoodSearch, form.watch("counties")]);

  useEffect(() => {
    if (!form.watch("petOwned") || form.watch("petOwned") === "no") {
      form.setValue("havePet", false);
      return;
    } else {
      form.setValue("havePet", true);
    }
  }, [form.watch("petOwned")]);

  const watchFinancingType = form.watch("financingType");

  useEffect(() => {
    if (watchFinancingType?.toLowerCase() === "cash") {
      form.setValue("preApproved", false);
      form.setValue("preApprovedAmount", undefined);
    }
  }, [watchFinancingType, form]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Remove leadType from the data being sent to API
      const { counties: _counties, ...dataWithoutLeadType } = data;

      const encodedData = {
        ...dataWithoutLeadType, // Use data without leadType
        preApprovedAmount: data.preApproved ? data.preApprovedAmount : 0,
        buyersNote: {
          text: data.buyersNote || "",
          timestamp: data.buyersNote ? Date.now() : 0,
        },
        activityNotes: leadsBuyer?.activityNotes,
        petOwned: data.petOwned != "no" ? data.petOwned : undefined,
      };

      const response = await fetch("/api/buyers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encodedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add Buyer");
      }

      const responseData = await response.json();

      const signedResponse = await fetch("/api/leads/buyer/signed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsBuyer?._id, isSigned: true }),
      });

      if (!signedResponse.ok) {
        const errorData = await response.json();
        // //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to Sign Leads Buyer");
      }
      handleUpdateStatus("Inactive");

      queryClient.invalidateQueries({ queryKey: ["leads-buyer", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });

      setIsLoading(false);

      toast.success("Buyer created successfully");

      form.reset();

      router.push("/buyers/buyer/" + responseData.data._id);
    } catch (error) {
      setIsLoading(false);
      // console.error("Error creating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to create buyer",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const response = await fetch("/api/leads/buyer/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsBuyer?._id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        ////console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads Buyer Status");
      }

      queryClient.invalidateQueries({ queryKey: ["leads-buyer", leadsBuyer?._id] });
      queryClient.invalidateQueries({ queryKey: ["leadsBuyers"] });

      toast.success("Buyer Status Updated successfully");
    } catch (error) {
      // console.error("Error updating buyer:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Buyer with this email already exists"
            : "Failed to update leads buyer status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  return (
    <div className="flex gap-2 max-h-[90vh]">
      <Card className="w-72 bg-white shadow-sm h-fit border-r border-gray-200">
        <nav className=" p-4">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(index)}
              className={cn(
                "w-full text-left px-4 py-3 text-sm transition-colors",
                activeSection === index
                  ? " text-primary border-l-4 border-primary font-medium"
                  : "text-gray-700 hover:bg-gray-50 border-l-[1px] ml-[0.8px] border-l-black"
              )}
            >
              {section.name}
            </button>
          ))}
        </nav>
      </Card>
      <div className="space-y-6 w-full mx-auto p-6 py-0 relative overflow-auto pb-[500px]" ref={scrollContainerRef}>
        <Form {...form}>
          <form id="buyer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
            {/* Lead Type Section */}

            {/* Personal Information Section */}

            <Card id="personalinformation">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
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
                  />
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
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
                            >
                              {field.value.length > 0 ? `${field.value.length} Counties Selected` : "Select counties"}
                              <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[400px] p-4 max-h-[300px] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-4">
                              {data.counties.map((county) => (
                                <div key={county.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={field.value.includes(county.name)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, county.name]
                                        : field.value.filter((value: string) => value !== county.name);
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
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
                              disabled={form.watch("counties").length === 0}
                            >
                              {field.value.length > 0
                                ? `${field.value.length} Neighborhoods Selected`
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
                                {form.watch("counties").length === 0
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
                                            checked={field.value.includes(neighborhood)}
                                            onCheckedChange={(checked) => {
                                              const updatedValue = checked
                                                ? [...field.value, neighborhood]
                                                : field.value.filter((value: string) => value !== neighborhood);
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
                          <SelectContent>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Condo/Co-op">Condo/Co-Op</SelectItem>
                            <SelectItem value="House/Townhouse">House/Townhouse</SelectItem>
                            <SelectItem value="Lot/Land">Lot/Land</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                          </SelectContent>
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
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
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
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select pet owned" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="dog">Yes, Dogs</SelectItem>
                            <SelectItem value="cat">Yes, Cat</SelectItem>
                            <SelectItem value="both">Yes, Both</SelectItem>
                            <SelectItem value="service animal">Yes, Service Animal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financials Section */}

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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                              placeholder="Enter amount"
                              value={field.value ? `$${field.value.toLocaleString("en-US")}` : ""}
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
                  {form.watch("financingType") !== "cash" && (
                    <FormField
                      control={form.control}
                      name="preApproved"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Is Pre-Approved?</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                          >
                            <FormControl>
                              <SelectTrigger className="text-black w-full">
                                <SelectValue placeholder="Select approval status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                              placeholder="Enter amount"
                              value={field.value ? `$${field.value.toLocaleString("en-US")}` : ""}
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

            {/* Amenities Section */}

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

            {/* Buyer Notes Section */}

            <Card id="notes">
              <CardHeader>
                <CardTitle> Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="buyersNote"
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
                Add Buyer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
