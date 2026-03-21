import { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Backend API URL (server-side only, not exposed to client)
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://192.168.3.17:9177/api/";

export async function proxyToBackend(req: NextRequest, endpoint: string, options: RequestInit = {}) {
  // Get the auth token from HTTP-only cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("closr_authToken")?.value;

  if (!token) {
    return {
      error: true,
      status: 401,
      data: {
        success: false,
        message: "Unauthorized - Please log in",
        data: null,
      },
    };
  }

  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  try {
    // Make request to backend
    const url = `${BACKEND_API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    return {
      error: !response.ok,
      status: response.status,
      data,
    };
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to backend";
    return {
      error: true,
      status: 500,
      data: {
        success: false,
        message: errorMessage,
        data: null,
      },
    };
  }
}
