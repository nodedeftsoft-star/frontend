import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    //console.log('Request:', req);

    const { email, resetCode, newPassword } = await req.json();
    //console.log('Email:', email);
    const { data } = await api.post("/users/complete-password-reset", {
      email,
      resetCode,
      newPassword,
    });

    if (!data.success) {
      return NextResponse.json({ message: data.message }, { status: 401 });
    }

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
