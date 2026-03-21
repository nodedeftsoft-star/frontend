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

    const { propertyId, matchKind, id } = body;

    //console.log('ID:', id);
    //console.log('PROPERTYID:', propertyId);
    //console.log('MATCHKIND:', matchKind);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing buyer ID",
          data: null,
        },
        { status: 400 }
      );
    }

    const bodyData = {
      propertyId,
      matchKind,
    };

    // Make API call
    const response = await api.put(`/renters/update-match/${id}`, bodyData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log('RESPONSE:', response);

    if (response.status !== 201) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add matches" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error in /api/buyers/match:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          data: null,
          error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
