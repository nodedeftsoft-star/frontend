import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const { data } = await api.post("/user/login", { email, password });

    if (!data.success) {
      return NextResponse.json({ message: data.message }, { status: 401 });
    }

    const { token, user } = data.data;

    // Set HTTP-only secure cookie for auth token
    const response = NextResponse.json({ message: "Login successful", user });
    response.headers.set(
      "Set-Cookie",
      serialize("closr_authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from "strict" to "lax" to allow cookies after external redirects (e.g., Stripe)
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    );

    console.log("User details to be stored in cookie:", user);

    // Add user details in a separate cookie (non-httpOnly so it's accessible by client)
    const userDetails = {
      id: user?.id,
      email: user?.email,
      username: user?.username,
      firstName: user?.firstname,
      lastName: user?.lastname,
      brokerageName: user?.brokerageName,
      brokeragePhoneNumber: user?.brokeragePhoneNumber,
      website: user?.website,
      phoneNumber: user?.phoneNumber,
      createdAt: user?.createdAt,
    };

    response.headers.append(
      "Set-Cookie",
      serialize("userDetails", JSON.stringify(userDetails), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from "strict" to "lax" to allow cookies after external redirects (e.g., Stripe)
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    );

    return response;
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

export async function DELETE() {
  // Logout by clearing both cookies
  const response = NextResponse.json({ message: "Logged out" });
  response.headers.set(
    "Set-Cookie",
    [
      serialize("closr_authToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      }),
      serialize("userDetails", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      }),
    ].join("; ")
  );
  return response;
}
