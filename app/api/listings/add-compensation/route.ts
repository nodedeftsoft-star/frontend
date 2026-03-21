import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function PUT(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body = await req.json();
    const { propertyId, compensation } = body;

    //console.log('PROPERTY ID:', propertyId);
    //console.log("PROPERTY Componsation:", compensation);

    const response = await api.put(
      `/listings/${propertyId}/add-compensation`,
      { compensation: compensation },
      {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      }
    );

    if (response.status !== 201 && response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add property" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error adding property:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to add property", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
