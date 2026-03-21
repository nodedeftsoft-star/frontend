export enum Amenities {
  ParkingSpace = "parkingSpace",
  PetFriendly = "petFriendly",
  Surveillance = "surveillance",
  LaundryInBuilding = "laundryInBuilding",
  LaundryInUnit = "laundryInUnit",
  OutdoorSpace = "outdoorSpace",
  SwimmingPool = "swimmingPool",
  FitnessCenter = "fitnessCenter",
}
export enum FinancingType {
  Mortgage = "mortgage",
  Cash = "cash",
}
export enum LeadStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export enum LeadType {
  Hot = "Hot",
  Cold = "Cold",
}

export enum Pets {
  Dog = "dog",
  Cat = "cat",
  Other = "other",
  No = "no",
  ServiceAnimal = "service animal",
}

export enum PropertyType {
  House_Townhouse = "House/Townhouse",
  Other = "Other",
  Auction = "Auction",
  Condo = "Condo",
  Condos_Co_op = "Condo/Co-op",
  Manufactured_Home = "Manufactured Home",
  Mobile_Home = "Mobile Home",
  Lots_Land = "Lot/Land",
  Duplex = "Duplex",
  Multi_Family = "Multi-Family",
  Quadruplex = "Quadruplex",
  Triplex = "Triplex",
  Commercial = "Commercial",
  House = "House", // "for-rent" property type
  Room = "Room", // "for-rent" property type
  Apartment = "Apartment", // "for-rent" property type
}

export type Match = {
  id: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
    parentRegionName: string;
  };
  property: Match;
  amenities: {
    parking: string;
    pool: string;
    laundry: string;
  };
  attribution: {
    brokerName: string;
    brokerContactInfo: string;
    agentName: string;
    agentContactInfo: string;
  };
  url: string;
  description: string;
  price: number;
  homeType: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  photos: string[];
  neighborhood: string;
  mode: "for-sale" | "for-rent";
  salesNote: string[];
  createdAt: string;
  updatedAt: string;
  matchKind?: string;
  activityNotes?: {
    note: string;
    timestamp: number;
  }[];
  petFriendly?: {
    allowsLargeDogs: string;
    allowsCats: string;
  };
};

export type Property = {
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
    parentRegionName: string;
  };
  amenities: {
    parking: string;
    pool: string;
    laundry: string;
  };
  attribution: {
    brokerName: string;
    brokerContactInfo: string;
    agentName: string;
    agentContactInfo: string;
  };
  _id: string;
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
  inputURL: string;
  mode: "for-sale" | "for-rent";
  propertyStatus: string;
  salesNote: string[];
  createdAt: string;
  updatedAt: string;
  id: string;
};

export type PropertyMatch = {
  property: Property;
  matchKind: "potential" | "followUp" | "pending" | "shown" | "dead";
  _id: string;
  id: string;
};
