import { matchData } from "./matches";

export interface ListingAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  parentRegionName: string;
}

export interface ListingOwner {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

export interface ListingAmenities {
  parking: "yes" | "no";
  pool: "yes" | "no";
  laundry: "yes" | "no";
}

export interface ListingAttribution {
  brokerName: string;
  brokerContactInfo: string;
  agentName: string;
  agentContactInfo: string;
}

export interface ListingPetFriendly {
  allowsLargeDogs: "yes" | "no";
  allowsCats: "yes" | "no";
  allowsBoth?: "yes" | "no";
  allowsPet?: boolean;
}

export interface SalesNote {
  text: string;
  timestamp: number;
  _id: string;
  id: string;
}

export interface Listing {
  _id: string;
  id: string;
  url: string;
  description: string;
  price: number;
  compensation: number;
  homeType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  isLocalListing: boolean;
  addedBy: string;
  photos: string[];
  neighborhood: string;
  mode: "for-sale" | "for-rent";
  propertyStatus: string;
  address: ListingAddress;
  owner: ListingOwner;
  amenities: ListingAmenities;
  attribution: ListingAttribution;
  petFriendly: ListingPetFriendly;
  isVoucherApproved: boolean;
  salesNote: SalesNote[];
  matches: matchData[];
  createdAt: string;
  updatedAt: string;
}

export type ListingSales = Listing & {
  mode: "for-sale";
};

export type ListingRentals = Listing & {
  mode: "for-rent";
};

export interface Prospect {
  id: string;
  _id: string;
  prospectType: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  property: Listing;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType: string;
  bedroomCount: string;
  bathroomCount: string;
  havePet: boolean;
  petOwned?: string;
  amenities?: string[];
  // Unified financing field (buyer uses "financingType" and renter had "financials")
  financingType?: string;
  preApproved: boolean;
  preApprovedAmount?: number;
  listingUrl?: string;
  // Buyer-specific fields
  maxPurchasePrice?: number;
  buyersNote?: {
    text?: string;
    timestamp?: number;
  };
  // Renter-specific fields
  projectedMoveInDate?: string;
  maxRentalPrice?: number;
  creditScore?: string;
  annualHouseholdIncome?: number;
  rentersNote?: {
    text?: string;
    timestamp?: number;
  };
  voucher?: string;
  voucherAmount?: number;
  prospectStatus: string;
  brokerName: string;
  brokerPhoneNumber: string;
  brokerEmail: string;
  isActive: boolean;
  modificationHistory: { note: string; timestamp: number }[];
  matches: matchData[];
  activityNotes: { note: string; timestamp: number }[];
  updatedAt: string;
}
