import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/apiProxy';

// GET - Get customer by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  const result = await proxyToBackend(req, `stripe/customer/${customerId}`, {
    method: 'GET',
  });

  return NextResponse.json(result.data, { status: result.status });
}
