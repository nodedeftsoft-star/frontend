interface Activitynote {
  note: string;
  timestamp: number;
}

export type matchData = {
  _id: string;
  customer: {
    buyersNote: Activitynote;
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
      | "House_Townhome"
      | "Condos_Co_Ops"
      | "Lots_Land"
      | "Multi_Family"
      | "Commercial"
      | "House"
      | "Room";
    bedroomCount: string;
    bathroomCount: string;
    havePet: boolean;
    petOwned: "dog" | "cat" | "both" | "other";
    amenities: string[];
    financingType: string;
    preApproved: boolean;
    preApprovedAmount: number;
    voucher: string;
    voucherAmount: number;
    maxRentalPrice: number;
    maxPurchasePrice: number;
    status: string;
    addedBy: string;
    isActive: boolean;
    modificationHistory: {
      note: string;
      timestamp: number;
      _id: string;
      id: string;
    }[];
    matches: {
      property: string;
      matchKind: string;
      _id: string;
      id: string;
    }[];
    activityNotes: Activitynote[];
    createdAt: string;
    updatedAt: string;
    id: string;
  };
  property: {
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
    url: string;
    bathrooms: number;
    bedrooms: number;
    createdAt: string;
    description: string;
    homeType: string;
    inputURL: string;
    mode: string;
    neighborhood: string;
    parking: string;
    photos: string[];
    price: number;
    propertyStatus: string;
    salesNote: Activitynote[];
    updatedAt: string;
    id: string;
  };
  customerType: string;
  status: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  activityNotes: Activitynote[];
  id: string;
  stage: string;
};
