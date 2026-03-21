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
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";

// Temporary data
import data from "../../../../data.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// import { PhoneInput } from "@/components/ui/phone-input";
import { useSelectedLeadsStore } from "@/store/selected";
import { useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import { ListingSales, ListingOwner } from "@/types/listings";
import { formatPhoneToInternational } from "@/lib/formatNumber";
import { useUserStore } from "@/store/user";
import { useListingSalesStore } from "@/store/sheets";

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

interface ListingSalesFormProps {
  onSuccess?: () => void;
  previousListings?: ListingSales[];
}

export default function ListingSalesForm({ onSuccess, previousListings }: ListingSalesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const { setSelectedLead } = useSelectedLeadsStore();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { openView } = useListingSalesStore();

  // Auto-suggestion states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [filteredOwners, setFilteredOwners] = useState<ListingOwner[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Use individual refs instead of object to avoid dependency issues
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Extract unique owners from previous listings
  const uniqueOwners = useMemo(() => {
    if (!previousListings || previousListings.length === 0) return [];

    const ownersMap = new Map();
    previousListings.forEach((listing) => {
      if (listing?.owner) {
        const key = `${listing.owner.email}_${listing.owner.phoneNumber}`;
        if (!ownersMap.has(key)) {
          ownersMap.set(key, listing.owner);
        }
      }
    });

    return Array.from(ownersMap.values());
  }, [previousListings]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyStatus: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      propertyCounty: "",
      propertyAddress: "",
      propertyState: "NY",
      propertyZipcode: "",
      propertyNeighborhood: "",
      propertyURL: "",
      propertyType: "",
      bedroomCount: "",
      bathroomCount: "",
      petOwned: "no",
      amenities: [],
      description: "",
      brokerName: user?.brokerageName,
      agentName: user?.firstname + " " + user?.lastname,
      brokerContactInfo: user?.brokeragePhoneNumber,
      agentContactInfo: user?.phoneNumber,
    },
  });

  const selectedCounty = form.watch("propertyCounty");

  // Filter owners based on search input
  const filterOwners = (value: string, field: string) => {
    if (!value || value.length < 1) {
      setFilteredOwners([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered = uniqueOwners
      .filter((owner) => {
        switch (field) {
          case "firstName":
            return owner.firstName?.toLowerCase().includes(searchTerm);
          case "lastName":
            return owner.lastName?.toLowerCase().includes(searchTerm);
          case "phoneNumber":
            return owner.phoneNumber?.includes(searchTerm);
          case "email":
            return owner.email?.toLowerCase().includes(searchTerm);
          default:
            return false;
        }
      })
      .slice(0, 5); // Show max 5 suggestions

    setFilteredOwners(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(0);
  };

  // Auto-fill all owner fields when a suggestion is selected
  const selectOwner = (owner: { firstName?: string; lastName?: string; phoneNumber?: string; email?: string }) => {
    form.setValue("firstName", owner.firstName || "");
    form.setValue("lastName", owner.lastName || "");
    form.setValue("phoneNumber", owner.phoneNumber || "");
    form.setValue("email", owner.email || "");
    setShowSuggestions(false);
    setActiveField(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredOwners.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOwners[selectedIndex]) {
          selectOwner(filteredOwners[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        const isInputField =
          (firstNameRef.current && firstNameRef.current.contains(event.target as Node)) ||
          (lastNameRef.current && lastNameRef.current.contains(event.target as Node)) ||
          (emailRef.current && emailRef.current.contains(event.target as Node));
        if (!isInputField) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        mode: "for-sale",
        propertyStatus: data.propertyStatus,
        // salesNote: data.description
        //   ? [
        //       {
        //         text: data.description,
        //         timestamp: Date.now(),
        //       },
        //     ]
        //   : [],
        isLocalListing: true,
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
        throw new Error(errorData.message || "Failed to add Listing Sale");
      }

      const responseData = await response.json();
      setSelectedLead(responseData.data);
      queryClient.setQueryData(["listing-sale", responseData.data._id], responseData.data);
      queryClient.invalidateQueries({ queryKey: ["listingsSales"] });

      setIsLoading(false);

      toast.success("Listing created successfully");

      if (onSuccess) {
        onSuccess();
        openView(responseData.data.id);
      }

      form.reset();
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating listing:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Seller with this email already exists"
            : "Failed to create listing",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  return (
    <div className="space-y-6 w-full mx-auto p-6 py-0 relative">
      <Form {...form}>
        <form
          id="listings-sales-form"
          onSubmit={form.handleSubmit(onSubmit, (e) => {
            if (e?.propertyStatus) {
              setTimeout(() => {
                document
                  .getElementById("stage")
                  ?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
              }, 100);
            }
          })}
          className="space-y-6 w-full"
        >
          {/* Lead Type Section */}

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

          {/* Personal Information Section */}

          <Card id="owner">
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your First Name Here"
                          {...field}
                          ref={firstNameRef}
                          onChange={(e) => {
                            field.onChange(e);
                            filterOwners(e.target.value, "firstName");
                            setActiveField("firstName");
                          }}
                          onFocus={() => {
                            filterOwners(field.value, "firstName");
                            setActiveField("firstName");
                          }}
                          onKeyDown={handleKeyDown}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Last Name Here"
                          {...field}
                          ref={lastNameRef}
                          onChange={(e) => {
                            field.onChange(e);
                            filterOwners(e.target.value, "lastName");
                            setActiveField("lastName");
                          }}
                          onFocus={() => {
                            filterOwners(field.value, "lastName");
                            setActiveField("lastName");
                          }}
                          onKeyDown={handleKeyDown}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="+x (xxx) xxx xxxx"
                          {...field}
                          onChange={(value) => {
                            field.onChange(value);
                            filterOwners(value, "phoneNumber");
                            setActiveField("phoneNumber");
                          }}
                          onFocus={() => {
                            filterOwners(field.value, "phoneNumber");
                            setActiveField("phoneNumber");
                          }}
                          onKeyDown={handleKeyDown}
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
                    <FormItem className="relative">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter a valid email"
                          {...field}
                          ref={emailRef}
                          onChange={(e) => {
                            field.onChange(e);
                            filterOwners(e.target.value, "email");
                            setActiveField("email");
                          }}
                          onFocus={() => {
                            filterOwners(field.value, "email");
                            setActiveField("email");
                          }}
                          onKeyDown={handleKeyDown}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auto-suggestions dropdown */}
                {showSuggestions && activeField && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-[70%]  max-w-md bg-white border border-gray-200 rounded-md shadow-lg -mt-2"
                    style={{
                      top: activeField === "firstName" || activeField === "lastName" ? "80px" : "180px",
                      left: activeField === "firstName" || activeField === "phoneNumber" ? "0" : "50%",
                    }}
                  >
                    {filteredOwners.map((owner, index) => (
                      <div
                        key={index}
                        className={`px-4 py-2 cursor-pointer hover:bg-white ${
                          index === selectedIndex ? "bg-white" : ""
                        } ${index !== filteredOwners.length ? "border-b-[1.5px]" : ""}`}
                        onClick={() => selectOwner(owner)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="font-medium">
                          {owner.firstName} {owner.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{owner.email}</div>
                        <div className="text-sm text-gray-600">{formatPhoneToInternational(owner.phoneNumber)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}

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
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
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
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
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

          {/* Financials Section */}

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="petOwned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed Pets</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          {/* Buyer Notes Section */}

          <Card id="description">
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
                      <Textarea placeholder="Enter Access Instructions" className="min-h-[100px]" {...field} />
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
          form="listings-sales-form"
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
              Add Sales Listing
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
