// ==============================================
// SaveByte — Central Capability Permission Engine
// ==============================================

import { MembershipRole, MembershipStatus, PermissionKey } from '@/types';

/**
 * Role-to-Permission Mapping Matrix.
 * Controls capability-based authorization across all SaveByte modules.
 */
const ROLE_PERMISSIONS: Record<MembershipRole, readonly PermissionKey[]> = {
  ORGANIZATION_OWNER: [
    'org:view', 'org:manage', 'org:update', 'org:delete',
    'member:view', 'member:invite', 'member:update_role', 'member:remove',
    'facility:view', 'facility:create', 'facility:update', 'facility:delete',
    'food:create', 'food:edit', 'food:delete', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish', 'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'sponsorship:create', 'buyer:purchase', 'recovery:manage',
    'matching:view', 'matching:manage', 'matching:accept', 'matching:reject',
    'logistics:dispatch', 'logistics:view', 'logistics:manage',
    'route:view', 'route:manage', 'route:assign', 'route:update',
    'analytics:view', 'telemetry:view', 'digital_twin:control', 'esg:export',
    'ai:view', 'ai:analyze', 'ai:recommend', 'ai:audit',
  ],

  ORGANIZATION_ADMIN: [
    'org:view', 'org:update',
    'member:view', 'member:invite', 'member:update_role', 'member:remove',
    'facility:view', 'facility:create', 'facility:update',
    'food:create', 'food:edit', 'food:delete', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish', 'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'sponsorship:create', 'buyer:purchase', 'recovery:manage',
    'matching:view', 'matching:manage', 'matching:accept', 'matching:reject',
    'logistics:dispatch', 'logistics:view', 'logistics:manage',
    'route:view', 'route:manage', 'route:assign', 'route:update',
    'analytics:view', 'telemetry:view', 'digital_twin:control', 'esg:export',
    'ai:view', 'ai:analyze', 'ai:recommend', 'ai:audit',
  ],

  DONOR_MANAGER: [
    'org:view', 'member:view', 'facility:view',
    'food:create', 'food:edit', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish',
    'request:view', 'request:accept', 'recovery:manage',
    'matching:view', 'matching:manage', 'matching:accept', 'matching:reject',
    'route:view',
    'analytics:view', 'telemetry:view', 'esg:export',
    'ai:view', 'ai:analyze', 'ai:recommend',
  ],

  KITCHEN_MANAGER: [
    'org:view', 'facility:view',
    'food:create', 'food:edit', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish',
    'request:view', 'request:accept', 'recovery:manage',
    'matching:view', 'matching:accept', 'matching:reject',
    'route:view',
    'analytics:view', 'telemetry:view',
    'ai:view', 'ai:analyze', 'ai:recommend',
  ],

  PROCESSING_MANAGER: [
    'org:view', 'facility:view',
    'food:create', 'food:edit', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'buyer:purchase', 'recovery:manage',
    'route:view',
    'analytics:view', 'telemetry:view',
    'ai:view', 'ai:analyze', 'ai:recommend',
  ],

  NGO_COORDINATOR: [
    'org:view', 'member:view', 'facility:view',
    'food:view', 'inventory:view',
    'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'recovery:manage',
    'matching:view',
    'route:view', 'route:update',
    'analytics:view',
    'ai:view',
  ],

  FOOD_BANK_COORDINATOR: [
    'org:view', 'member:view', 'facility:view', 'facility:create', 'facility:update',
    'food:view', 'inventory:manage', 'inventory:view',
    'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'recovery:manage',
    'matching:view',
    'route:view', 'route:manage', 'route:assign', 'route:update',
    'analytics:view', 'telemetry:view', 'esg:export',
    'ai:view', 'ai:recommend',
  ],

  SHELTER_COORDINATOR: [
    'org:view', 'facility:view',
    'food:view',
    'surplus:claim',
    'request:create', 'request:view',
    'recovery:manage',
    'matching:view',
    'route:view',
    'analytics:view',
  ],

  COMMUNITY_KITCHEN_MANAGER: [
    'org:view', 'member:view', 'facility:view',
    'food:create', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish', 'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'recovery:manage',
    'matching:view',
    'route:view',
    'analytics:view',
    'ai:view', 'ai:recommend',
  ],

  BUYER: [
    'org:view', 'food:view',
    'surplus:claim',
    'buyer:purchase',
    'recovery:manage',
    'analytics:view',
  ],

  INDUSTRIAL_RECOVERY_MANAGER: [
    'org:view', 'facility:view',
    'food:view',
    'surplus:claim',
    'recovery:manage',
    'route:view',
    'telemetry:view', 'analytics:view', 'esg:export',
  ],

  LOGISTICS_MANAGER: [
    'org:view', 'facility:view',
    'food:view',
    'logistics:dispatch', 'logistics:view', 'logistics:manage',
    'route:view', 'route:manage', 'route:assign', 'route:update',
    'recovery:manage',
    'telemetry:view', 'analytics:view',
  ],

  INDIVIDUAL_USER: [
    'food:view',
    'surplus:claim',
    'request:create', 'request:view',
    'sponsorship:create',
    'buyer:purchase',
  ],

  PLATFORM_ADMIN: [
    'org:view', 'org:manage', 'org:update', 'org:delete',
    'member:view', 'member:invite', 'member:update_role', 'member:remove',
    'facility:view', 'facility:create', 'facility:update', 'facility:delete',
    'food:create', 'food:edit', 'food:delete', 'food:view', 'food:publish',
    'inventory:manage', 'inventory:view',
    'surplus:publish', 'surplus:claim',
    'request:create', 'request:accept', 'request:view',
    'sponsorship:create', 'buyer:purchase', 'recovery:manage',
    'matching:view', 'matching:manage', 'matching:accept', 'matching:reject',
    'logistics:dispatch', 'logistics:view', 'logistics:manage',
    'route:view', 'route:manage', 'route:assign', 'route:update',
    'analytics:view', 'telemetry:view', 'digital_twin:control', 'esg:export',
    'ai:view', 'ai:analyze', 'ai:recommend', 'ai:audit',
    'admin:access', 'application:view', 'application:review', 'application:approve',
    'application:reject', 'application:request_changes', 'audit:view',
  ],
};

export interface CheckableMembership {
  role: string;
  status: string | MembershipStatus;
}

/**
 * Evaluates whether a membership has a specific capability permission.
 * Returns false if membership is null, inactive, suspended, or lacking permission.
 */
export function can(
  member: CheckableMembership | null | undefined,
  permission: PermissionKey
): boolean {
  if (!member) return false;
  if (member.status !== 'ACTIVE') return false;

  const role = member.role as MembershipRole;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.includes(permission);
}

/**
 * Checks if a membership has one of the specified roles.
 */
export function hasRole(
  member: CheckableMembership | null | undefined,
  ...roles: MembershipRole[]
): boolean {
  if (!member) return false;
  if (member.status !== 'ACTIVE') return false;
  return roles.includes(member.role as MembershipRole);
}

/**
 * Asserts capability permission on the server side. Throws an Error if unauthorized.
 */
export function assertPermission(
  member: CheckableMembership | null | undefined,
  permission: PermissionKey,
  customMessage?: string
): void {
  if (!can(member, permission)) {
    throw new Error(
      customMessage ||
        `Access Denied: Missing required permission "${permission}" for role "${member?.role || 'NONE'}" (status: ${member?.status || 'UNKNOWN'})`
    );
  }
}
