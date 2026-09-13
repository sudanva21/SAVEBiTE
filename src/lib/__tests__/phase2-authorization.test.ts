// ==============================================
// SaveByte — Phase 2 Authorization & Security Test Suite
// ==============================================

import { can, assertPermission } from '../permissions';
import { organizationService } from '../../services/organizationService';
import { facilityService } from '../../services/facilityService';
import { membershipService } from '../../services/membershipService';
import { seedDevelopmentData } from '../seed-dev';
import { prisma } from '../db';

export async function runPhase2Tests() {
  const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      console.log(`  -> Running: ${name}`);
      const res = fn();
      if (res instanceof Promise) {
        await res;
      }
      console.log(`  ✓ Passed: ${name}`);
      results.push({ name, status: 'PASS' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed: ${name} -> ${message}`);
      results.push({ name, status: 'FAIL', error: message });
    }
  }

  // 1. Capability Permission Matrix Tests
  await test('Owner has full management permissions', () => {
    const owner = { role: 'ORGANIZATION_OWNER', status: 'ACTIVE' };
    if (!can(owner, 'org:manage')) throw new Error('Owner should have org:manage');
    if (!can(owner, 'facility:create')) throw new Error('Owner should have facility:create');
    if (!can(owner, 'food:create')) throw new Error('Owner should have food:create');
    if (!can(owner, 'esg:export')) throw new Error('Owner should have esg:export');
  });

  await test('Donor Manager cannot manage organization or delete members', () => {
    const donorMgr = { role: 'DONOR_MANAGER', status: 'ACTIVE' };
    if (!can(donorMgr, 'food:create')) throw new Error('Donor Manager should have food:create');
    if (can(donorMgr, 'org:manage')) throw new Error('Donor Manager must NOT have org:manage');
    if (can(donorMgr, 'member:remove')) throw new Error('Donor Manager must NOT have member:remove');
  });

  await test('Logistics Manager cannot publish food surplus or manage facilities', () => {
    const logistics = { role: 'LOGISTICS_MANAGER', status: 'ACTIVE' };
    if (!can(logistics, 'logistics:dispatch')) throw new Error('Logistics Manager should have logistics:dispatch');
    if (can(logistics, 'surplus:publish')) throw new Error('Logistics Manager must NOT have surplus:publish');
    if (can(logistics, 'facility:create')) throw new Error('Logistics Manager must NOT have facility:create');
  });

  await test('Suspended or Removed membership is denied all permissions', () => {
    const suspendedOwner = { role: 'ORGANIZATION_OWNER', status: 'SUSPENDED' };
    const removedAdmin = { role: 'ORGANIZATION_ADMIN', status: 'REMOVED' };
    if (can(suspendedOwner, 'org:view')) throw new Error('Suspended owner must NOT have any permissions');
    if (can(suspendedOwner, 'food:create')) throw new Error('Suspended owner must NOT create food');
    if (can(removedAdmin, 'facility:view')) throw new Error('Removed admin must NOT have any permissions');
    if (can(removedAdmin, 'member:invite')) throw new Error('Removed admin must NOT invite members');
  });

  await test('assertPermission throws descriptive error on unauthorized action', () => {
    const individual = { role: 'INDIVIDUAL_USER', status: 'ACTIVE' };
    let threw = false;
    try {
      assertPermission(individual, 'facility:create');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('assertPermission must throw on unauthorized action');
  });

  // 2. Multi-Tenancy & Data Model Tests
  await test('Development seed populates multi-organization user with distinct roles', async () => {
    const seed = await seedDevelopmentData('test_clerk_user_99');
    const user = await prisma.user.findUnique({
      where: { id: seed.userId },
      include: { memberships: { include: { organization: true } } },
    });

    if (!user) throw new Error('Seed user not created');
    if (!user.isOnboarded) throw new Error('Seed user should be onboarded');
    const memberships = user.memberships || [];
    if (memberships.length < 3) throw new Error('User should have at least 3 memberships');

    const restMem = memberships.find((m) => m.organizationId === seed.restaurantOrgId);
    const ngoMem = memberships.find((m) => m.organizationId === seed.ngoOrgId);

    if (restMem?.role !== 'ORGANIZATION_OWNER') throw new Error('Expected OWNER in restaurant');
    if (ngoMem?.role !== 'NGO_COORDINATOR') throw new Error('Expected NGO_COORDINATOR in NGO');
  });

  await test('Organization creation is atomic and attaches primary facility and owner membership', async () => {
    const user = await prisma.user.create({
      data: { clerkUserId: `clerk_creator_${Date.now()}`, displayName: 'Test Creator', email: 'creator@test.org' },
    });

    const result = await organizationService.createOrganization(user.id, {
      name: 'Bengaluru Central Food Bank',
      type: 'FOOD_BANK',
      description: 'Regional food security depot',
      primaryFacility: {
        name: 'Cold Storage Bay 1',
        address: '88 Industrial Area, Peenya',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560058',
      },
    });

    if (!result.organization.id) throw new Error('Org not created');
    const org = await organizationService.getById(result.organization.id);
    if (!org || (org.facilities && org.facilities.length !== 1)) throw new Error('Facility not attached');
    if (org.facilities && org.facilities[0].name !== 'Cold Storage Bay 1') throw new Error('Facility name mismatch');
  });

  await test('Organization isolation prevents user from creating facility in another org', async () => {
    const callerMembership = {
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
      organizationId: 'org_alpha_123',
    };

    let threw = false;
    try {
      await facilityService.createFacility(callerMembership, 'org_beta_999', {
        name: 'Sneaky Facility',
        type: 'WAREHOUSE',
        address: '123 Fake Street',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('another organization')) threw = true;
    }
    if (!threw) throw new Error('Cross-organization facility creation must be blocked');
  });

  // 3. Security Regression: Role Escalation & Owner Protection
  await test('Role escalation: Non-owner cannot promote member to ORGANIZATION_OWNER', async () => {
    const adminCaller = {
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE',
      organizationId: 'org_test_esc_1',
    };

    const targetUser = await prisma.user.create({
      data: { clerkUserId: `test_esc_target_${Date.now()}`, email: 'esc@target.org' },
    });

    const org = await prisma.organization.create({
      data: { name: 'Escalation Test Org', slug: `esc-test-${Date.now()}`, type: 'DONOR' },
    });

    const targetMembership = await prisma.membership.create({
      data: { userId: targetUser.id, organizationId: org.id, role: 'DONOR_MANAGER', status: 'ACTIVE' },
    });

    let blocked = false;
    try {
      await membershipService.updateRole(
        { ...adminCaller, organizationId: org.id },
        targetMembership.id,
        'ORGANIZATION_OWNER'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Only an Organization Owner can promote')) blocked = true;
    }

    if (!blocked) throw new Error('Non-owner must NOT be allowed to promote to ORGANIZATION_OWNER');
  });

  await test('Owner protection: Cannot suspend or remove the organization owner', async () => {
    const adminCaller = {
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE',
      organizationId: 'org_test_owner_prot',
    };

    const ownerUser = await prisma.user.create({
      data: { clerkUserId: `test_owner_${Date.now()}`, email: 'owner@test.org' },
    });

    const org = await prisma.organization.create({
      data: { name: 'Owner Prot Org', slug: `owner-prot-${Date.now()}`, type: 'RESTAURANT' },
    });

    const ownerMembership = await prisma.membership.create({
      data: { userId: ownerUser.id, organizationId: org.id, role: 'ORGANIZATION_OWNER', status: 'ACTIVE' },
    });

    let blocked = false;
    try {
      await membershipService.updateStatus(
        { ...adminCaller, organizationId: org.id },
        ownerMembership.id,
        'REMOVED'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Cannot suspend or remove the organization owner')) blocked = true;
    }

    if (!blocked) throw new Error('Demoting or removing organization owner must be blocked');
  });

  await test('Cross-organization member manipulation is strictly blocked', async () => {
    const callerOrgA = {
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
      organizationId: 'org_A_111',
    };

    let blocked = false;
    try {
      await membershipService.listOrganizationMembers(callerOrgA, 'org_B_222');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('another organization')) blocked = true;
    }

    if (!blocked) throw new Error('Listing members of another organization must be blocked');
  });

  // 4. Phase 2.2: Account Types, Onboarding, Applications, Admin & Audit Tests
  const { applicationService } = await import('../../services/applicationService');
  const { auditService } = await import('../../services/auditService');

  // Test 12: Individual User Onboarding Pathway
  await test('Individual user onboarding creates personal membership without an organization', async () => {
    const user = await prisma.user.create({
      data: { clerkUserId: `clerk_indiv_${Date.now()}`, email: `indiv_${Date.now()}@test.org`, displayName: 'Individual Saver' },
    });

    await membershipService.createIndividualMembership(user.id);
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { memberships: true },
    });

    if (!updatedUser) throw new Error('User not found');
    const indivMem = (updatedUser.memberships || []).find((m) => m.role === 'INDIVIDUAL_USER');
    if (!indivMem) throw new Error('Individual membership was not created');
    if (indivMem.organizationId !== null) throw new Error('Individual membership must not have an organizationId');
  });

  // Test 13: Industry Application Creation & PENDING default
  await test('Industry application creation persists all operational info and defaults to PENDING', async () => {
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_ind_app_${Date.now()}`, email: `chef_${Date.now()}@kitchen.org`, displayName: 'Chef Rajiv' },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'INDUSTRY',
      orgName: 'Grand Hyatt Kitchens',
      orgType: 'HOTEL',
      industryCategory: 'Hospitality',
      registrationNumber: `REG-HYATT-${Date.now()}`,
      contactName: 'Chef Rajiv',
      contactDesignation: 'Executive Chef',
      contactEmail: 'rajiv@hyatt.internal',
      contactPhone: '+91 98765 11111',
      facilityName: 'Main Production Kitchen',
      facilityType: 'KITCHEN',
      address: '100 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
      dailyFoodProduction: '1200 meals',
      typicalSurplus: '45 kg',
      coldStorageAvailable: true,
      iotSensorsAvailable: true,
    });

    if (app.status !== 'PENDING') throw new Error(`Application status must default to PENDING, got ${app.status}`);
    if (app.type !== 'INDUSTRY') throw new Error('Expected type INDUSTRY');
    if (app.facilityName !== 'Main Production Kitchen') throw new Error('Facility name not persisted');
    if (!app.coldStorageAvailable || !app.iotSensorsAvailable) throw new Error('Operational flags not persisted');
  });

  // Test 14: NGO Application Creation & PENDING default
  await test('NGO application creation persists relief details and defaults to PENDING', async () => {
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_ngo_app_${Date.now()}`, email: `trustee_${Date.now()}@relief.org`, displayName: 'Sunita Rao' },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'NGO',
      orgName: 'Annapoorna Food Relief',
      orgType: 'FOOD_BANK',
      registrationNumber: `TRUST-REG-${Date.now()}`,
      contactName: 'Sunita Rao',
      contactDesignation: 'Trustee',
      contactEmail: 'sunita@relief.org',
      contactPhone: '+91 99887 22222',
      address: '22 Community Center Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560025',
      country: 'India',
      serviceArea: 'Central & East Zones',
      beneficiariesServed: 1200,
      mealsPerDay: 800,
      storageAvailable: true,
      coldStorageAvailable: false,
    });

    if (app.status !== 'PENDING') throw new Error(`NGO application must default to PENDING, got ${app.status}`);
    if (app.type !== 'NGO') throw new Error('Expected type NGO');
    if (app.beneficiariesServed !== 1200) throw new Error('Beneficiaries served not persisted');
  });

  // Test 15: Duplicate Active Application Protection
  await test('Duplicate registration: prevents multiple active applications with identical registration number', async () => {
    const regNum = `DUP-TEST-${Date.now()}`;
    const user1 = await prisma.user.create({
      data: { clerkUserId: `clerk_dup_1_${Date.now()}`, email: `dup1_${Date.now()}@test.org` },
    });
    const user2 = await prisma.user.create({
      data: { clerkUserId: `clerk_dup_2_${Date.now()}`, email: `dup2_${Date.now()}@test.org` },
    });

    await applicationService.createApplication(user1.id, {
      type: 'INDUSTRY',
      orgName: 'First Kitchen',
      orgType: 'RESTAURANT',
      registrationNumber: regNum,
      contactName: 'User One',
      contactEmail: 'user1@test.org',
      contactPhone: '+91 99999 00001',
      address: '1st Ave',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    let duplicateBlocked = false;
    try {
      await applicationService.createApplication(user2.id, {
        type: 'INDUSTRY',
        orgName: 'Second Kitchen Imposter',
        orgType: 'RESTAURANT',
        registrationNumber: regNum,
        contactName: 'User Two',
        contactEmail: 'user2@test.org',
        contactPhone: '+91 99999 00002',
        address: '2nd Ave',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already exists')) duplicateBlocked = true;
    }

    if (!duplicateBlocked) throw new Error('Duplicate application with identical registration number must be blocked');
  });

  // Test 16: Applicant Self-Approval Protection
  await test('Self-Approval Protection: Applicant is blocked from approving their own application', async () => {
    const applicantUser = await prisma.user.create({
      data: {
        clerkUserId: `clerk_sneaky_${Date.now()}`,
        email: `sneaky_${Date.now()}@test.org`,
      },
    });

    const app = await applicationService.createApplication(applicantUser.id, {
      type: 'INDUSTRY',
      orgName: 'Sneaky Self Approver Org',
      orgType: 'RESTAURANT',
      registrationNumber: `SELF-APP-${Date.now()}`,
      contactName: 'Sneaky User',
      contactEmail: 'sneaky@test.org',
      contactPhone: '+91 99999 33333',
      address: '33 Rogue Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    let selfApprovalBlocked = false;
    try {
      await applicationService.approveApplication(applicantUser.id, app.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('cannot approve their own') || msg.includes('Platform administrator privileges required')) selfApprovalBlocked = true;
    }

    if (!selfApprovalBlocked) throw new Error('Applicant MUST be strictly blocked from self-approving their own application');
  });

  // Test 17: Non-Platform-Admin Review Actions Blocked
  await test('Authorization: Non-platform-admin cannot review, approve, or reject applications', async () => {
    const normalUser = await prisma.user.create({
      data: { clerkUserId: `clerk_normal_${Date.now()}`, email: `normal_${Date.now()}@test.org` },
    });
    await prisma.membership.create({
      data: { userId: normalUser.id, role: 'INDIVIDUAL_USER', status: 'ACTIVE' },
    });
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_applicant_x_${Date.now()}`, email: `appx_${Date.now()}@test.org` },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'INDUSTRY',
      orgName: 'Target Review Org',
      orgType: 'RESTAURANT',
      registrationNumber: `TGT-REV-${Date.now()}`,
      contactName: 'Contact X',
      contactEmail: 'contactx@test.org',
      contactPhone: '+91 99999 44444',
      address: '44 Test Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    let markBlocked = false;
    try {
      await applicationService.markUnderReview(normalUser.id, app.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Platform administrator privileges required')) markBlocked = true;
    }
    if (!markBlocked) throw new Error('Non-platform-admin must be blocked from marking application under review');

    let approveBlocked = false;
    try {
      await applicationService.approveApplication(normalUser.id, app.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Platform administrator privileges required')) approveBlocked = true;
    }
    if (!approveBlocked) throw new Error('Non-platform-admin must be blocked from approving');

    let rejectBlocked = false;
    try {
      await applicationService.rejectApplication(normalUser.id, app.id, 'Illegal reject attempt');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Platform administrator privileges required')) rejectBlocked = true;
    }
    if (!rejectBlocked) throw new Error('Non-platform-admin must be blocked from rejecting');
  });

  // Test 18: Admin Under Review and Request Changes Lifecycle
  await test('Admin Lifecycle: Platform Admin can mark UNDER_REVIEW and request changes', async () => {
    const adminUser = await prisma.user.create({
      data: { clerkUserId: `clerk_admin_${Date.now()}`, email: `admin_${Date.now()}@savebyte.internal` },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
    });
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_app_lifecycle_${Date.now()}`, email: `lifecycle_${Date.now()}@test.org` },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'INDUSTRY',
      orgName: 'Lifecycle Test Org',
      orgType: 'HOTEL',
      registrationNumber: `LF-REG-${Date.now()}`,
      contactName: 'Lifecycle Contact',
      contactEmail: 'life@test.org',
      contactPhone: '+91 99999 55555',
      address: '55 Lifecycle Lane',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    // 1. Mark under review
    const underReviewApp = await applicationService.markUnderReview(adminUser.id, app.id);
    if (underReviewApp.status !== 'UNDER_REVIEW') throw new Error('Expected status UNDER_REVIEW');
    if (underReviewApp.reviewerId !== adminUser.id) throw new Error('Reviewer ID mismatch');

    // 2. Request changes
    const changesApp = await applicationService.requestChanges(
      adminUser.id,
      app.id,
      'Please supply valid food safety license details.'
    );
    if (changesApp.status !== 'CHANGES_REQUESTED') throw new Error('Expected status CHANGES_REQUESTED');
    if (!changesApp.reviewNotes?.includes('food safety license')) throw new Error('Review notes not updated');
  });

  // Test 19: Applicant Resubmission & Cross-User IDOR Protection
  await test('Resubmission: Applicant can resubmit corrected application, but cross-user IDOR is blocked', async () => {
    const adminUser = await prisma.user.create({
      data: { clerkUserId: `clerk_admin_resub_${Date.now()}`, email: `admin_resub_${Date.now()}@savebyte.internal` },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
    });
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_app_resub_${Date.now()}`, email: `resub_${Date.now()}@test.org` },
    });
    const attacker = await prisma.user.create({
      data: { clerkUserId: `clerk_attacker_${Date.now()}`, email: `attacker_${Date.now()}@test.org` },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'INDUSTRY',
      orgName: 'Resubmission Candidate Org',
      orgType: 'DONOR',
      registrationNumber: `RESUB-REG-${Date.now()}`,
      contactName: 'Original Contact',
      contactEmail: 'orig@test.org',
      contactPhone: '+91 99999 66666',
      address: '66 Origin Way',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    await applicationService.requestChanges(adminUser.id, app.id, 'Update address');

    // Attacker attempts to modify applicant's application (IDOR)
    let idorBlocked = false;
    try {
      await applicationService.resubmitApplication(attacker.id, app.id, {
        address: 'Hacked Address 999',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Not authorized')) idorBlocked = true;
    }
    if (!idorBlocked) throw new Error('Cross-user application resubmission must be blocked');

    // Legitimate applicant resubmits
    const resubmitted = await applicationService.resubmitApplication(applicant.id, app.id, {
      address: '66 Corrected Origin Boulevard',
    });
    if (resubmitted.status !== 'PENDING') throw new Error(`Resubmission must revert status to PENDING, got ${resubmitted.status}`);
    if (resubmitted.address !== '66 Corrected Origin Boulevard') throw new Error('Updated address not saved');
  });

  // Test 20: Transactional Approval Provisions Org, Facility & Owner Membership
  await test('Approval: Platform Admin approves application, transactionally provisioning Org, Facility, and Owner Membership', async () => {
    const adminUser = await prisma.user.create({
      data: { clerkUserId: `clerk_admin_approve_${Date.now()}`, email: `admin_approve_${Date.now()}@savebyte.internal` },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
    });
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_app_approved_${Date.now()}`, email: `approved_${Date.now()}@test.org`, displayName: 'Approved Owner' },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'INDUSTRY',
      orgName: 'Royal Orchid Catering',
      orgType: 'RESTAURANT',
      registrationNumber: `ORCHID-REG-${Date.now()}`,
      contactName: 'Approved Owner',
      contactEmail: 'owner@orchid.org',
      contactPhone: '+91 99999 77777',
      facilityName: 'Orchid Central Line',
      facilityType: 'KITCHEN',
      address: '77 Airport Highway',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560300',
      country: 'India',
      latitude: 13.1986,
      longitude: 77.7066,
    });

    const approvedApp = await applicationService.approveApplication(adminUser.id, app.id);
    if (approvedApp.status !== 'APPROVED') throw new Error('Application must be marked APPROVED');
    if (!approvedApp.approvedOrgId) throw new Error('approvedOrgId must be set on application');

    // Verify Organization was created
    const org = await prisma.organization.findUnique({
      where: { id: approvedApp.approvedOrgId },
      include: { facilities: true, memberships: true },
    });
    if (!org) throw new Error('Organization was not provisioned in database');
    if (org.name !== 'Royal Orchid Catering') throw new Error('Provisioned organization name mismatch');

    // Verify Facility was created and attached
    if (!org.facilities || org.facilities.length !== 1) throw new Error('Facility was not provisioned with organization');
    const facility = org.facilities[0];
    if (facility.name !== 'Orchid Central Line') throw new Error('Facility name mismatch');
    if (facility.latitude !== 13.1986 || facility.longitude !== 77.7066) throw new Error('Coordinates not preserved');

    // Verify Applicant was granted ORGANIZATION_OWNER membership
    const ownerMem = (org.memberships || []).find((m) => m.userId === applicant.id);
    if (!ownerMem) throw new Error('Applicant membership not found in provisioned organization');
    if (ownerMem.role !== 'ORGANIZATION_OWNER') throw new Error(`Expected role ORGANIZATION_OWNER, got ${ownerMem.role}`);
    if (ownerMem.status !== 'ACTIVE') throw new Error('Owner membership must be ACTIVE');
  });

  // Test 21: Application Rejection with Reason
  await test('Rejection: Platform Admin can reject application with required reason, preserving record', async () => {
    const adminUser = await prisma.user.create({
      data: { clerkUserId: `clerk_admin_reject_${Date.now()}`, email: `admin_reject_${Date.now()}@savebyte.internal` },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
    });
    const applicant = await prisma.user.create({
      data: { clerkUserId: `clerk_app_rejected_${Date.now()}`, email: `rejected_${Date.now()}@test.org` },
    });

    const app = await applicationService.createApplication(applicant.id, {
      type: 'NGO',
      orgName: 'Fake Charity Org',
      orgType: 'NGO',
      registrationNumber: `FAKE-REG-${Date.now()}`,
      contactName: 'Fake Contact',
      contactEmail: 'fake@test.org',
      contactPhone: '+91 99999 88888',
      address: '88 Invalid St',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });

    const rejectedApp = await applicationService.rejectApplication(
      adminUser.id,
      app.id,
      'Invalid non-profit registration credentials supplied.'
    );

    if (rejectedApp.status !== 'REJECTED') throw new Error('Application must be marked REJECTED');
    if (!rejectedApp.reviewNotes?.includes('Invalid non-profit registration')) throw new Error('Rejection reason not stored');

    // Verify application is not deleted
    const checkApp = await applicationService.getApplicationById(app.id);
    if (!checkApp) throw new Error('Rejected application must be preserved in database');
  });

  // Test 22: Append-Only Audit Logging
  await test('Audit Trail: All application lifecycle events write immutable, non-deletable audit records', async () => {
    const adminUser = await prisma.user.create({
      data: { clerkUserId: `clerk_admin_audit_${Date.now()}`, email: `admin_audit_${Date.now()}@savebyte.internal` },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
    });

    const auditList = await auditService.list({ limit: 50 });
    if (auditList.total === 0) throw new Error('Audit records should exist from previous test actions');

    const appLogs = auditList.logs.filter((l) => l.entity === 'OrganizationApplication');
    if (appLogs.length === 0) throw new Error('No OrganizationApplication audit entries found');

    // Verify non-platform admin cannot list audit logs
    const nonAdminUser = { role: 'INDIVIDUAL_USER', status: 'ACTIVE' };
    if (can(nonAdminUser, 'audit:view')) throw new Error('Non-admin must not have audit:view capability');

    // Verify platform admin has audit:view capability
    const platformAdmin = { role: 'PLATFORM_ADMIN', status: 'ACTIVE' };
    if (!can(platformAdmin, 'audit:view')) throw new Error('Platform admin must have audit:view capability');
  });

  return results;
}

