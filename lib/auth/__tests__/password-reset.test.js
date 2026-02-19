/**
 * Test suite for Password Reset Utilities
 * 
 * Tests password reset token generation, verification, and email sending
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
  sendPasswordResetEmail,
} from '../password-reset.js';
import { prisma } from '../../database/prisma.js';

// Mock Prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock environment
vi.mock('../../../config/environment.js', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:4000',
  },
}));

describe('Password Reset Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a secure token and create database record', async () => {
      const userId = 'user-123';
      let generatedToken = null;
      
      prisma.passwordResetToken.create.mockImplementation(({ data }) => {
        generatedToken = data.token;
        return Promise.resolve({
          id: 'token-id',
          userId,
          token: data.token,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        });
      });

      const result = await generatePasswordResetToken(userId);

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });

      expect(result.token).toBe(generatedToken);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    it('should set expiration to 24 hours from now', async () => {
      const userId = 'user-123';
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      prisma.passwordResetToken.create.mockImplementation(({ data }) => {
        const expiresAt = data.expiresAt;
        const expectedExpiresAt = new Date(now + 24 * 60 * 60 * 1000);
        
        return Promise.resolve({
          id: 'token-id',
          userId,
          token: data.token,
          expiresAt,
          createdAt: new Date(),
        });
      });

      const result = await generatePasswordResetToken(userId);

      const expiresAtTime = result.expiresAt.getTime();
      const expectedTime = now + 24 * 60 * 60 * 1000;
      const tolerance = 1000; // 1 second tolerance

      expect(Math.abs(expiresAtTime - expectedTime)).toBeLessThan(tolerance);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should return token data for valid token', async () => {
      const token = 'valid-token';
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        usedAt: null,
        user: {
          id: 'user-123',
          isActive: true,
        },
      };

      prisma.passwordResetToken.findUnique.mockResolvedValue(mockToken);

      const result = await verifyPasswordResetToken(token);

      expect(result).toEqual({
        id: 'token-id',
        userId: 'user-123',
        expiresAt: mockToken.expiresAt,
      });
    });

    it('should return null for non-existent token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await verifyPasswordResetToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for already used token', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'used-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(), // Already used
        user: { id: 'user-123', isActive: true },
      };

      prisma.passwordResetToken.findUnique.mockResolvedValue(mockToken);

      const result = await verifyPasswordResetToken('used-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
        user: { id: 'user-123', isActive: true },
      };

      prisma.passwordResetToken.findUnique.mockResolvedValue(mockToken);

      const result = await verifyPasswordResetToken('expired-token');

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        user: {
          id: 'user-123',
          isActive: false, // Inactive user
        },
      };

      prisma.passwordResetToken.findUnique.mockResolvedValue(mockToken);

      const result = await verifyPasswordResetToken('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('markPasswordResetTokenAsUsed', () => {
    it('should mark token as used', async () => {
      const tokenId = 'token-id';

      await markPasswordResetTokenAsUsed(tokenId);

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: tokenId },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should log reset URL in development', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const email = 'user@example.com';
      const token = 'reset-token';

      await sendPasswordResetEmail(email, token);

      // Check that console.log was called with a string containing the reset URL
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      // The function logs: `[Password Reset] Reset URL for ${email}: ${resetUrl}`
      // So it's a single string argument
      const logMessage = logCall[0];
      expect(logMessage).toContain('Password Reset');
      expect(logMessage).toContain(email);
      expect(logMessage).toContain(token);
      expect(logMessage).toContain('reset-password');

      consoleSpy.mockRestore();
    });
  });
});

