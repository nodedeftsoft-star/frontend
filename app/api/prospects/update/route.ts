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
  prospectStatus: "prospect" | "pending" | "idle" | "matched";

  buyersNote: BuyerNote;
  status: "prospect" | "pending" | "idle" | "matched";
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log("Request:", req);

    const body: BuyerData = await req.json();
    //console.log("PROSPECT BODY:", body);
    const { id, ...prospectData } = body;

    console.log("ID:", id);
    console.log("PROSPECT DATA:", prospectData);
    // console.log("PROSPECT STATUS:", prospectStatus);

    const response = await api.put(`/prospects/update/${id}`, prospectData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error updating prospect:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to update prospect", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
