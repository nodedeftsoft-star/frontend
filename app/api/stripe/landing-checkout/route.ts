import { NextRequest, NextResponse } from 'next/server';

// POST - Create landing checkout session (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:9177/api';

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://192.168.3.17:3001';

    const response = await fetch(`${BACKEND_API_URL}/stripe/landing-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: body.package,
        successUrl: body.successUrl || `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: body.cancelUrl || `${frontendUrl}/pricing`,
        metadata: body.metadata, // Forward metadata to backend
        userId: body.userId,
        customerId: body.customerId,
        email: body.email,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Landing checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
