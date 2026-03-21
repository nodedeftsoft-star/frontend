import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function DELETE(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const { matchIds } = body;

    //console.log('MATCH IDS', matchIds);
    //console.log('AUTH TOKEN', closr_authToken);

    if (!matchIds || !Array.isArray(matchIds)) {
      return NextResponse.json({ message: "Invalid request - matchIds array required" }, { status: 400 });
    }

    // Delete each buyer
    const deletePromises = matchIds.map((id) =>
      api.delete(`/matches/${id}`, {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ message: "Matches deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting matches:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to delete matches", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
