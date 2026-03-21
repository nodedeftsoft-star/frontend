import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  try {
    const { email, verificationCode, password } = await req.json();

    const { data } = await api.post("/users/verify-email", {
      email,
      verificationCode,
    });

    if (!data.success) {
      return NextResponse.json({ message: data.message }, { status: 400 });
    }

    // After successful verification, auto-login the user
    try {
      const loginResponse = await api.post("/user/login", { email, password });

      if (!loginResponse.data.success) {
        return NextResponse.json(
          { message: "Email verified but login failed. Please login manually." },
          { status: 400 }
        );
      }

      const { token, user } = loginResponse.data.data;

      // Create response with success message
      const response = NextResponse.json({
        message: "Email Verified Successfully",
        user,
        success: true,
      });

      // Set HTTP-only secure cookie for auth token
      response.headers.set(
        "Set-Cookie",
        serialize("closr_authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      );

      // Add user details in a separate cookie (non-httpOnly so it's accessible by client)
      const userDetails = {
        id: user?.id,
        email: user?.email,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
      };

      response.headers.append(
        "Set-Cookie",
        serialize("userDetails", JSON.stringify(userDetails), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      );

      return response;
    } catch (_loginError) {
      // If login fails, still return success for email verification
      return NextResponse.json({
        message: "Email verified successfully. Please login to continue.",
        success: true,
        requiresLogin: true,
      });
    }
  } catch (error) {
    // Check if it's an Axios error
    if (error instanceof AxiosError && error.response?.data) {
      //console.log("ERROR", error.response.data);

      const errorMessage = error.response.data.message;

      if (errorMessage?.includes("duplicate key error") || errorMessage?.includes("email_1 dup key")) {
        return NextResponse.json({ message: "Email already exists" }, { status: 400 });
      }

      if (errorMessage?.includes("User validation failed: username: Username Exists or Is Invalid")) {
        return NextResponse.json({ message: "Username already exists" }, { status: 400 });
      }

      return NextResponse.json({ message: errorMessage || "Signup failed" }, { status: 500 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message || "Signup failed" }, { status: 500 });
    }

    //console.log("An unexpected error occurred");

    return NextResponse.json({ message: "An unexpected error occurred during signup" }, { status: 500 });
  }
}
