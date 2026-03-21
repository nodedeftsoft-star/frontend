import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    console.log("Request:", req);

    const body = await req.json();
    const { id, fullname, brokerageName, brokeragePhoneNumber, website, phoneNumber } = body;

    const userDetails = {
      firstname: fullname.split(" ")[0],
      lastname: fullname.split(" ")[1] || "",
      phoneNumber,
      brokerageName,
      brokeragePhoneNumber,
      website,
    };

    console.log("ID:", id);
    console.log("USER DETAILS:", userDetails);

    const response = await api.put(`/users/update/${id}`, userDetails, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    console.log("RESPONSE:", response);

    if (response.status !== 201 && response.status !== 200) {
      return NextResponse.json(
        { message: response.data.message || "Failed to update user" },
        { status: response.status }
      );
    }

    const updatedUser = response.data.data;

    // Update userDetails cookie with the new data
    const updatedUserDetails = {
      id: updatedUser?.id,
      email: updatedUser?.email,
      username: updatedUser?.username,
      firstName: updatedUser?.firstname,
      lastName: updatedUser?.lastname,
      brokerageName: updatedUser?.brokerageName,
      brokeragePhoneNumber: updatedUser?.brokeragePhoneNumber,
      website: updatedUser?.website,
      phoneNumber: updatedUser?.phoneNumber,
      createdAt: updatedUser?.createdAt,
    };

    const jsonResponse = NextResponse.json(response.data, { status: 201 });
    jsonResponse.headers.append(
      "Set-Cookie",
      serialize("userDetails", JSON.stringify(updatedUserDetails), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    );

    return jsonResponse;
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: "Failed to update user", error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
