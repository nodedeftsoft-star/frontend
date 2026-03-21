import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { leadRentersIds } = body;

    //console.log("LEAD RENTER IDS", leadRentersIds);

    if (!leadRentersIds || !Array.isArray(leadRentersIds)) {
      return NextResponse.json({ message: "Invalid request - renterIds array required" }, { status: 400 });
    }

    // Delete each renter
    const deletePromises = leadRentersIds.map((id) =>
      api.delete(`/leads/renters/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "Renters deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting lead renters:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete renters", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
