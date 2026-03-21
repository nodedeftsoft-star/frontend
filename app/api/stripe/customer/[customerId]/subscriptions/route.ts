import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET - List customer subscriptions
export async function GET(req: NextRequest ) {
  // const { customerId } = await params;

  const result = await proxyToBackend(req, `stripe/user/subscriptions`, {
    method: "GET",
  });

  return NextResponse.json(result.data, { status: result.status });
}
