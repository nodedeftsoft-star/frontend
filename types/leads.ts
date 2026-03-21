import { Amenities, FinancingType, LeadStatus, LeadType, Pets, PropertyType } from "./shared";

export interface LeadsBuyer {
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
  amenities: Amenities[];
  financingType: FinancingType;
  preApproved: boolean;
  preApprovedAmount: number;
  maxPurchasePrice: number;
  buyersNote: {
    text: string;
    timestamp: number;
  };
  status: LeadStatus;
  isActive: boolean;
  activityNotes: { note: string; timestamp: number }[];
  modificationHistory: { note: string; timestamp: number }[];
  leadType: LeadType;
  isSigned: boolean;
  updatedAt: string;
  _id?: string;
}

export interface LeadsLandLord {
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
  amenities: Amenities[];
  financingType: FinancingType;
  preApproved: boolean;
  preApprovedAmount: number;
  propertyPrice: number;
  sellersNote: {
    text: string;
    timestamp: number;
  };
  status: LeadStatus;
  isActive: boolean;
  activityNotes: { note: string; timestamp: number }[];
  modificationHistory: { note: string; timestamp: number }[];
  leadType: LeadType;
  isSigned: boolean;
  propertyAddress: string;
  propertyCounty: string;
  propertyState: string;
  propertyZipcode: string;
  propertyNeighborhood: string;
  propertyURL: string;
  description: string;
  updatedAt: string;
  _id?: string;
}

export interface LeadsRenter {
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
  amenities: Amenities[];
  havePet: boolean;
  petOwned: Pets;

  maxRentalPrice: number;
  annualHouseholdIncome: number;
  creditScore: string;
  rentersNote: {
    text: string;
    timestamp: number;
  };
  status: LeadStatus;
  voucher: string;
  voucherAmount: number;
  isActive: boolean;
  activityNotes: { note: string; timestamp: number }[];
  modificationHistory: { note: string; timestamp: number }[];
  leadType: LeadType;
  isSigned: boolean;
  updatedAt: string;
  _id?: string;
}

export interface LeadsSeller {
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
  amenities: Amenities[];
  financingType: FinancingType;
  preApproved: boolean;
  preApprovedAmount: number;
  propertyPrice: number;
  sellersNote: {
    text: string;
    timestamp: number;
  };
  status: LeadStatus;
  isActive: boolean;
  activityNotes: { note: string; timestamp: number }[];
  modificationHistory: { note: string; timestamp: number }[];
  leadType: LeadType;
  isSigned: boolean;
  propertyAddress: string;
  propertyCounty: string;
  propertyState: string;
  propertyZipcode: string;
  propertyNeighborhood: string;
  propertyURL: string;
  description: string;
  updatedAt: string;
  _id?: string;
}

export interface BulkImportTemplate {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  leadType?: string;
  propertyAddress?: string;
  propertyCounty?: string;
  propertyZipcode?: string;
}
