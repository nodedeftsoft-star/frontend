import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body = await req.json();
    const { matchId, matchStatus } = body;

    //console.log('MATCH ID:', matchId);
    //console.log('MATCH STATUS:', matchStatus);

    const response = await api.put(
      `/matches/${matchId}/change-status`,
      { status: matchStatus },
      {
        headers: {
          Authorization: `Bearer ${closr_authToken}`,
        },
      }
    );

    if (response.status !== 201) {
      return NextResponse.json(
        { message: response.data.message || "Failed to change status" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error changing status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to change status", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
