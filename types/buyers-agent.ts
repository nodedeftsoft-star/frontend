import { LeadType, PropertyType, Pets, FinancingType, LeadStatus, PropertyMatch } from "./shared";

export type Buyer = {
  buyersNote: {
    text: string;
    timestamp: number;
  };
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType: PropertyType;
  bedroomCount: string;
  bathroomCount: string;
  havePet: boolean;
  petOwned: Pets;
  amenities: string[];
  financingType: FinancingType;
  preApproved: boolean;
  preApprovedAmount: number;
  maxPurchasePrice: number;
  status: LeadStatus;
  leadType?: LeadType;
  addedBy: string;
  isActive: boolean;
  modificationHistory: Array<{
    note: string;
    timestamp: number;
    _id: string;
    id: string;
  }>;
  matches: PropertyMatch[];
  activityNotes: activityNotes[];
  createdAt: string;
  updatedAt: string;
  id: string;
  isProspect?: boolean;
};

export type Renter = {
  rentersNote: {
    text: string;
    timestamp: number;
  };
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType: PropertyType;
  bedroomCount: string;
  bathroomCount: string;
  havePet: boolean;
  petOwned: Pets;
  amenities: string[];
  financingType: FinancingType;
  preApproved: boolean;
  preApprovedAmount: number;
  maxRentalPrice: number;
  creditScore: string;
  annualHouseholdIncome: number;
  status: LeadStatus;
  leadType?: LeadType;
  voucher: string;
  voucherAmount: number;
  addedBy: string;
  isActive: boolean;
  modificationHistory: Array<{
    note: string;
    timestamp: number;
    _id: string;
    id: string;
  }>;
  matches: PropertyMatch[];
  activityNotes: activityNotes[];
  createdAt: string;
  updatedAt: string;
  id: string;
  isProspect?: boolean;
  property?: {
    id: string;
  };
};

type activityNotes = {
  _id: string;
  note: string;
  timestamp: number;
};
