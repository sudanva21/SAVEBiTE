'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { authorizationService } from '@/services/authorizationService';
import { membershipService } from '@/services/membershipService';
import { MembershipRole, MembershipStatus } from '@/types';

/**
 * Lists all members for the caller's active organization with server-side authorization.
 */
export async function listOrganizationMembersAction() {
  const { organization, membership } =
    await authorizationService.requirePermission('member:view');

  const members = await membershipService.listOrganizationMembers(
    membership,
    organization.id
  );

  return {
    success: true,
    organization,
    currentMembership: membership,
    members,
  };
}

/**
 * Invites a user by User ID or Email to the caller's active organization.
 */
export async function inviteMemberAction(targetIdentifier: string, role: MembershipRole) {
  const { organization, membership } =
    await authorizationService.requirePermission('member:invite');

  const identifier = targetIdentifier.trim();
  if (!identifier) {
    throw new Error('User ID or email address is required');
  }

  let targetUserId = identifier;

  if (identifier.includes('@')) {
    const normalizedEmail = identifier.toLowerCase();
    let user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: `invited_${Math.random().toString(36).substring(2, 10)}`,
          email: identifier.toLowerCase(),
          displayName: identifier.split('@')[0],
          isOnboarded: false,
        },
      });
    }
    targetUserId = user.id;
  }

  const newMembership = await membershipService.inviteMember(
    membership,
    organization.id,
    targetUserId,
    role
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/team');
  revalidatePath('/profile');
  return { success: true, membership: newMembership };
}

/**
 * Updates a member's role within the caller's active organization.
 */
export async function updateMemberRoleAction(
  targetMembershipId: string,
  newRole: MembershipRole
) {
  const { membership } =
    await authorizationService.requirePermission('member:update_role');

  const updated = await membershipService.updateRole(
    membership,
    targetMembershipId,
    newRole
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/team');
  revalidatePath('/profile');
  return { success: true, membership: updated };
}

/**
 * Updates a member's status (e.g. SUSPENDED, ACTIVE, REMOVED).
 */
export async function updateMemberStatusAction(
  targetMembershipId: string,
  newStatus: MembershipStatus
) {
  const { membership } =
    await authorizationService.requirePermission('member:remove');

  const updated = await membershipService.updateStatus(
    membership,
    targetMembershipId,
    newStatus
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/team');
  revalidatePath('/profile');
  return { success: true, membership: updated };
}

