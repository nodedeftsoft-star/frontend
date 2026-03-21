import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { leadSellersIds } = body;

    //console.log("LEAD SELLERS IDS", leadSellersIds);

    if (!leadSellersIds || !Array.isArray(leadSellersIds)) {
      return NextResponse.json({ message: "Invalid request - sellerIds array required" }, { status: 400 });
    }

    // Delete each seller
    const deletePromises = leadSellersIds.map((id) =>
      api.delete(`/leads/sellers/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "Sellers deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting lead sellers:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete sellers", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
