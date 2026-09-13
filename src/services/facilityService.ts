// ==============================================
// SaveByte — Facility Service
// ==============================================

import { prisma } from '@/lib/db';
import { Facility } from '@/generated/prisma';
import { CreateFacilityInput } from '@/types';
import { assertPermission, CheckableMembership } from '@/lib/permissions';

export const facilityService = {
  /**
   * Creates a new facility under an organization with permission check.
   */
  async createFacility(
    callerMembership: CheckableMembership & { organizationId?: string | null },
    orgId: string,
    input: CreateFacilityInput
  ): Promise<Facility> {
    assertPermission(callerMembership, 'facility:create');

    if (callerMembership.organizationId !== orgId) {
      throw new Error('Access Denied: You cannot create facilities for another organization');
    }

    if (!input.name || !input.address) {
      throw new Error('Facility name and address are required');
    }

    return prisma.facility.create({
      data: {
        organizationId: orgId,
        name: input.name.trim(),
        type: input.type || 'WAREHOUSE',
        address: input.address.trim(),
        city: input.city || null,
        state: input.state || null,
        postalCode: input.postalCode || null,
        country: input.country || 'India',
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        operatingStatus: input.operatingStatus || 'ACTIVE',
        isPrimary: input.isPrimary || false,
      },
    });
  },

  /**
   * Lists all facilities belonging to an organization.
   */
  async listForOrganization(
    callerMembership: CheckableMembership & { organizationId?: string | null },
    orgId: string
  ): Promise<Facility[]> {
    assertPermission(callerMembership, 'facility:view');

    if (callerMembership.organizationId !== orgId) {
      throw new Error('Access Denied: Cannot view facilities for another organization');
    }

    return prisma.facility.findMany({
      where: { organizationId: orgId },
      orderBy: { isPrimary: 'desc' },
    });
  },

  /**
   * Updates facility details.
   */
  async updateFacility(
    callerMembership: CheckableMembership & { organizationId?: string | null },
    facilityId: string,
    data: Partial<CreateFacilityInput>
  ): Promise<Facility> {
    assertPermission(callerMembership, 'facility:update');

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new Error('Facility not found');
    }

    if (callerMembership.organizationId !== facility.organizationId) {
      throw new Error('Access Denied: You can only update facilities in your active organization');
    }

    return prisma.facility.update({
      where: { id: facilityId },
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        operatingStatus: data.operatingStatus,
        isPrimary: data.isPrimary,
      },
    });
  },
};
