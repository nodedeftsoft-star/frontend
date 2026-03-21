import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";
import { AxiosError } from "axios";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstname, lastname, username } = await req.json();

    const { data } = await api.post("/user/register", {
      email,
      password,
      firstname,
      lastname,
      username,
    });

    //console.log("USER DETAILS:", data);

    if (!data.success) {
      return NextResponse.json({ message: data.message }, { status: 400 });
    }

    const { user } = data.data;

    // Store token in HTTP-only cookie
    const response = NextResponse.json({ message: "Signup successful", user });

    return response;
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
