import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { buyerIds } = body;

    //console.log('BUYER IDS', buyerIds);
    //console.log('AUTH TOKEN', closr_authToken);

    if (!buyerIds || !Array.isArray(buyerIds)) {
      return NextResponse.json({ message: "Invalid request - buyerIds array required" }, { status: 400 });
    }

    // Delete each buyer
    const deletePromises = buyerIds.map((id) =>
      api.delete(`/buyers/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "Buyers deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting buyers:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete buyers", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
