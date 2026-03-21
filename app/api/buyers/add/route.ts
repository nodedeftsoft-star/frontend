import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface ApiError {
  response?: {
    data: {
      message: string;
    };
    status: number;
  };
}

interface BuyerNote {
  text: string;
  timestamp: number;
}

interface BuyerData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  targetAreas: string[];
  propertyType:
    | "Apartment"
    | "House"
    | "Condos_Co_Ops"
    | "Townhouse"
    | "House_Townhome"
    | "Commercial"
    | "Multi_Family";
  bedroomCount: number;
  bathroomCount: number;
  havePet: boolean;
  petOwned?: string;
  amenities: string[];
  financingType: "cash" | "mortgage" | "other";
  preApproved: boolean;
  preApprovedAmount: number;
  maxPurchasePrice: number;
  buyersNote: BuyerNote;
  status: "prospect" | "active" | "closed";
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body = await req.json();
    const buyerData: BuyerData = body;

    //console.log('BUYER DATA:', buyerData);

    const response = await api.post("/buyers/add", buyerData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error("Error adding buyer:", error);

    if (apiError.response) {
      return NextResponse.json({ message: apiError.response.data.message }, { status: apiError.response.status });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
