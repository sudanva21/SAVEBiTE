// ==============================================
// SaveByte — Authorization Service
// ==============================================

import { resolveIdentityContext } from '@/lib/context';
import { assertPermission, can, hasRole } from '@/lib/permissions';
import { IdentityContext, PermissionKey, MembershipRole } from '@/types';

export const authorizationService = {
  /**
   * Resolves and verifies the authenticated identity context.
   * Throws an error if user is unauthenticated.
   */
  async requireContext(explicitOrgId?: string | null): Promise<IdentityContext> {
    const context = await resolveIdentityContext(explicitOrgId);
    if (!context || !context.user) {
      throw new Error('Authentication Required: You must be signed in to perform this action');
    }
    return context;
  },

  /**
   * Resolves identity context and verifies an active organization context exists.
   */
  async requireActiveOrganization(explicitOrgId?: string | null): Promise<{
    context: IdentityContext;
    organization: NonNullable<IdentityContext['activeOrganization']>;
    membership: NonNullable<IdentityContext['activeMembership']>;
  }> {
    const context = await this.requireContext(explicitOrgId);

    if (!context.activeOrganization || !context.activeMembership) {
      throw new Error(
        'Organization Context Required: Please select or create an organization to perform this action'
      );
    }

    if (context.activeMembership.status !== 'ACTIVE') {
      throw new Error(
        `Access Denied: Your membership in ${context.activeOrganization.name} is ${context.activeMembership.status}`
      );
    }

    return {
      context,
      organization: context.activeOrganization,
      membership: context.activeMembership,
    };
  },

  /**
   * Verifies that the caller has a specific capability permission within their active context.
   */
  async requirePermission(
    permission: PermissionKey,
    explicitOrgId?: string | null
  ): Promise<{
    context: IdentityContext;
    organization: NonNullable<IdentityContext['activeOrganization']>;
    membership: NonNullable<IdentityContext['activeMembership']>;
  }> {
    const { context, organization, membership } =
      await this.requireActiveOrganization(explicitOrgId);

    assertPermission(membership, permission);

    return { context, organization, membership };
  },

  /**
   * Verifies that the caller has a capability permission, supporting both organization members and individual users.
   */
  async requireUserPermission(permission: PermissionKey): Promise<{
    context: IdentityContext;
    membership: NonNullable<IdentityContext['activeMembership']>;
  }> {
    const context = await this.requireContext();
    const membership =
      context.activeMembership ||
      context.memberships.find((m) => m.status === 'ACTIVE') ||
      null;

    if (!membership) {
      throw new Error('Access Denied: No active membership found for user');
    }

    assertPermission(membership, permission);

    return { context, membership };
  },

  /**
   * Resolves identity context and verifies the user holds an active PLATFORM_ADMIN role.
   * Checks all active memberships for the user.
   */
  async requirePlatformAdmin(): Promise<{
    context: IdentityContext;
    adminMembership: NonNullable<IdentityContext['memberships'][number]>;
  }> {
    const context = await this.requireContext();
    let adminMembership = context.memberships.find(
      (m) => m.role === 'PLATFORM_ADMIN' && m.status === 'ACTIVE'
    );

    if (!adminMembership && context.user.role === 'PLATFORM_ADMIN') {
      adminMembership = {
        id: `mem_platform_admin_${context.user.id}`,
        userId: context.user.id,
        organizationId: null,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        organization: null,
      };
    }

    if (!adminMembership) {
      throw new Error(
        'Access Denied: Platform Administrator privileges required. You do not have access to this area.'
      );
    }

    assertPermission(adminMembership, 'admin:access');

    return { context, adminMembership };
  },

  /**
   * Evaluates permission for a given context without throwing.
   */
  can(membership: IdentityContext['activeMembership'], permission: PermissionKey): boolean {
    return can(membership, permission);
  },

  /**
   * Checks role for a given context.
   */
  hasRole(membership: IdentityContext['activeMembership'], ...roles: MembershipRole[]): boolean {
    return hasRole(membership, ...roles);
  },
};
