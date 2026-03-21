import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface MatchData {
  property: string;
  matchKind: string;
  id: string;
  customer: string;
  customerType: string;
  status: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body = await req.json();
    const matchData: MatchData = body;

    //console.log('MATCH DATA:', matchData);

    const response = await api.post("/matches/add", matchData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 201) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add match" },
        { status: response.status }
      );
    }

    //console.log('MATCH ADDED:', response.data);

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error adding match:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to add match", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
