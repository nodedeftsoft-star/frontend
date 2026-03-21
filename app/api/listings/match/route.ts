import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();

    //console.log('BODY:', body);

    // const targetAreas = body.targetAreas.join(' ');

    const allowsCats = body.havePet && (body.petOwned == "both" || body.petOwned == "cat") ? "Yes" : "No";

    const allowsDogs = body.havePet && (body.petOwned == "both" || body.petOwned == "dog") ? "Yes" : "No";

    const pool = body.amenities && body.amenities.includes("swimmingPool") ? "Yes" : "No";
    const laundry = body.amenities && body.amenities.includes("laundryInBuilding") ? "Yes" : "No";

    const queryParams = new URLSearchParams();

    // Handle home types - if House/Townhouse, add multiple home type parameters
    if (body.homeType === "Condo/Co-op") {
      // Add each home type as a separate parameter with the same key
      ["Condo", "Condo/Co-op", "Manufactured Home", "Mobile Home", "Other", "Auction"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "House/Townhouse") {
      ["House/Townhouse", "Other", "Auction"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "Commercial") {
      ["Commercial", "Other"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "Lot/Land") {
      ["Lot/Land", "Other"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "Multi-Family") {
      ["Duplex", "Multi-Family", "Other", "Quadruplex", "Triplex"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "Room") {
      ["Room"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "Apartment") {
      ["Apartment"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    } else if (body.homeType === "House") {
      ["House"].forEach((type) => {
        queryParams.append("homeType", type);
      });
    }

    // Add all other parameters
    if (body.price) queryParams.append("price", body.price.toString());
    if (body.bedrooms) queryParams.append("bedrooms", body.bedrooms.toString());
    if (body.bathrooms) queryParams.append("bathrooms", body.bathrooms.toString());
    if (body.targetAreas && body.targetAreas.length > 0)
      body.targetAreas.forEach((area: string) => {
        queryParams.append("targetAreas", area);
      });
    if (body.havePet && allowsCats === "Yes") queryParams.append("petFriendly.allowsCats", allowsCats);
    if (body.havePet && allowsDogs === "Yes") queryParams.append("petFriendly.allowsLargeDogs", allowsDogs);
    if (pool === "Yes") queryParams.append("amenities.pool", pool);
    if (laundry === "Yes") queryParams.append("amenities.laundry", laundry);
    if (body.mode === "for-rent") queryParams.append("mode", "for-rent");
    if (body.mode === "for-sale") queryParams.append("mode", "for-sale");
    queryParams.append("limit", "100");

    //console.log('QUERY PARAMS:', queryParams);

    const response = await api.get(`/listings/matches?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log('RESPONSE:', response.data.data.properties);

    if (response.status !== 200) {
      return NextResponse.json(
        {
          message: response.data.message || "Failed to fetch matching properties",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching matching properties:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: "Failed to fetch matching properties",
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
