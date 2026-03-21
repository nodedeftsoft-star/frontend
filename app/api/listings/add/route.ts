import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log("Request:", req);

    const body = await req.json();
    const propertyData = body;

    //console.log("PROPERTY DATA:", propertyData);

    const response = await api.post("/listings/create-single", propertyData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 201) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add property" },
        { status: response.status }
      );
    }

    //console.log("PROPERTY ADDED:", response.data);

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error adding property:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to add property", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
