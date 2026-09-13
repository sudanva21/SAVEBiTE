// ==============================================
// SaveByte — Organization Service
// ==============================================

import { prisma } from '@/lib/db';
import { Organization, Facility } from '@/generated/prisma';
import { CreateOrganizationInput } from '@/types';
import { assertPermission, CheckableMembership } from '@/lib/permissions';

export const organizationService = {
  /**
   * Transactionally creates a new Organization with its primary Facility
   * and establishes the creating user as ORGANIZATION_OWNER.
   */
  async createOrganization(
    userId: string,
    input: CreateOrganizationInput
  ): Promise<{ organization: Organization; membershipId: string; facilityId: string }> {
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Organization name must be at least 2 characters long');
    }
    if (!input.primaryFacility?.address) {
      throw new Error('Primary facility address is required for an operational organization');
    }

    const baseSlug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Execute atomic transaction
    return prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: input.name.trim(),
          slug: uniqueSlug,
          type: input.type || 'DONOR',
          description: input.description || null,
          email: input.email || null,
          phone: input.phone || null,
          website: input.website || null,
          isVerified: false,
        },
      });

      // 2. Create Primary Facility under the Organization
      const facility = await tx.facility.create({
        data: {
          organizationId: org.id,
          name: input.primaryFacility.name || `${org.name} Main Facility`,
          type: input.primaryFacility.type || 'PRIMARY_LOCATION',
          address: input.primaryFacility.address,
          city: input.primaryFacility.city || null,
          state: input.primaryFacility.state || null,
          postalCode: input.primaryFacility.postalCode || null,
          latitude: input.primaryFacility.latitude || null,
          longitude: input.primaryFacility.longitude || null,
          operatingStatus: 'ACTIVE',
          isPrimary: true,
        },
      });

      // 3. Create Owner Membership
      const membership = await tx.membership.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'ORGANIZATION_OWNER',
          status: 'ACTIVE',
        },
      });

      // 4. Mark User as onboarded
      await tx.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });

      return {
        organization: org,
        membershipId: membership.id,
        facilityId: facility.id,
      };
    });
  },

  /**
   * Retrieves organization by ID with its facilities.
   */
  async getById(id: string): Promise<(Organization & { facilities: Facility[] }) | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        facilities: true,
      },
    });
  },

  /**
   * Retrieves organization by unique slug.
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { slug },
      include: {
        facilities: true,
      },
    });
  },

  /**
   * Lists all active organizations for a user.
   */
  async listForUser(userId: string): Promise<(Organization & { facilities: Facility[] })[]> {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        organization: {
          include: {
            facilities: true,
          },
        },
      },
    });

    return memberships
      .map((m) => m.organization)
      .filter((o): o is Organization & { facilities: Facility[] } => o !== null);
  },

  /**
   * Updates organization details with capability permission check.
   */
  async update(
    callerMembership: CheckableMembership,
    orgId: string,
    data: {
      name?: string;
      description?: string;
      email?: string;
      phone?: string;
      website?: string;
    }
  ): Promise<Organization> {
    assertPermission(callerMembership, 'org:update');

    return prisma.organization.update({
      where: { id: orgId },
      data,
    });
  },
};
