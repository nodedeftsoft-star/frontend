import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    console.log("Request:", req);

    const body = await req.json();
    const { id } = body;

    const details = {
      isActive: false,
    };

    console.log("ID:", id);
    console.log("USER DETAILS:", details);

    const response = await api.put(`/users/set-active/${id}`, details, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    console.log("RESPONSE:", response);

    if (response.status !== 201 && response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to update user" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to update user", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
