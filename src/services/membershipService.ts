// ==============================================
// SaveByte — Membership Service
// ==============================================

import { prisma } from '@/lib/db';
import { Membership } from '@/generated/prisma';
import { MembershipRole, MembershipStatus } from '@/types';
import { assertPermission, CheckableMembership } from '@/lib/permissions';

export const membershipService = {
  /**
   * Retrieves all memberships for a user.
   */
  async getUserMemberships(userId: string): Promise<Membership[]> {
    return prisma.membership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            facilities: true,
          },
        },
      },
    });
  },

  /**
   * Establishes individual user participation membership.
   */
  async createIndividualMembership(userId: string): Promise<Membership> {
    const existing = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId: null,
      },
    });

    if (existing) {
      if (existing.status !== 'ACTIVE') {
        return prisma.membership.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' },
        });
      }
      return existing;
    }

    const membership = await prisma.membership.create({
      data: {
        userId,
        organizationId: null,
        role: 'INDIVIDUAL_USER',
        status: 'ACTIVE',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    return membership;
  },

  /**
   * Lists all members of an organization with permission check.
   */
  async listOrganizationMembers(
    callerMembership: CheckableMembership & { organizationId?: string | null },
    orgId: string
  ): Promise<Membership[]> {
    assertPermission(callerMembership, 'member:view');

    if (callerMembership.organizationId !== orgId) {
      throw new Error('Access Denied: Cannot view members of another organization');
    }

    return prisma.membership.findMany({
      where: { organizationId: orgId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Invites or adds a member to an organization.
   */
  async inviteMember(
    callerMembership: CheckableMembership & { organizationId?: string | null },
    orgId: string,
    targetUserId: string,
    role: MembershipRole
  ): Promise<Membership> {
    assertPermission(callerMembership, 'member:invite');

    if (callerMembership.organizationId !== orgId) {
      throw new Error('Access Denied: Cannot invite members to another organization');
    }

    // Check if membership already exists
    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'REMOVED' || existing.status === 'SUSPENDED') {
        return prisma.membership.update({
          where: { id: existing.id },
          data: { role, status: 'ACTIVE' },
        });
      }
      throw new Error('User is already an active member of this organization');
    }

    return prisma.membership.create({
      data: {
        userId: targetUserId,
        organizationId: orgId,
        role,
        status: 'ACTIVE',
      },
    });
  },

  /**
   * Updates a member's role within an organization.
   */
  async updateRole(
    callerMembership: CheckableMembership & { organizationId?: string | null; role: string },
    targetMembershipId: string,
    newRole: MembershipRole
  ): Promise<Membership> {
    assertPermission(callerMembership, 'member:update_role');

    const targetMembership = await prisma.membership.findUnique({
      where: { id: targetMembershipId },
    });

    if (!targetMembership || !targetMembership.organizationId) {
      throw new Error('Target membership not found');
    }

    if (callerMembership.organizationId !== targetMembership.organizationId) {
      throw new Error('Access Denied: Cannot modify roles in another organization');
    }

    // Protect organization owner role transition
    if (targetMembership.role === 'ORGANIZATION_OWNER' && callerMembership.role !== 'ORGANIZATION_OWNER') {
      throw new Error('Access Denied: Only the current Owner can modify an Owner membership');
    }

    // Prevent non-owner from promoting someone to ORGANIZATION_OWNER
    if (newRole === 'ORGANIZATION_OWNER' && callerMembership.role !== 'ORGANIZATION_OWNER') {
      throw new Error('Access Denied: Only an Organization Owner can promote a member to Owner');
    }

    return prisma.membership.update({
      where: { id: targetMembershipId },
      data: { role: newRole },
    });
  },

  /**
   * Updates a member's lifecycle status (INVITED, ACTIVE, SUSPENDED, REMOVED).
   */
  async updateStatus(
    callerMembership: CheckableMembership & { organizationId?: string | null; role: string },
    targetMembershipId: string,
    newStatus: MembershipStatus
  ): Promise<Membership> {
    assertPermission(callerMembership, 'member:remove');

    const targetMembership = await prisma.membership.findUnique({
      where: { id: targetMembershipId },
    });

    if (!targetMembership || !targetMembership.organizationId) {
      throw new Error('Target membership not found');
    }

    if (callerMembership.organizationId !== targetMembership.organizationId) {
      throw new Error('Access Denied: Cannot modify membership status in another organization');
    }

    if (targetMembership.role === 'ORGANIZATION_OWNER') {
      throw new Error('Cannot suspend or remove the organization owner');
    }

    return prisma.membership.update({
      where: { id: targetMembershipId },
      data: { status: newStatus },
    });
  },
};
