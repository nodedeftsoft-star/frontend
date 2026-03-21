import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";
import { LeadsBuyer } from "@/types/leads";

interface ApiError {
  response?: {
    data: {
      message: string;
    };
    status: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log("Request:", req);

    const body = await req.json();
    const leadsBuyerData: LeadsBuyer[] = body;

    //console.log("LEADS BUYER DATA:", leadsBuyerData);

    const response = await api.post("/leads/buyers/fast-bulk-add", leadsBuyerData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error("Error adding leads buyer:", error);

    if (apiError.response) {
      return NextResponse.json({ message: apiError.response.data.message }, { status: apiError.response.status });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
