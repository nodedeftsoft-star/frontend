import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const response = await api.get(`/listings/stats`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to fetch stats" },
        { status: response.status }
      );
    }

    //console.log('RESPONSE', JSON.stringify(response.data));

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching stats:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to fetch stats", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
