import { Listing } from "./listings";

export type ProspectLog = {
  buyersNote: {
    text: string;
    timestamp: number;
  };
  rentersNote: {
    text: string;
    timestamp: number;
  };
  _id: string;
  prospectType: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType: string;
  bedroomCount: string;
  bathroomCount: string;
  havePet: boolean;
  amenities: string[];
  financingType: string;
  preApproved: boolean;
  preApprovedAmount: number;
  listingUrl: string;
  propertyId: string;
  property: Listing;
  maxPurchasePrice: number;
  maxRentalPrice: number;
  creditScore: string;
  annualHouseholdIncome: number;
  voucher: string;
  voucherAmount: number;
  prospectStatus: string;
  addedBy: string;
  isActive: boolean;
  activityNotes: buyerNotes[];
  modificationHistory: buyerNotes[];
  matches: buyerNotes[];
  createdAt: string;
  updatedAt: string;
  brokerName: string;
  brokerEmail: string;
  brokerPhoneNumber: string;
  id: string;
};

interface buyerNotes {
  note: string;
  text: string;
  timestamp: string;
}
