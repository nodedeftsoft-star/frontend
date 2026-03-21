import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET - Get subscription
export async function GET(req: NextRequest, { params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  const result = await proxyToBackend(req, `stripe/subscription/${subscriptionId}`, {
    method: "GET",
  });

  return NextResponse.json(result.data, { status: result.status });
}

// DELETE - Cancel subscription
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  const result = await proxyToBackend(req, `stripe/subscription/${subscriptionId}`, {
    method: "DELETE",
  });

  return NextResponse.json(result.data, { status: result.status });
}
