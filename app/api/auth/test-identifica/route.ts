import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test endpoint is working!',
    path: '/api/auth/test-identifica'
  });
}
