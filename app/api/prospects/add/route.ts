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

interface RenterNote {
  text: string;
  timestamp: number;
}

interface ActivityNote {
  text: string;
  timestamp: number;
}

interface ProspectData {
  id?: string;
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
  listingUrl: string;
  rentersNote: RenterNote;
  brokerageName: string;
  brokeragePhoneNumber: string;
  brokerageEmail: string;
  annualHouseholdIncome: number;
  creditScore: number;
  maxRentalPrice: number;
  voucher: boolean;
  voucherAmount: number;
  activityNotes: ActivityNote[];
  prospectStatus: "prospect" | "active" | "closed";
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body = await req.json();
    const prospectData: ProspectData = body;

    console.log("PROSPECT DATA:", prospectData);

    const response = await api.post("/prospects/add", prospectData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    console.log("RESPONSE:", response.data);

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error adding prospect:", error);

    const apiError = error as ApiError;

    if (apiError.response) {
      return NextResponse.json({ message: apiError.response.data.message }, { status: apiError.response.status });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
