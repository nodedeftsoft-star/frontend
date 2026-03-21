import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { leadLandlordsIds } = body;

    //console.log("LEAD landlord IDS", leadLandlordsIds);

    if (!leadLandlordsIds || !Array.isArray(leadLandlordsIds)) {
      return NextResponse.json({ message: "Invalid request - landlordIds array required" }, { status: 400 });
    }

    // Delete each landlord
    const deletePromises = leadLandlordsIds.map((id) =>
      api.delete(`/leads/landlords/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "landlords deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting lead landlords:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete landlords", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
