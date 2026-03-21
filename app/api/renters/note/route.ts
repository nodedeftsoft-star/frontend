import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

interface NoteData {
  renterId: string;
  note: string;
}

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    //console.log('Request:', req);

    const body: NoteData = await req.json();
    const { renterId, note } = body;

    //console.log('RENTER ID:', renterId);
    //console.log('NOTE:', note);

    const noteData = {
      note: note,
    };

    //console.log('NOTE DATA:', noteData);

    const response = await api.post(`/renters/activities/${renterId}`, noteData, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log('RESPONSE:', response);

    if (response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to add activity note" },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error adding activity note:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to add activity note", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
