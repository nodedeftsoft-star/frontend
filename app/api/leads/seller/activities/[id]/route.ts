import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface leadsSellersActivites {
  note: string;
}

interface ApiError {
  response?: {
    data: {
      message: string;
    };
    status: number;
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;
    const { id } = await params;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log("Request:", req);

    const body = await req.json();
    const activities: leadsSellersActivites = body;

    //console.log("LEADS SELLER ACTIVITIES:", activities);

    const response = await api.post(`/leads/sellers/activities/${id}`, activities, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error("Error adding leads seller activity:", error);

    if (apiError.response) {
      return NextResponse.json({ message: apiError.response.data.message }, { status: apiError.response.status });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
