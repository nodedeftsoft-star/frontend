import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();
    const search = body.search || "";
    const status = body.status || "";
    const stage = body.stage || [];

    const queryParams = new URLSearchParams({
      ...(search && { searchText: search }),
      ...(search && { customerType: "Renter" }),
      ...(status && { status }),

      propertyMode: "for-rent",

      limit: 1000000,
    });

    if (stage.length > 0) {
      stage.forEach((stage: string) => {
        queryParams.append("stage", stage);
      });
    }
    console.log("QUERY PARAMS", queryParams);

    const response = await api.get(`/matches?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to fetch buyers" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching buyers:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to fetch buyers", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
