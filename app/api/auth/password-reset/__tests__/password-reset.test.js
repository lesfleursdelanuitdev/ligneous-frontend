/**
 * Test suite for Password Reset API Routes
 * 
 * Tests the password reset request and reset endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as requestReset } from '../request/route.js';
import { POST as resetPassword } from '../reset/route.js';
import { prisma } from '@/lib/database/prisma.js';
import { generatePasswordResetToken, verifyPasswordResetToken } from '@/lib/auth/password-reset.js';
import { hashPassword } from '@/lib/auth.js';

// Mock dependencies
vi.mock('@/lib/database/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
    },
    session: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/password-reset.js', () => ({
  generatePasswordResetToken: vi.fn(),
  verifyPasswordResetToken: vi.fn(),
  markPasswordResetTokenAsUsed: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/auth.js', () => ({
  hashPassword: vi.fn(),
}));

describe('Password Reset API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/password-reset/request', () => {
    it('should return error if email is missing', async () => {
      const request = new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await requestReset(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('should return success message even if user does not exist (security)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });

      const response = await requestReset(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('If an account exists');
    });

    it('should generate token and send email for existing user', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'testuser',
        isActive: true,
      };

      prisma.user.findUnique.mockResolvedValue(user);
      generatePasswordResetToken.mockResolvedValue({
        token: 'reset-token-123',
        expiresAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const response = await requestReset(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generatePasswordResetToken).toHaveBeenCalledWith('user-123');
      expect(data.message).toContain('If an account exists');
    });

    it('should not send email for inactive user', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'testuser',
        isActive: false,
      };

      prisma.user.findUnique.mockResolvedValue(user);

      const request = new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const response = await requestReset(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generatePasswordResetToken).not.toHaveBeenCalled();
      expect(data.message).toContain('If an account exists');
    });
  });

  describe('POST /api/auth/password-reset/reset', () => {
    it('should return error if token is missing', async () => {
      const request = new Request('http://localhost/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'newpass123' }),
      });

      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token and new password are required');
    });

    it('should return error if password is too short', async () => {
      const request = new Request('http://localhost/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token', newPassword: 'short' }),
      });

      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('should return error for invalid token', async () => {
      verifyPasswordResetToken.mockResolvedValue(null);

      const request = new Request('http://localhost/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token', newPassword: 'newpass123' }),
      });

      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should reset password and revoke sessions for valid token', async () => {
      const resetToken = {
        id: 'token-id',
        userId: 'user-123',
        expiresAt: new Date(),
      };

      verifyPasswordResetToken.mockResolvedValue(resetToken);
      hashPassword.mockResolvedValue('hashed-password');

      const request = new Request('http://localhost/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token', newPassword: 'newpass123' }),
      });

      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(hashPassword).toHaveBeenCalledWith('newpass123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { passwordHash: 'hashed-password' },
      });
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { isRevoked: true },
      });
      expect(data.message).toBe('Password reset successfully');
    });
  });
});

