import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyIds } = body;

    //console.log('PROPERTY IDS', propertyIds);

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json({ message: "Invalid request - propertyIds array required" }, { status: 400 });
    }

    const _response = await api.delete("/listings", {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
      data: { ids: propertyIds },
    });

    //console.log('RESPONSE', response);

    return NextResponse.json({ message: "Properties deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting properties:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete properties", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
