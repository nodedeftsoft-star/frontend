import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    // console.log("Request:", req);

    const body = await req.json();

    console.log("Bulk Update Body:", body);

    const response = await api.put(`/prospects/bulk-update/`, body, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error updating prospect:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to update prospect", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
