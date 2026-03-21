// Contact Type Definitions

export interface BuyerNote {
  text: string;
  timestamp: number;
}

export interface ActivityNote {
  note: string;
  timestamp: number;
  _id: string;
  id: string;
}

export interface ModificationHistory {
  note: string;
  timestamp: number;
  _id: string;
  id: string;
}

export interface Match {
  property: string;
  matchKind: "followUp" | "shown" | "potential" | "pending" | string;
  _id: string;
  activityNotes: ActivityNote[];
  id: string;
}

export interface ContactDetails {
  propertyAddress: string;
  propertyState: string;
  propertyCounty: string;
  propertyPrice: number;
  brokerName: string;
  brokerEmail: string;
  brokerPhoneNumber: string;
  prospectType: string;
  annualHouseholdIncome: number;
  creditScore: string;
  buyersNote: BuyerNote;
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType:
    | "Apartment"
    | "House/Townhouse"
    | "House_Townhome"
    | "Condos_Co_Ops"
    | "Lots_Land"
    | "Multi_Family"
    | "Commercial"
    | "House"
    | "Room"
    | string;
  bedroomCount: string;
  bathroomCount: string;
  havePet: boolean;
  petOwned?: "dog" | "cat" | "both" | "other" | "service animal";
  amenities: string[];
  financingType: "cash" | "mortgage" | "others" | string;
  preApproved: boolean;
  preApprovedAmount?: number;
  voucher?: string;
  voucherAmount?: number;
  maxRentalPrice?: number;
  maxPurchasePrice?: number;
  status: "prospect" | "active" | "inactive" | string;
  addedBy: string;
  isActive: boolean;
  modificationHistory: ModificationHistory[];
  matches: Match[];
  activityNotes: ActivityNote[];
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface Contact {
  _id: string;
  contact: ContactDetails;
  contactType: "Buyer" | "Seller" | "Renter" | "Landlord" | string;
  status: "active" | "inactive" | string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}

// Additional type for creating a new contact (without generated fields)
export interface CreateContactInput {
  contact: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    adultCount?: number;
    childrenCount?: number;
    targetAreas?: string[];
    propertyType?: string;
    bedroomCount?: string;
    bathroomCount?: string;
    havePet?: boolean;
    petOwned?: "dog" | "cat" | "both" | "other";
    amenities?: string[];
    financingType?: string;
    preApproved?: boolean;
    preApprovedAmount?: number;
    voucher?: string;
    voucherAmount?: number;
    maxRentalPrice?: number;
    maxPurchasePrice?: number;
    status?: string;
  };
  contactType: "Buyer" | "Seller" | "Renter" | "Landlord";
}

// Type for updating contact
export interface UpdateContactInput extends Partial<CreateContactInput> {
  _id: string;
}

export default Contact;
