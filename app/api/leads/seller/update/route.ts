import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";
import { LeadsSeller } from "@/types/leads";

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

    const body: LeadsSeller = await req.json();
    const { _id, ...sellerDataWithoutId } = body;

    //console.log("ID:", _id);
    //console.log("seller DATA:", sellerDataWithoutId);

    const response = await api.put(`/leads/sellers/update/${_id}`, sellerDataWithoutId, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log("RESPONSE:", response);

    // if (response.status !== 201) {
    //   return NextResponse.json(
    //     { message: response.data.message || "Failed to update seller" },
    //     { status: response.status }
    //   );
    // }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error("Error updating leads seller:", error);

    if (apiError.response) {
      return NextResponse.json({ message: apiError.response.data.message }, { status: apiError.response.status });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
