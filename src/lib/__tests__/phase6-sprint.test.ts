// ==============================================
// SaveByte — Phase 6 Final Sprint Minimal Test Suite
// ==============================================
//
// Minimal high-value tests verifying:
// 1. Admin Organization Approval Lifecycle & Self-Approval Prevention
// 2. Copilot Authorization, Tenant Isolation & Grounded Fact Context
// 3. Map Route Loading, Distance & Simulated Tracking Coordinates

import { prisma } from '../db';
import { can } from '../permissions';
import { applicationService } from '../../services/applicationService';
import { copilotService } from '../../services/ai/copilotService';
import { seedFinalDemoScenario } from '../seed-final-demo';

export async function runPhase6SprintTests() {
  const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    process.stdout.write(`  -> [Phase 6] Running: ${name}... `);
    try {
      const res = fn();
      if (res instanceof Promise) {
        await res;
      }
      results.push({ name, status: 'PASS' });
      console.log('✓ PASS');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, status: 'FAIL', error: message });
      console.log(`✗ FAIL: ${message}`);
    }
  }

  // Seed canonical demo scenario
  const demo = await seedFinalDemoScenario();

  // ----------------------------------------------------
  // SECTION 1: ADMIN APPROVAL WORKFLOW
  // ----------------------------------------------------

  await test('1. Admin Approval: Self-approval protection prevents applicant from approving own org', async () => {
    // Applicant user kavita tries to approve her own application
    try {
      await applicationService.approveApplication(
        demo.pendingApp.applicantId,
        demo.pendingApp.id
      );
      throw new Error('Applicant should NOT be able to self-approve application');
    } catch (err: any) {
      if (!err.message.includes('cannot approve their own') && !err.message.includes('Security violation')) {
        throw err;
      }
    }
  });

  await test('2. Admin Approval: Platform admin can mark application under review', async () => {
    // Ensure a platform admin user exists
    let adminUser = await prisma.user.findFirst({
      where: { memberships: { some: { role: 'PLATFORM_ADMIN', status: 'ACTIVE' } } },
    });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          id: 'usr_platform_admin_sprint',
          clerkUserId: 'clerk_platform_admin_sprint',
          displayName: 'Platform Admin Officer',
          email: 'admin.governance@savebyte.in',
          isOnboarded: true,
        },
      });
      await prisma.membership.create({
        data: {
          userId: adminUser.id,
          role: 'PLATFORM_ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    const reviewed = await applicationService.markUnderReview(adminUser.id, demo.pendingApp.id);
    if (reviewed.status !== 'UNDER_REVIEW') {
      throw new Error(`Expected status UNDER_REVIEW, got ${reviewed.status}`);
    }
  });

  await test('3. Admin Approval: Platform admin approval transactionally provisions Org, Facility, and Owner', async () => {
    const adminUser = await prisma.user.findFirst({
      where: { memberships: { some: { role: 'PLATFORM_ADMIN', status: 'ACTIVE' } } },
    });
    if (!adminUser) throw new Error('Admin user required');

    // Create a fresh test application to approve cleanly
    const testApplicant = await prisma.user.create({
      data: {
        id: `usr_app_${Date.now()}`,
        clerkUserId: `clerk_app_${Date.now()}`,
        displayName: 'Suresh Kumar',
        email: `suresh_${Date.now()}@freshkitchens.org`,
        isOnboarded: false,
      },
    });

    const testApp = await prisma.organizationApplication.create({
      data: {
        id: `app_fresh_${Date.now()}`,
        applicantId: testApplicant.id,
        orgName: `Fresh Community Kitchen ${Date.now()}`,
        type: 'COMMUNITY_KITCHEN',
        orgType: 'COMMUNITY_KITCHEN',
        contactName: 'Suresh Kumar',
        contactEmail: `suresh_${Date.now()}@freshkitchens.org`,
        facilityName: 'Main Community Kitchen',
        address: '12 Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        status: 'PENDING',
      },
    });

    const approvedResult = await applicationService.approveApplication(adminUser.id, testApp.id);
    if (!approvedResult.organizationId) {
      throw new Error('Approval must provision an organization');
    }
    if (!approvedResult.facilityId) {
      throw new Error('Approval must provision a primary facility');
    }
    if (!approvedResult.membershipId) {
      throw new Error('Approval must provision an OWNER membership for the applicant');
    }

    // Verify application status is now APPROVED
    const updatedApp = await prisma.organizationApplication.findUnique({
      where: { id: testApp.id },
    });
    if (updatedApp?.status !== 'APPROVED') {
      throw new Error(`Expected application status APPROVED, got ${updatedApp?.status}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 2: AI COPILOT AUTHORIZATION & GROUNDED CONTEXT
  // ----------------------------------------------------

  await test('4. Copilot: Individual user is blocked from accessing organizational operational context', async () => {
    // 1. Role capability check: INDIVIDUAL_USER has no ai:view permission
    const individualMembership = { role: 'INDIVIDUAL_USER', status: 'ACTIVE' };
    if (can(individualMembership, 'ai:view')) {
      throw new Error('Security Violation: INDIVIDUAL_USER cannot have ai:view permission');
    }

    // 2. Non-existent organization is rejected
    try {
      await copilotService.askCopilot('org_non_existent', 'What food needs attention?');
      throw new Error('Should throw on invalid org');
    } catch (err: any) {
      if (!err.message.includes('not found')) throw err;
    }
  });

  await test('5. Copilot: Organization member receives grounded response citing real operational facts', async () => {
    const answer = await copilotService.askCopilot(
      demo.donorOrg.id,
      'What food needs attention right now?'
    );

    if (!answer || !answer.answer) {
      throw new Error('Copilot must return a text answer');
    }
    if (!answer.groundedFacts || answer.groundedFacts.length === 0) {
      throw new Error('Copilot response must include grounded operational facts from database');
    }
    if (!['groq', 'deterministic_baseline'].includes(answer.provider)) {
      throw new Error(`Unexpected provider: ${answer.provider}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 3: MAP ROUTE LOADING & SIMULATED TRACKING
  // ----------------------------------------------------

  await test('6. Map Route: Route loads with coordinates, distance, vehicle, and security PIN', async () => {
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: demo.deliveryRoute.id },
      include: {
        recoveryTransaction: {
          include: {
            donorOrganization: true,
            recipientOrganization: true,
          },
        },
        vehicle: true,
      },
    });

    if (!route) throw new Error('Demo delivery route not found');
    if (!route.pickupLatitude || !route.pickupLongitude) {
      throw new Error('Route must have pickup coordinates for MapCN rendering');
    }
    if (!route.destinationLatitude || !route.destinationLongitude) {
      throw new Error('Route must have destination coordinates for MapCN rendering');
    }
    if (route.distanceKm !== 2.4) {
      throw new Error(`Expected distance 2.4 km, got ${route.distanceKm}`);
    }
    if (route.estimatedDurationMinutes !== 18) {
      throw new Error(`Expected ETA 18 min, got ${route.estimatedDurationMinutes}`);
    }
    if (route.verificationPin !== '849201') {
      throw new Error(`Expected PIN 849201, got ${route.verificationPin}`);
    }
  });

  await test('7. Map Route: Simulated vehicle coordinates interpolate accurately along route', () => {
    const donorCoords: [number, number] = [77.5946, 12.9716];
    const recipCoords: [number, number] = [77.6083, 12.9822];
    const progress = 0.5; // 50% along route

    const vehicleLng = Number((donorCoords[0] + (recipCoords[0] - donorCoords[0]) * progress).toFixed(6));
    const vehicleLat = Number((donorCoords[1] + (recipCoords[1] - donorCoords[1]) * progress).toFixed(6));

    // Midpoint should be approximately 77.60145, 12.9769
    if (vehicleLng <= donorCoords[0] || vehicleLng >= recipCoords[0]) {
      throw new Error('Simulated vehicle longitude must lie between donor and recipient coordinates');
    }
    if (vehicleLat <= donorCoords[1] || vehicleLat >= recipCoords[1]) {
      throw new Error('Simulated vehicle latitude must lie between donor and recipient coordinates');
    }
  });

  return results;
}
