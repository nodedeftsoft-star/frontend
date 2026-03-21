import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function getUserFromToken(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('closr_authToken')?.value;
    
    if (!token) {
      return null;
    }

    // Decode JWT token to get user ID
    const decoded = jwt.decode(token) as { id: string; email?: string };
    
    if (!decoded || !decoded.id) {
      console.error('Invalid token format');
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email || 'user@example.com'
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}
