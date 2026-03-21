import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    // Get query parameters
    const body = await req.json();

    const search = body.search || "";
    const status = body.status || "";
    const type = body.type || "";
    const propertyId = body.propertyId || "";
    const queryParams = new URLSearchParams({
      ...(search && { searchText: search }),
      ...(status && { prospectStatus: status }),
      ...(type && { prospectType: type }),
      ...(propertyId && { property: propertyId }),
      limit: 1000000,
    });

    //console.log("QUERY PARAMS", queryParams);

    const response = await api.get(`/prospects?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to fetch prospects" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching prospects:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to fetch prospects", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
