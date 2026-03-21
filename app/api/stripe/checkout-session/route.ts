import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/apiProxy';

// POST - Create checkout session
export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await proxyToBackend(req, 'stripe/checkout-session', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return NextResponse.json(result.data, { status: result.status });
}
