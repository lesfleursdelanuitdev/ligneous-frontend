/**
 * Password Reset Utilities
 * Functions for generating and verifying password reset tokens
 */

import crypto from 'crypto';
import { prisma } from '../database/prisma.js';

const TOKEN_EXPIRY_HOURS = 24; // 24 hours

/**
 * Generate a secure password reset token
 * @param {string} userId - User ID
 * @returns {Promise<{token: string, expiresAt: Date}>}
 */
export async function generatePasswordResetToken(userId) {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
  
  // Create token record
  const resetToken = await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
  
  return { token, expiresAt };
}

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @returns {Promise<{id: string, userId: string, expiresAt: Date} | null>}
 */
export async function verifyPasswordResetToken(token) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  
  if (!resetToken) {
    return null; // Token not found
  }
  
  if (resetToken.usedAt) {
    return null; // Token already used
  }
  
  if (resetToken.expiresAt < new Date()) {
    return null; // Token expired
  }
  
  // Check if user is still active
  if (!resetToken.user.isActive) {
    return null; // User is inactive
  }
  
  return {
    id: resetToken.id,
    userId: resetToken.userId,
    expiresAt: resetToken.expiresAt,
  };
}

/**
 * Mark password reset token as used
 * @param {string} tokenId - Password reset token ID
 */
export async function markPasswordResetTokenAsUsed(tokenId) {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

/**
 * Send password reset email
 * TODO: Implement with email service (SendGrid, AWS SES, etc.)
 * 
 * @param {string} email - User email
 * @param {string} token - Reset token
 */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/reset-password?token=${token}`;
  
  // TODO: Implement email sending
  // For now, log the URL (remove in production)
  console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);
  
  // Example with SendGrid (uncomment and configure):
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // 
  // await sgMail.send({
  //   to: email,
  //   from: process.env.FROM_EMAIL || 'noreply@ligneous.com',
  //   subject: 'Reset Your Password',
  //   html: `
  //     <h1>Reset Your Password</h1>
  //     <p>Click the link below to reset your password:</p>
  //     <a href="${resetUrl}">${resetUrl}</a>
  //     <p>This link will expire in 24 hours.</p>
  //   `,
  // });
  
  // Example with AWS SES (uncomment and configure):
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({ region: 'us-east-1' });
  // 
  // await ses.sendEmail({
  //   Source: process.env.FROM_EMAIL || 'noreply@ligneous.com',
  //   Destination: { ToAddresses: [email] },
  //   Message: {
  //     Subject: { Data: 'Reset Your Password' },
  //     Body: {
  //       Html: {
  //         Data: `
  //           <h1>Reset Your Password</h1>
  //           <p>Click the link below to reset your password:</p>
  //           <a href="${resetUrl}">${resetUrl}</a>
  //           <p>This link will expire in 24 hours.</p>
  //         `,
  //       },
  //     },
  //   },
  // }).promise();
}

