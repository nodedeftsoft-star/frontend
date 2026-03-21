import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface RenterNote {
  text: string;
  timestamp: number;
}

interface RenterData {
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
  annualHouseholdIncome: number;
  creditScore: number[];
  maxRentalPrice: number;
  rentersNote: RenterNote;
  status: "prospect" | "active" | "matched" | "idle";
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body: RenterData = await req.json();
    const { _id, ...renterDataWithoutId } = body;

    console.log("ID:", _id);
    console.log("BUYER DATA:", renterDataWithoutId);

    const response = await api.put(`/renters/update/${_id}`, renterDataWithoutId, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to update renter" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error updating renter:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to update renter", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
