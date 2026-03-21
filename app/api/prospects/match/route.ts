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
  listingUrl: string;
  propertyId: string;
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

    //console.log("Request:", req);

    const body = await req.json();
    const prospects: ProspectData[] = body.prospects;
    const listingId: string = body.listing;
    const prospectType: string = body.prospectType;
    //console.log("PROSPECTS:", prospects);
    //console.log("LISTING ID:", listingId);

    const results = [];
    const errors = [];

    for (const prospect of prospects) {
      try {
        const response = await api.post(
          "/prospects/add",
          {
            ...prospect,
            property: listingId,
            prospectType: prospectType,
          },
          {
            headers: {
              Authorization: `Bearer ${closr_authToken}`,
            },
          }
        );

        const deleteEndpoint =
          prospectType.toLowerCase() === "buyer" ? `/buyers/${prospect.id}` : `/renters/${prospect.id}`;

        try {
          await api.delete(deleteEndpoint, {
            headers: {
              Authorization: `Bearer ${closr_authToken}`,
            },
          });
          //console.log(`Successfully deleted ${prospectType.toLowerCase()} with ID: ${prospect.id}`);
        } catch (deleteError) {
          console.error(`Failed to delete ${prospectType.toLowerCase()} with ID: ${prospect.id}`, deleteError);
        }

        results.push({
          success: true,
          data: response.data,
          originalId: prospect.id,
        });
      } catch (prospectError) {
        console.error(`Failed to create prospect for ${prospect.email}:`, prospectError);
        errors.push({
          success: false,
          error: prospectError instanceof Error ? prospectError.message : "Unknown error",
          originalId: prospect.id,
          email: prospect.email,
        });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          message: "All prospects failed to create",
          errors: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully processed ${results.length} prospects${
          errors.length > 0 ? `, ${errors.length} failed` : ""
        }`,
        successes: results,
        failures: errors,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Error adding prospect:", apiError?.response?.data);

    if (apiError?.response?.data) {
      return NextResponse.json(
        {
          message: apiError.response.data.message,
          error: apiError.response.data,
        },
        { status: apiError.response.status || 400 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
