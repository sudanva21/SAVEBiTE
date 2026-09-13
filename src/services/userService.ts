// ==============================================
// SaveByte — User Service
// ==============================================

import { prisma } from '@/lib/db';
import { User } from '@/generated/prisma';

export const userService = {
  /**
   * Finds user by Clerk User ID or application user ID.
   */
  async findByClerkId(clerkUserId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });
  },

  /**
   * Updates user profile fields.
   * Privacy boundary: Operational coordinates are NOT stored on user profile.
   */
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
    });
  },

  /**
   * Marks onboarding completed for user.
   */
  async setOnboarded(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });
  },
};
