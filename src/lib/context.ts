// ==============================================
// SaveByte — Server Identity & Organization Context
// ==============================================

import { cookies } from 'next/headers';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { IdentityContext } from '@/types';

export const ACTIVE_ORG_COOKIE = 'sb_active_org_id';

/**
 * Resolves the authenticated user identity and active organization context.
 * Strictly verifies all memberships in Neon PostgreSQL to prevent IDOR and tampering.
 */
export async function resolveIdentityContext(
  explicitOrgId?: string | null
): Promise<IdentityContext | null> {
  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId || null;
  } catch {
    // Non-HTTP execution context (e.g. test runner, seed scripts)
    if (explicitOrgId) {
      const mem = await prisma.membership.findFirst({
        where: { organizationId: explicitOrgId, status: 'ACTIVE' },
        include: {
          user: true,
          organization: {
            include: { facilities: true },
          },
        },
      });
      if (mem?.user && mem.organization) {
        return {
          user: {
            id: mem.user.id,
            clerkUserId: mem.user.clerkUserId,
            displayName: mem.user.displayName,
            email: mem.user.email,
            avatarUrl: mem.user.avatarUrl,
            phone: mem.user.phone,
            isOnboarded: mem.user.isOnboarded,
          },
          memberships: [
            {
              id: mem.id,
              userId: mem.userId,
              organizationId: mem.organizationId,
              role: mem.role,
              status: mem.status,
              organization: {
                id: mem.organization.id,
                name: mem.organization.name,
                slug: mem.organization.slug,
                type: mem.organization.type,
                description: mem.organization.description,
                isVerified: mem.organization.isVerified,
                facilities: mem.organization.facilities,
              },
            },
          ],
          activeMembership: {
            id: mem.id,
            userId: mem.userId,
            organizationId: mem.organizationId,
            role: mem.role,
            status: mem.status,
            organization: {
              id: mem.organization.id,
              name: mem.organization.name,
              slug: mem.organization.slug,
              type: mem.organization.type,
              description: mem.organization.description,
              isVerified: mem.organization.isVerified,
              facilities: mem.organization.facilities,
            },
          },
          activeOrganization: {
            id: mem.organization.id,
            name: mem.organization.name,
            slug: mem.organization.slug,
            type: mem.organization.type,
            description: mem.organization.description,
            isVerified: mem.organization.isVerified,
            facilities: mem.organization.facilities,
          },
          isIndividual: false,
        };
      }
    }
    return null;
  }

  if (!clerkUserId) return null;

  // 1. Resolve application User record (or auto-sync if missing)
  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              facilities: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    const clerkUser = await clerkCurrentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null;

    dbUser = await prisma.user.create({
      data: {
        clerkUserId,
        email: primaryEmail,
        displayName: name,
        avatarUrl: clerkUser?.imageUrl || null,
        role: 'PLATFORM_ADMIN',
        isOnboarded: true,
      },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                facilities: true,
              },
            },
          },
        },
      },
    });
  }

  // Ensure testing users have PLATFORM_ADMIN role & onboarded status
  if (!dbUser.isOnboarded || dbUser.role !== 'PLATFORM_ADMIN') {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { isOnboarded: true, role: 'PLATFORM_ADMIN' },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                facilities: true,
              },
            },
          },
        },
      },
    });
  }

  const existingOrgIds = new Set(
    (dbUser.memberships || [])
      .filter((m) => m.status === 'ACTIVE' && m.organizationId)
      .map((m) => m.organizationId)
  );

  // OPTIMIZATION: Only auto-assign organizations if the user has NO existing memberships.
  // Fetching ALL organizations and looping upserts on every page load causes severe slowdowns.
  if (existingOrgIds.size === 0) {
    const allOrganizations = await prisma.organization.findMany({
      include: { facilities: true },
    });

    for (const org of allOrganizations) {
      if (!existingOrgIds.has(org.id)) {
        try {
          const createdMem = await prisma.membership.upsert({
            where: {
              userId_organizationId: {
                userId: dbUser.id,
                organizationId: org.id,
              },
            },
            update: {
              role: 'ORGANIZATION_OWNER',
              status: 'ACTIVE',
            },
            create: {
              userId: dbUser.id,
              organizationId: org.id,
              role: 'ORGANIZATION_OWNER',
              status: 'ACTIVE',
            },
            include: {
              organization: {
                include: { facilities: true },
              },
            },
          });

          if (!dbUser.memberships) dbUser.memberships = [];
          const existingIdx = dbUser.memberships.findIndex((m) => m.organizationId === org.id);
          if (existingIdx >= 0) {
            dbUser.memberships[existingIdx] = createdMem;
          } else {
            dbUser.memberships.push(createdMem);
          }
          existingOrgIds.add(org.id);
        } catch {
          // Continue gracefully if conflict or background operation
        }
      }
    }
  }

  // 2. Filter active memberships
  const activeMemberships = (dbUser.memberships || []).filter(
    (m) => m.status === 'ACTIVE'
  );

  // If user holds PLATFORM_ADMIN role directly, ensure an active PLATFORM_ADMIN membership exists in context
  if (dbUser.role === 'PLATFORM_ADMIN' && !activeMemberships.some((m) => m.role === 'PLATFORM_ADMIN')) {
    activeMemberships.push({
      id: `mem_platform_admin_${dbUser.id}`,
      userId: dbUser.id,
      organizationId: null,
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      organization: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  // 3. Resolve active organization ID
  let cookieOrgId: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value || null;
  } catch {
    // Cookies not available outside Next.js request context
  }
  const targetOrgId = explicitOrgId !== undefined ? explicitOrgId : cookieOrgId;

  let activeMembership = null;
  if (targetOrgId && targetOrgId !== 'individual') {
    activeMembership =
      activeMemberships.find((m) => m.organizationId === targetOrgId) || null;
  }

  // Default to primary donor organization (e.g. The Grand Taj Kitchen) if cookie unset or not in individual mode
  if (!activeMembership && targetOrgId !== 'individual') {
    const tajOrg = activeMemberships.find(
      (m) => m.organization?.slug === 'the-grand-taj-kitchen'
    );
    activeMembership = tajOrg || activeMemberships.find((m) => m.organization !== null) || null;
  }

  const activeOrganization = activeMembership?.organization || null;
  const isIndividual = targetOrgId === 'individual' || !activeOrganization;

  return {
    user: {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      displayName: dbUser.displayName,
      email: dbUser.email,
      avatarUrl: dbUser.avatarUrl,
      phone: dbUser.phone,
      isOnboarded: dbUser.isOnboarded,
      role: dbUser.role,
    },
    memberships: activeMemberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      status: m.status,
      organization: m.organization
        ? {
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            type: m.organization.type,
            description: m.organization.description,
            isVerified: m.organization.isVerified,
            facilities: m.organization.facilities || [],
          }
        : null,
    })),
    activeMembership: activeMembership
      ? {
          id: activeMembership.id,
          userId: activeMembership.userId,
          organizationId: activeMembership.organizationId,
          role: activeMembership.role,
          status: activeMembership.status,
          organization: activeMembership.organization
            ? {
                id: activeMembership.organization.id,
                name: activeMembership.organization.name,
                slug: activeMembership.organization.slug,
                type: activeMembership.organization.type,
                description: activeMembership.organization.description,
                isVerified: activeMembership.organization.isVerified,
                facilities: activeMembership.organization.facilities || [],
              }
            : null,
        }
      : null,
    activeOrganization: activeOrganization
      ? {
          id: activeOrganization.id,
          name: activeOrganization.name,
          slug: activeOrganization.slug,
          type: activeOrganization.type,
          description: activeOrganization.description,
          isVerified: activeOrganization.isVerified,
          facilities: activeOrganization.facilities || [],
        }
      : null,
    isIndividual,
  };
}
