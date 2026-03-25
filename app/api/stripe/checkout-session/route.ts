import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/apiProxy';

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST - Create checkout session
export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await proxyToBackend(req, 'stripe/checkout-session', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return NextResponse.json(result.data, { 
    status: result.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}
