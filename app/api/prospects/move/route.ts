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
    const { id, moveTo } = body;

    const urlParams = {
      moveTo: moveTo,
    };

    console.log("DETAILS:", id, moveTo);

    const response = await api.post(`/prospects/move/${id}`, urlParams, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    console.log("PROSPECT MOVE RESPONSE:", response);
    console.log("PROSPECT MOVE RESPONSE DATA:", response.data.data.prospects);

    if (response.status >= 200 && response.status < 300) {
      return NextResponse.json(response.data, { status: response.status });
    }

    return NextResponse.json({ message: "Failed to move prospect", error: response.data }, { status: response.status });
  } catch (error) {
    console.error("Error moving prospect:", error);
    // Handle axios errors with response from server
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response: {
          data?: {
            message?: string;
            success?: boolean;
            error?: unknown;
            [key: string]: unknown;
          };
          status?: number;
        };
      };
      const errorMessage = axiosError.response.data?.message || "Failed to move prospect";
      const errorData = axiosError.response.data || {};

      return NextResponse.json(
        {
          message: errorMessage,
          ...errorData,
        },
        { status: axiosError.response.status || 400 }
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to move prospect", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
