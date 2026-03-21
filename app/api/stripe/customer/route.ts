import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/apiProxy';

// POST - Create customer
export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await proxyToBackend(req, 'stripe/customer', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return NextResponse.json(result.data, { status: result.status });
}

// GET - Get customer (expects customerId as query param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Customer ID is required',
        data: null,
      },
      { status: 400 }
    );
  }

  const result = await proxyToBackend(req, `stripe/customer/${customerId}`, {
    method: 'GET',
  });

  return NextResponse.json(result.data, { status: result.status });
}
