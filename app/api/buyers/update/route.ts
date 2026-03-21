import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface BuyerNote {
  text: string;
  timestamp: number;
}

interface BuyerData {
  id: string;
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
  status: "prospect" | "pending" | "idle" | "matched";
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body: BuyerData = await req.json();
    const { id, ...buyerDataWithoutId } = body;

    //console.log('ID:', id);
    //console.log('BUYER DATA:', buyerDataWithoutId);

    const response = await api.put(`/buyers/update/${id}`, buyerDataWithoutId, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log('RESPONSE:', response);

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add buyer" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error adding buyer:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to add buyer", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
