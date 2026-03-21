import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('closr_authToken')?.value;
    
    if (!token) {
      console.log('No user found, returning 401');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Found token:', token);

    // Get user's subscription from backend
    console.log('Fetching subscription from backend...');
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });
    
    const subscriptionData = await fetch(`${process.env.BACKEND_API_URL}/user/subscription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Subscription response status:', subscriptionData.status);
    console.log('Subscription response ok:', subscriptionData.ok);

    if (!subscriptionData.ok) {
      console.log('Subscription fetch failed, returning error');
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscription' },
        { status: subscriptionData.status }
      );
    }

    const subscription = await subscriptionData.json();
    console.log('Subscription data:', subscription);
    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
