// POST /api/auth/password-reset/reset
// Reset password with token

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyPasswordResetToken, markPasswordResetTokenAsUsed } from '@/lib/auth/password-reset';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Verify token
    const resetToken = await verifyPasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    
    // Mark token as used
    await markPasswordResetTokenAsUsed(resetToken.id);
    
    // Revoke all existing sessions (force re-login)
    await prisma.session.updateMany({
      where: { userId: resetToken.userId },
      data: { isRevoked: true },
    });
    
    return NextResponse.json({ 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

