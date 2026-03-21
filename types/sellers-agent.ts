import { Amenities, PropertyType } from "./shared";

export type propertyData = {
  id: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
    parentRegionName: string;
  };
  amenities: Amenities[];
  owner: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
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
  homeType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  photos: string[];
  neighborhood: string;
  mode: "for-sale" | "for-rent";
  salesNote: { text: string; timestamp: number }[];
  createdAt: string;
  updatedAt: string;
  propertyStatus: string;
  petFriendly?: {
    allowsCats: string;
    allowsLargeDogs: string;
  };
};
