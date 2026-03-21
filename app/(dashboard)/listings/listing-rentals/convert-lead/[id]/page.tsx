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
import { cn } from "@/lib/utils";

// Temporary data
import data from "../../../../../../data.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useSelectedLeadsStore } from "@/store/selected";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";

const sections = [
  { id: "stage", name: "Stage" },
  { id: "owner", name: "Owner" },
  { id: "location", name: "Location" },
  { id: "details", name: "Details" },
  { id: "amenities", name: "Amenities" },
  { id: "brokerage", name: "Brokerage" },
  { id: "agent", name: "Agent" },
  { id: "access", name: "Access" },
];

const formSchema = z.object({
  // Lead Type
  propertyStatus: z.string().min(1, { message: "Stage is required" }),

  // Personal Information
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),

  // Property Details
  propertyCounty: z.string().min(1, { message: "Property county is required" }),
  propertyPrice: z.number().min(1, { message: "Property price is required" }),
  propertyAddress: z.string().min(1, { message: "Property address is required" }),
  propertyState: z.string().min(1, { message: "Property state is required" }),
  propertyZipcode: z.string().min(1, { message: "Property zipcode is required" }),
  propertyNeighborhood: z.string().min(1, { message: "Property neighborhood is required" }),
  propertyURL: z.string().optional(),
  propertyType: z.string().min(1, { message: "Property type is required" }),
  bedroomCount: z.string().min(1, { message: "Number of bedrooms is required" }),
  bathroomCount: z.string().min(1, { message: "Number of bathrooms is required" }),
  petOwned: z.string().min(1, { message: "Pet owned is required" }),

  brokerName: z.string().min(1, { message: "Broker name is required" }),
  agentName: z.string().min(1, { message: "Agent name is required" }),
  brokerContactInfo: z.string().min(1, { message: "Phone number is required" }),
  agentContactInfo: z.string().min(1, { message: "Phone number is required" }),

  // Amenities
  amenities: z.array(z.string()).optional().default([]),

  // Notes
  description: z.string().optional(),
});

interface LeadsSeller {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  propertyAddress: string;
  propertyPrice: number;
  propertyCounty: string;
  propertyNeighborhood: string;
  propertyState: string;
  propertyType: string;
  propertyURL?: string;
  propertyZipcode: string;
  bedroomCount: string;
  bathroomCount: string;
  petOwned: string;
  amenities: string[];
  description?: string;
  activityNotes?: {
    note: string;
    timestamp: string;
  }[];
}

async function fetchLeadsSeller(id: string) {
  const response = await fetch(`/api/leads/landlord/${id}`, {
    method: "GET",
  });

  const data = await response.json();
  //console.log("LANDLORD:", data.data.landlords[0]);
  return data.data.landlords[0] as LeadsSeller;
}

export default function ConvertSellerToListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [activeSection, setActiveSection] = useState(0);
  const { setSelectedLead } = useSelectedLeadsStore();
  const queryClient = useQueryClient();
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { user } = useUserStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  console.log("USER:", user);

  const { data: leadsLandlord, isLoading: isLoadingSeller } = useQuery({
    queryKey: ["lead-landlord", id],
    queryFn: () => fetchLeadsSeller(id as string),
    enabled: !!id,
    initialData: () => {
      return queryClient.getQueryData(["lead-landlord", id]);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyStatus: "active",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      propertyCounty: "",
      propertyPrice: 0,
      propertyAddress: "",
      propertyState: "NY",
      propertyZipcode: "",
      propertyNeighborhood: "",
      propertyURL: "",
      propertyType: "",
      bedroomCount: "",
      bathroomCount: "",
      petOwned: "no",
      brokerName: `${user?.brokerageName}`,
      agentName: user?.firstname || user?.lastname ? `${user?.firstname} ${user?.lastname}` : "",
      brokerContactInfo: user?.brokeragePhoneNumber,
      agentContactInfo: user?.phoneNumber,
      amenities: [],
      description: "",
    },
  });

  // Populate form when landlord data loads
  useEffect(() => {
    if (leadsLandlord) {
      form.reset({
        propertyStatus: "active",
        firstName: leadsLandlord.firstName || "",
        lastName: leadsLandlord.lastName || "",
        phoneNumber: leadsLandlord.phoneNumber || "",
        email: leadsLandlord.email || "",
        propertyCounty: leadsLandlord.propertyCounty || "",
        propertyPrice: leadsLandlord.propertyPrice || 0,
        propertyAddress: leadsLandlord.propertyAddress || "",
        propertyState: "NY",
        propertyZipcode: leadsLandlord.propertyZipcode || "",
        propertyNeighborhood: leadsLandlord.propertyNeighborhood || "",
        propertyURL: leadsLandlord.propertyURL || "",
        propertyType: leadsLandlord.propertyType || "",
        bedroomCount: leadsLandlord.bedroomCount || "",
        bathroomCount: leadsLandlord.bathroomCount || "",
        petOwned: leadsLandlord.petOwned || "no",
        brokerName: `${user?.brokerageName}`,
        agentName: user?.firstname || user?.lastname ? `${user?.firstname} ${user?.lastname}` : "",
        brokerContactInfo: user?.brokeragePhoneNumber,
        agentContactInfo: user?.phoneNumber,
        amenities: leadsLandlord.amenities || [],
        description: leadsLandlord.description || "",
      });
    }
  }, [leadsLandlord]);

  useEffect(() => {
    form.reset(); // Clear form when ID changes
  }, [id]);

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

  const selectedCounty = form.watch("propertyCounty");

  const filteredNeighborhoodsByCounty = useMemo(() => {
    if (!selectedCounty) {
      return [];
    }

    const countiesWithNeighborhoods = data.counties
      .filter((county) => county.name === selectedCounty)
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
  }, [neighborhoodSearch, selectedCounty]);

  const handleUpdateStatus = async (status: string) => {
    try {
      const response = await fetch("/api/leads/landlord/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsLandlord?._id, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to update Leads Landlord Status");
      }

      queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });

      toast.success("Landlord Status Updated successfully");
    } catch (error) {
      console.error("Error updating landlord:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "landlord with this email already exists"
            : "Failed to update leads Landlord status",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const encodedData = {
        url: data.propertyURL || "",
        address: {
          streetAddress: data.propertyAddress,
          city: data.propertyCounty,
          state: data.propertyState,
          zipcode: data.propertyZipcode,
          parentRegionName: data.propertyNeighborhood,
        },
        description: data.description || "",
        price: data.propertyPrice,
        compensation: 0,
        homeType: data.propertyType,
        bedrooms: parseInt(data.bedroomCount),
        bathrooms: parseInt(data.bathroomCount),
        amenities: {
          parking: data.amenities.includes("parkingSpace") ? "yes" : "no",
          pool: data.amenities.includes("swimmingPool") ? "yes" : "no",
          laundry: data.amenities.includes("laundryInUnit") ? "yes" : "no",
        },
        attribution: {
          brokerName: data.brokerName || "",
          brokerContactInfo: data.brokerContactInfo || "",
          agentName: data.agentName || "",
          agentContactInfo: data.agentContactInfo || "",
        },
        owner: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          email: data.email,
        },
        petFriendly: {
          allowsLargeDogs: data.petOwned === "dog" || data.petOwned === "both" ? "yes" : "no",
          allowsCats: data.petOwned === "cat" || data.petOwned === "both" ? "yes" : "no",
        },
        neighborhood: data.propertyNeighborhood,
        mode: "for-rent",
        propertyStatus: data.propertyStatus,
        salesNote: leadsLandlord?.activityNotes?.map((note) => ({
          text: note.note,
          timestamp: note.timestamp,
        })),
        isLocalListing: true,
        convertedFromLeadId: leadsLandlord?._id, // Track the original lead
      };

      const response = await fetch("/api/listings/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encodedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to convert lead to listing");
      }

      const responseData = await response.json();
      setSelectedLead(responseData.data);

      const responseSigned = await fetch("/api/leads/landlord/signed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: leadsLandlord?._id, isSigned: true }),
      });

      if (!responseSigned.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to edit landlord");
      }
      handleUpdateStatus("Inactive");
      queryClient.invalidateQueries({ queryKey: ["lead-landlord", id] });
      queryClient.invalidateQueries({ queryKey: ["leadsLandlords"] });
      queryClient.invalidateQueries({ queryKey: ["listingsRentals"] });

      setIsLoading(false);

      toast.success("Lead successfully converted to listing");

      // Navigate to the new listing
      router.push(`/listings/listing-rentals/${responseData.data._id}`);
    } catch (error) {
      setIsLoading(false);
      console.error("Error converting lead to listing:", error);
      toast("Error", {
        description: "Failed to convert lead to listing",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  if (isLoadingSeller) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="animate-spin" size={32} />
      </div>
    );
  }

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
          <form id="convert-listing-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
            {/* Stage Section */}
            <Card id="stage" className="py-4 gap-0 flex ">
              <CardHeader className="pb-0"></CardHeader>
              <CardContent className="flex flex-row items-center gap-4">
                <FormField
                  control={form.control}
                  name="propertyStatus"
                  render={({ field }) => (
                    <FormItem className="w-full flex flex-row items-center gap-4 mb-0">
                      <CardTitle className="whitespace-nowrap m-0 p-0">Listing Stage</CardTitle>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-black whitespace-nowrap w-[180px]">
                            <SelectValue placeholder="Select Option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inContract">In Contract</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="dead">Dead</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Owner Section */}
            <Card id="owner">
              <CardHeader>
                <CardTitle>Owner</CardTitle>
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
                          <Input placeholder="Your First Name Here" {...field} />
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
                          <Input placeholder="Your Last Name Here" {...field} />
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
                          <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
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
                </div>
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card id="location">
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Address</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Enter Property Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NY">New York</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyCounty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
                            >
                              {field.value ? field.value : "Select county"}
                              <ChevronDownIcon className="size-6 opacity-50 text-inherit" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[400px] p-4 max-h-[300px] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-4">
                              {data.counties.map((county) => (
                                <div key={county.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={field.value === county.name}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked ? county.name : "";
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
                    name="propertyNeighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className=" h-[48px] w-full border-[1px]  p-2   text-black font-normal justify-between"
                              disabled={!form.watch("propertyCounty")}
                            >
                              {field.value ? field.value : "Select neighborhood"}
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
                                {!form.watch("propertyCounty")
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
                                            checked={field.value === neighborhood}
                                            onCheckedChange={(checked) => {
                                              const updatedValue = checked ? neighborhood : "";
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
                    name="propertyZipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Enter Zip Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Listing Url (If Any)</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="example: closodex.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Details Section */}
            <Card id="details">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Price</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Room">Room</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
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
                              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].map((num) => (
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
                              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].map((num) => (
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
                        <FormLabel>Allowed Pets</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-black w-full">
                              <SelectValue placeholder="Select an option here" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dog">Yes, Dog</SelectItem>
                            <SelectItem value="cat">Yes, Cat</SelectItem>
                            <SelectItem value="both">Yes, Both</SelectItem>
                            {/* <SelectItem value="service animal">Yes, Service Animal</SelectItem> */}
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Amenities Section */}
            <Card id="amenities">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <>
                        {[
                          { value: "laundryInUnit", label: "Laundry" },
                          { value: "parkingSpace", label: "Parking" },
                          { value: "swimmingPool", label: "Swimming Pool" },
                        ].map((amenity) => (
                          <FormItem key={amenity.value} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(amenity.value)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...(field.value || []), amenity.value]
                                    : field.value?.filter((value) => value !== amenity.value) || [];
                                  field.onChange(updatedValue);
                                }}
                                className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{amenity.label}</FormLabel>
                            </div>
                          </FormItem>
                        ))}
                      </>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Brokerage Section */}
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
                        <FormLabel>Broker Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Broker Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brokerContactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Section */}
            <Card id="agent">
              <CardHeader>
                <CardTitle>Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Agent Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentContactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description Section */}
            <Card id="access">
              <CardHeader>
                <CardTitle>Access</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Enter notes" className="min-h-[100px]" {...field} />
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
            form="convert-listing-form"
            className="bg-primary text-white px-10 py-2 h-[38px] shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin mr-2" size={16} />
                Converting...
              </>
            ) : (
              <>
                <UserPlus className="mr-2" size={16} />
                Convert to Rentals Listing
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
