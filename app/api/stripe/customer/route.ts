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

// POST - Create customer
export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await proxyToBackend(req, 'stripe/customer', {
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
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }

  const result = await proxyToBackend(req, `stripe/customer/${customerId}`, {
    method: 'GET',
  });

  return NextResponse.json(result.data, { 
    status: result.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}
