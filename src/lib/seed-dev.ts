// ==============================================
// SaveByte — Phase 2 Development / Testing Seed Data
// ==============================================
// NOTE: This seed script is strictly for development and testing.

import { prisma } from '@/lib/db';

export async function seedDevelopmentData(clerkUserId?: string) {
  const targetClerkId = clerkUserId || 'user_dev_demo_01';

  // 1. Create or ensure Demo User exists
  const user = await prisma.user.upsert({
    where: { clerkUserId: targetClerkId },
    update: {
      displayName: 'Chef Raghav Sharma',
      email: 'raghav.sharma@savebyte.demo',
      isOnboarded: true,
    },
    create: {
      clerkUserId: targetClerkId,
      displayName: 'Chef Raghav Sharma',
      email: 'raghav.sharma@savebyte.demo',
      isOnboarded: true,
    },
  });

  const entropy = Math.random().toString(36).substring(2, 7);

  // 2. Create Demo Restaurant Organization
  const restaurantOrg = await prisma.organization.upsert({
    where: { slug: `taj-grand-hospitality-hub-${targetClerkId}` },
    update: {},
    create: {
      name: 'Taj Grand Hospitality Hub',
      slug: `taj-grand-hospitality-hub-${targetClerkId}`,
      type: 'RESTAURANT',
      description: 'Premier culinary establishment operating zero-food-waste commercial kitchens.',
      isVerified: true,
    },
  });

  // 3. Create Facilities for Restaurant
  let restFacility = await prisma.facility.findFirst({
    where: { organizationId: restaurantOrg.id },
  });
  if (!restFacility) {
    restFacility = await prisma.facility.create({
      data: {
        organizationId: restaurantOrg.id,
        name: 'Taj Central Production Kitchen',
        type: 'KITCHEN',
        address: '45 Residency Road, MG Road Corridor',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        latitude: 12.9716,
        longitude: 77.5946,
        isPrimary: true,
        operatingStatus: 'ACTIVE',
      },
    });
  }

  // 4. Create Owner Membership for User in Restaurant
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: restaurantOrg.id,
      },
    },
    update: { role: 'ORGANIZATION_OWNER', status: 'ACTIVE' },
    create: {
      userId: user.id,
      organizationId: restaurantOrg.id,
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
    },
  });

  // 5. Create Demo NGO Organization
  const ngoOrg = await prisma.organization.upsert({
    where: { slug: `annapoorna-food-relief-network-${targetClerkId}` },
    update: {},
    create: {
      name: 'Annapoorna Food Relief Network',
      slug: `annapoorna-food-relief-network-${targetClerkId}`,
      type: 'NGO',
      description: 'Community hunger alleviation network serving 2,000+ hot meals daily.',
      isVerified: true,
    },
  });

  // 6. Create Facility for NGO
  let ngoFacility = await prisma.facility.findFirst({
    where: { organizationId: ngoOrg.id },
  });
  if (!ngoFacility) {
    ngoFacility = await prisma.facility.create({
      data: {
        organizationId: ngoOrg.id,
        name: 'Annapoorna Distribution Depot #1',
        type: 'DISTRIBUTION_CENTER',
        address: '12 Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        latitude: 12.9784,
        longitude: 77.6408,
        isPrimary: true,
        operatingStatus: 'ACTIVE',
      },
    });
  }

  // 7. Create NGO Coordinator Membership for User in NGO
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: ngoOrg.id,
      },
    },
    update: { role: 'NGO_COORDINATOR', status: 'ACTIVE' },
    create: {
      userId: user.id,
      organizationId: ngoOrg.id,
      role: 'NGO_COORDINATOR',
      status: 'ACTIVE',
    },
  });

  // 8. Create Individual User Membership
  const existingIndiv = await prisma.membership.findFirst({
    where: { userId: user.id, role: 'INDIVIDUAL_USER' },
  });
  if (!existingIndiv) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: null,
        role: 'INDIVIDUAL_USER',
        status: 'ACTIVE',
      },
    });
  }

  return {
    userId: user.id,
    restaurantOrgId: restaurantOrg.id,
    ngoOrgId: ngoOrg.id,
  };
}
