import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;
    const { id } = await params;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: "Leads Buyer ID is required" }, { status: 400 });
    }

    const response = await api.get(`/leads/buyers/${id}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to fetch leads buyer" },
        { status: response.status }
      );
    }

    //console.log("LEADS BUYER DATA", response.data);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching leads buyer:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to fetch leads buyer", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
