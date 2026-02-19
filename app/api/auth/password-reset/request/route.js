// POST /api/auth/password-reset/request
// Request password reset (sends email)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/auth/password-reset';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, isActive: true },
    });
    
    // Don't reveal if user exists (security best practice)
    // Return success even if user doesn't exist (prevent email enumeration)
    if (!user || !user.isActive) {
      return NextResponse.json({ 
        message: 'If an account exists, a password reset email has been sent.' 
      });
    }
    
    // Generate reset token
    const { token, expiresAt } = await generatePasswordResetToken(user.id);
    
    // Send email (implement this)
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails (token is still valid)
      // In production, you might want to log this to a monitoring service
    }
    
    return NextResponse.json({ 
      message: 'If an account exists, a password reset email has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

