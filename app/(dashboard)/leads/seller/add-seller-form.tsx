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
import { useState, useMemo } from "react";
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
import { useLeadsSellerStore } from "@/store/sheets";

const formSchema = z
  .object({
    // Lead Type
    leadType: z.string().min(1, { message: "Lead type is required" }),

    // Personal Information
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),

    // Property Details
    propertyCounty: z.string().min(1, { message: "Property county is required" }),
    propertyPrice: z.number().optional(),
    propertyAddress: z.string().min(1, { message: "Property address is required" }),
    propertyState: z.string().min(1, { message: "Property state is required" }).default("ny"),
    propertyZipcode: z.string().min(1, { message: "Property zipcode is required" }),
    propertyNeighborhood: z.string().min(1, { message: "Property neighborhood is required" }),
    propertyURL: z.string().optional(),
    propertyType: z.string().optional(),
    bedroomCount: z.string().optional(),
    bathroomCount: z.string().optional(),
    petOwned: z.string().optional(),

    // Amenities
    amenities: z.array(z.string()).optional().default([]),

    // Notes
    description: z.string().optional(),
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

interface LeadSellerFormProps {
  onSuccess?: () => void;
}

export default function SellerForm({ onSuccess }: LeadSellerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const { setSelectedLead } = useSelectedLeadsStore();
  const queryClient = useQueryClient();
  const { openView } = useLeadsSellerStore();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadType: "",
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
    },
  });

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

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Process the data for API
      const processedData = { ...data };

      const encodedData = {
        ...processedData,
        email: data.email ? data.email : undefined,
        phoneNumber: data.phoneNumber ? data.phoneNumber : undefined,
        petOwned: data.petOwned !== "no" ? data.petOwned : undefined,
      };

      const response = await fetch("/api/leads/seller/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encodedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        //console.log("ERROR DATA:", errorData);
        throw new Error(errorData.message || "Failed to add Landlord");
      }

      const responseData = await response.json();
      setSelectedLead(responseData.data);
      queryClient.setQueryData(["lead-seller", responseData.data._id], responseData.data);
      queryClient.invalidateQueries({ queryKey: ["leadsSellers"] });

      setIsLoading(false);

      toast.success("Seller created successfully");

      form.reset();

      if (onSuccess) {
        onSuccess();
        openView(responseData.data.id);
      }
    } catch (error) {
      setIsLoading(false);
      // console.error("Error creating seller:", error);
      toast("Error", {
        description:
          error instanceof Error && error.message.includes("already")
            ? "Seller with this email already exists"
            : "Failed to create leads landlord",
        className: "border-l-4 border-l-[#FF0000] bg-white",
      });
    }
  }

  return (
    <div className="space-y-6 w-full mx-auto p-6 py-0 relative">
      <Form {...form}>
        <form
          id="leads-seller-form"
          onSubmit={form.handleSubmit(
            onSubmit,
            (e) => e?.leadType && document.querySelector(".overflow-y-auto")?.scrollTo(0, 0)
          )}
          className="space-y-6 w-full"
        >
          {/* Lead Type Section */}

          <Card id="leadtype" className="py-4 gap-0 flex ">
            <CardHeader className="pb-0"></CardHeader>
            <CardContent className="flex flex-row items-center gap-4">
              <FormField
                control={form.control}
                name="leadType"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-row items-center gap-4 mb-0">
                    <CardTitle className="whitespace-nowrap m-0 p-0">Lead Type</CardTitle>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-black whitespace-nowrap w-[180px]">
                          <SelectValue placeholder="Select Hot/Cold" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hot">Hot</SelectItem>
                        <SelectItem value="Cold">Cold</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="ny">
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
                      <FormLabel>Number of Bedrooms</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                          >
                            {field.value ? `${field.value} Bedrooms` : "Select number of bedrooms"}
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
                      <FormLabel>Number of Bathrooms</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className=" h-[48px] w-full border-[1px]  p-2   text-[#57738E] font-normal justify-between"
                          >
                            {field.value ? `${field.value} Bathrooms` : "Select number of bathrooms"}
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

          {/* Buyer Notes Section */}

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
          form="leads-seller-form"
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
              Add Seller Lead
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
