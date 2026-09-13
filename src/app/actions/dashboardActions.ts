'use server';

// ==============================================
// SaveByte — Dashboard Operational Overview Action (Phase 3)
// ==============================================

import { prisma } from '@/lib/db';
import { authorizationService } from '@/services/authorizationService';

export interface DashboardMetrics {
  roleType: 'INDUSTRY' | 'NGO' | 'INDIVIDUAL';
  stats: {
    label1: string;
    value1: string | number;
    sub1?: string;
    label2: string;
    value2: string | number;
    sub2?: string;
    label3: string;
    value3: string | number;
    sub3?: string;
    label4: string;
    value4: string | number;
    sub4?: string;
  };
  recentBatches: any[];
  recentListings: any[];
  recentRequests: any[];
  recentRecoveries: any[];
}

export async function getDashboardOverviewAction(): Promise<{ success: boolean; data: DashboardMetrics }> {
  const context = await authorizationService.requireContext();

  const activeOrg = context.activeOrganization;
  const isIndividual = context.isIndividual || !activeOrg;

  let roleType: 'INDUSTRY' | 'NGO' | 'INDIVIDUAL' = 'INDIVIDUAL';

  if (!isIndividual && activeOrg) {
    if (activeOrg.type === 'NGO' || activeOrg.type === 'FOOD_BANK' || activeOrg.type === 'SHELTER' || activeOrg.type === 'COMMUNITY_KITCHEN') {
      roleType = 'NGO';
    } else {
      roleType = 'INDUSTRY';
    }
  }

  if (roleType === 'INDUSTRY' && activeOrg) {
    const [batches, surplus, requests, recoveries] = await Promise.all([
      prisma.foodBatch.findMany({
        where: { organizationId: activeOrg.id },
        include: { foodItem: true, facility: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.surplusListing.findMany({
        where: { donorOrganizationId: activeOrg.id },
        include: { foodItem: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.foodRequest.findMany({
        where: { surplusListing: { donorOrganizationId: activeOrg.id } },
        include: { requesterUser: true, requesterOrganization: true, surplusListing: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.recoveryTransaction.findMany({
        where: { donorOrganizationId: activeOrg.id },
        include: { foodItem: true, recipientUser: true, recipientOrganization: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalStock = batches.reduce((acc, b) => acc + b.currentQuantity, 0);
    const activeSurplus = surplus.filter(s => s.status === 'PUBLISHED').reduce((acc, s) => acc + s.availableQuantity, 0);
    const pendingReqs = requests.filter(r => r.status === 'PENDING').length;
    const completedRecoveries = recoveries.filter(r => r.status === 'COMPLETED').length;

    return {
      success: true,
      data: {
        roleType: 'INDUSTRY',
        stats: {
          label1: 'Operational Stock',
          value1: `${totalStock.toLocaleString()} kg`,
          sub1: `${batches.length} active batches`,
          label2: 'Active Surplus Posted',
          value2: `${activeSurplus.toLocaleString()} kg`,
          sub2: `${surplus.filter(s => s.status === 'PUBLISHED').length} listings open`,
          label3: 'Pending Claims',
          value3: pendingReqs,
          sub3: 'Awaiting donor acceptance',
          label4: 'Completed Recoveries',
          value4: completedRecoveries,
          sub4: '100% verified zero waste',
        },
        recentBatches: batches,
        recentListings: surplus,
        recentRequests: requests,
        recentRecoveries: recoveries,
      },
    };
  } else if (roleType === 'NGO' && activeOrg) {
    const [availableListings, myRequests, myRecoveries] = await Promise.all([
      prisma.surplusListing.findMany({
        where: { status: 'PUBLISHED', availableQuantity: { gt: 0 } },
        include: { foodItem: true, donorOrganization: true, facility: true },
        orderBy: { availableUntil: 'asc' },
        take: 5,
      }),
      prisma.foodRequest.findMany({
        where: { requesterOrganizationId: activeOrg.id },
        include: { surplusListing: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.recoveryTransaction.findMany({
        where: { recipientOrganizationId: activeOrg.id },
        include: { foodItem: true, donorOrganization: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const activeReqCount = myRequests.filter(r => r.status === 'PENDING').length;
    const allocatedReqCount = myRequests.filter(r => r.status === 'ACCEPTED').length;
    const completedFood = myRecoveries.filter(r => r.status === 'COMPLETED').reduce((acc, r) => acc + r.quantity, 0);

    return {
      success: true,
      data: {
        roleType: 'NGO',
        stats: {
          label1: 'Surplus Feeds Available',
          value1: availableListings.length,
          sub1: 'Ready for community claim',
          label2: 'Pending NGO Claims',
          value2: activeReqCount,
          sub2: 'Under donor review',
          label3: 'Accepted Allocations',
          value3: allocatedReqCount,
          sub3: 'Ready for pickup verification',
          label4: 'Food Rescued',
          value4: `${completedFood.toLocaleString()} kg`,
          sub4: 'Delivered to beneficiaries',
        },
        recentBatches: [],
        recentListings: availableListings,
        recentRequests: myRequests,
        recentRecoveries: myRecoveries,
      },
    };
  } else {
    // INDIVIDUAL USER
    const [availableListings, myOrders] = await Promise.all([
      prisma.surplusListing.findMany({
        where: { status: 'PUBLISHED', availableQuantity: { gt: 0 } },
        include: { foodItem: true, donorOrganization: true, facility: true },
        orderBy: { availableUntil: 'asc' },
        take: 5,
      }),
      prisma.recoveryTransaction.findMany({
        where: {
          OR: [
            { recipientUserId: context.user.id },
            { sponsorUserId: context.user.id },
          ],
        },
        include: { foodItem: true, donorOrganization: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const buyForMeCount = myOrders.filter(o => o.orderType === 'BUY_FOR_ME').length;
    const sponsoredCount = myOrders.filter(o => o.orderType === 'SPONSORED_MEAL').length;
    const totalRescued = myOrders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + o.quantity, 0);

    return {
      success: true,
      data: {
        roleType: 'INDIVIDUAL',
        stats: {
          label1: 'Available Meal Rescues',
          value1: availableListings.length,
          sub1: 'Discounted portions today',
          label2: 'My Reservations',
          value2: buyForMeCount,
          sub2: 'Active & past pickups',
          label3: 'Meals Sponsored',
          value3: sponsoredCount,
          sub3: 'Community direct relief',
          label4: 'Impact Rescued',
          value4: `${totalRescued.toLocaleString()} kg`,
          sub4: 'Verified landfill avoided',
        },
        recentBatches: [],
        recentListings: availableListings,
        recentRequests: [],
        recentRecoveries: myOrders,
      },
    };
  }
}
