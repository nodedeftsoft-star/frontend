import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { renterIds } = body;

    //console.log('RENTER IDS', renterIds);
    //console.log('AUTH TOKEN', closr_authToken);

    if (!renterIds || !Array.isArray(renterIds)) {
      return NextResponse.json({ message: "Invalid request - renterIds array required" }, { status: 400 });
    }

    // Delete each renter
    const deletePromises = renterIds.map((id) =>
      api.delete(`/renters/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "Renters deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting renters:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete renters", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
