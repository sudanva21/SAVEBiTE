// ==============================================
// SaveByte — Organization Application Service (Phase 2.2)
// ==============================================

import { prisma } from '@/lib/db';
import { OrganizationApplication } from '@/generated/prisma';
import { auditService } from './auditService';
import { ApplicationStatus, ApplicationType } from '@/types';

export interface CreateApplicationInput {
  type: ApplicationType;
  orgName: string;
  orgType: string;
  industryCategory?: string;
  registrationNumber?: string;
  website?: string;
  description?: string;
  contactName: string;
  contactDesignation?: string;
  contactEmail: string;
  contactPhone?: string;
  facilityName?: string;
  facilityType?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  serviceArea?: string;
  beneficiariesServed?: number;
  mealsPerDay?: number;
  dailyFoodProduction?: string;
  dailyFoodConsumption?: string;
  typicalSurplus?: string;
  foodCategories?: string;
  operatingHours?: string;
  wasteHandlingMethod?: string;
  existingDonationProcess?: string;
  coldStorageAvailable?: boolean;
  iotSensorsAvailable?: boolean;
  storageAvailable?: boolean;
  pickupDeliveryWindows?: string;
}

export interface UpdateApplicationInput {
  orgName?: string;
  orgType?: string;
  industryCategory?: string;
  registrationNumber?: string;
  website?: string;
  description?: string;
  contactName?: string;
  contactDesignation?: string;
  contactEmail?: string;
  contactPhone?: string;
  facilityName?: string;
  facilityType?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  serviceArea?: string;
  beneficiariesServed?: number;
  mealsPerDay?: number;
  dailyFoodProduction?: string;
  dailyFoodConsumption?: string;
  typicalSurplus?: string;
  foodCategories?: string;
  operatingHours?: string;
  wasteHandlingMethod?: string;
  existingDonationProcess?: string;
  coldStorageAvailable?: boolean;
  iotSensorsAvailable?: boolean;
  storageAvailable?: boolean;
  pickupDeliveryWindows?: string;
}

export interface ApplicationListFilters {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const entropy = Math.random().toString(36).substring(2, 6);
  return `${base}-${entropy}`;
}

async function requirePlatformAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: true },
  });
  if (!user) {
    throw new Error('Forbidden: Platform administrator privileges required');
  }
  const isPlatformAdmin =
    user.role === 'PLATFORM_ADMIN' ||
    user.memberships?.some(
      (m: { role: string; status: string }) => m.role === 'PLATFORM_ADMIN' && m.status === 'ACTIVE'
    );
  if (!isPlatformAdmin) {
    throw new Error('Forbidden: Platform administrator privileges required');
  }
  return user;
}

export const applicationService = {
  /**
   * Submits a new Industry or NGO Organization Application.
   */
  async createApplication(
    applicantUserId: string,
    data: CreateApplicationInput
  ): Promise<OrganizationApplication> {
    if (!applicantUserId) {
      throw new Error('Applicant user ID is required');
    }

    const orgName = data.orgName?.trim();
    if (!orgName) {
      throw new Error('Organization name is required');
    }

    const contactEmail = data.contactEmail?.trim().toLowerCase();
    if (!contactEmail || !contactEmail.includes('@')) {
      throw new Error('A valid contact email is required');
    }

    const contactName = data.contactName?.trim();
    if (!contactName) {
      throw new Error('Contact person name is required');
    }

    // 1. Duplicate Application Protection:
    // Check if an active application already exists for this registration number or contact/org combination
    const activeStatuses: ApplicationStatus[] = ['PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];

    if (data.registrationNumber?.trim()) {
      const reg = data.registrationNumber.trim();
      const existingByReg = await prisma.organizationApplication.findFirst({
        where: {
          registrationNumber: reg,
          status: { in: activeStatuses },
        },
      });

      if (existingByReg) {
        throw new Error(
          `An active application with registration number "${reg}" already exists.`
        );
      }
    }

    const existingByContactAndName = await prisma.organizationApplication.findFirst({
      where: {
        applicantId: applicantUserId,
        status: { in: activeStatuses },
      },
    });

    if (existingByContactAndName) {
      throw new Error(
        'You already have an active application under review. Please await evaluation before submitting another.'
      );
    }

    // 2. Persist application with default status PENDING
    const application = await prisma.organizationApplication.create({
      data: {
        applicantId: applicantUserId,
        type: data.type,
        status: 'PENDING',
        orgName,
        orgType: data.orgType,
        industryCategory: data.industryCategory || null,
        registrationNumber: data.registrationNumber?.trim() || null,
        website: data.website?.trim() || null,
        description: data.description?.trim() || null,
        contactName,
        contactDesignation: data.contactDesignation?.trim() || null,
        contactEmail,
        contactPhone: data.contactPhone?.trim() || null,
        facilityName: data.facilityName?.trim() || null,
        facilityType: data.facilityType || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        country: data.country?.trim() || 'India',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        serviceArea: data.serviceArea?.trim() || null,
        beneficiariesServed: data.beneficiariesServed ?? null,
        mealsPerDay: data.mealsPerDay ?? null,
        dailyFoodProduction: data.dailyFoodProduction?.trim() || null,
        dailyFoodConsumption: data.dailyFoodConsumption?.trim() || null,
        typicalSurplus: data.typicalSurplus?.trim() || null,
        foodCategories: data.foodCategories?.trim() || null,
        operatingHours: data.operatingHours?.trim() || null,
        wasteHandlingMethod: data.wasteHandlingMethod?.trim() || null,
        existingDonationProcess: data.existingDonationProcess?.trim() || null,
        coldStorageAvailable: Boolean(data.coldStorageAvailable),
        iotSensorsAvailable: Boolean(data.iotSensorsAvailable),
        storageAvailable: Boolean(data.storageAvailable),
        pickupDeliveryWindows: data.pickupDeliveryWindows?.trim() || null,
      },
      include: {
        applicant: true,
      },
    });

    // 3. Append immutable audit log
    await auditService.log({
      actorId: applicantUserId,
      action: 'application.submitted',
      entity: 'OrganizationApplication',
      entityId: application.id,
      newState: { status: 'PENDING', orgName, type: data.type },
      reason: 'Initial application submission',
    });

    return application;
  },

  /**
   * Retrieves all applications submitted by a specific user.
   */
  async getUserApplications(applicantUserId: string): Promise<OrganizationApplication[]> {
    return prisma.organizationApplication.findMany({
      where: { applicantId: applicantUserId },
      include: {
        applicant: true,
        reviewer: true,
        approvedOrganization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Retrieves a single application by ID with full relations.
   */
  async getApplicationById(applicationId: string): Promise<OrganizationApplication | null> {
    return prisma.organizationApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        reviewer: true,
        approvedOrganization: {
          include: { facilities: true },
        },
      },
    });
  },

  /**
   * Allows an applicant to edit and resubmit an application in CHANGES_REQUESTED status.
   */
  async resubmitApplication(
    applicantUserId: string,
    applicationId: string,
    updateData: UpdateApplicationInput
  ): Promise<OrganizationApplication> {
    const existing = await prisma.organizationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!existing) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (existing.applicantId !== applicantUserId) {
      throw new Error('Forbidden: Not authorized to edit this application');
    }

    if (existing.status !== 'CHANGES_REQUESTED') {
      throw new Error(
        `Cannot resubmit application with status "${existing.status}". Only applications with "CHANGES_REQUESTED" can be resubmitted.`
      );
    }

    const previousState = { ...existing };

    const updated = await prisma.organizationApplication.update({
      where: { id: applicationId },
      data: {
        ...updateData,
        status: 'PENDING', // Resets back to PENDING review
      },
      include: {
        applicant: true,
      },
    });

    await auditService.log({
      actorId: applicantUserId,
      action: 'application.resubmitted',
      entity: 'OrganizationApplication',
      entityId: applicationId,
      previousState: { status: previousState.status, feedback: previousState.reviewFeedback },
      newState: { status: 'PENDING' },
      reason: 'Applicant resubmitted with requested revisions',
    });

    return updated;
  },

  /**
   * Paginated and filterable list of applications for Platform Admins.
   */
  async listApplications(
    adminUserId: string,
    filters: ApplicationListFilters = {}
  ): Promise<{
    applications: OrganizationApplication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { orgName: { contains: q } },
        { contactName: { contains: q } },
        { contactEmail: { contains: q } },
        { registrationNumber: { contains: q } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.organizationApplication.findMany({
        where,
        include: {
          applicant: true,
          reviewer: true,
          approvedOrganization: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.organizationApplication.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Transitions an application into UNDER_REVIEW state.
   */
  async markUnderReview(
    adminUserId: string,
    applicationId: string
  ): Promise<OrganizationApplication> {
    await requirePlatformAdminUser(adminUserId);

    const app = await prisma.organizationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (app.applicantId === adminUserId && process.env.NODE_ENV === 'production') {
      throw new Error('Security violation: Administrators cannot review their own applications');
    }

    if (app.status !== 'PENDING') {
      return app;
    }

    const updated = await prisma.organizationApplication.update({
      where: { id: applicationId },
      data: {
        status: 'UNDER_REVIEW',
        reviewer: { connect: { id: adminUserId } },
        reviewedAt: new Date(),
      },
      include: {
        applicant: true,
        reviewer: true,
      },
    });

    await auditService.log({
      actorId: adminUserId,
      action: 'application.reviewed',
      entity: 'OrganizationApplication',
      entityId: applicationId,
      previousState: { status: 'PENDING' },
      newState: { status: 'UNDER_REVIEW' },
      reason: 'Platform administrator began formal review',
    });

    return updated;
  },

  /**
   * Approves an application transactionally:
   * 1. Marks application APPROVED.
   * 2. Creates Organization with slug.
   * 3. Creates primary Facility with location coordinates.
   * 4. Creates Membership assigning applicant as ORGANIZATION_OWNER.
   * 5. Links approvedOrgId to application.
   * 6. Marks user as onboarded.
   * 7. Records audit log.
   */
  async approveApplication(
    adminUserId: string,
    applicationId: string
  ): Promise<OrganizationApplication & {
    application: OrganizationApplication;
    organizationId: string;
    facilityId: string;
    membershipId: string;
  }> {
    const app = await prisma.organizationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // CRITICAL: Self-approval protection
    if (app.applicantId === adminUserId && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Security violation: An applicant cannot approve their own organization application'
      );
    }

    await requirePlatformAdminUser(adminUserId);

    if (app.status === 'APPROVED') {
      throw new Error('Application is already approved');
    }

    const slug = generateSlug(app.orgName);
    const facilityName = app.facilityName?.trim() || `${app.orgName} Central Hub`;
    const facilityType =
      app.facilityType || (app.type === 'NGO' ? 'DISTRIBUTION_CENTER' : 'KITCHEN');
    const facilityAddress = app.address?.trim() || 'Headquarters location on file';

    // Execute atomic provisioning transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: app.orgName,
          slug,
          type: app.orgType,
          description: app.description || null,
          email: app.contactEmail,
          phone: app.contactPhone || null,
          website: app.website || null,
          isVerified: true,
        },
      });

      // 2. Create Primary Facility
      const fac = await tx.facility.create({
        data: {
          organizationId: org.id,
          name: facilityName,
          type: facilityType,
          address: facilityAddress,
          city: app.city || null,
          state: app.state || null,
          postalCode: app.postalCode || null,
          country: app.country || 'India',
          latitude: app.latitude ?? null,
          longitude: app.longitude ?? null,
          operatingStatus: 'ACTIVE',
          isPrimary: true,
        },
      });

      // 3. Create Owner Membership for the applicant
      const mem = await tx.membership.create({
        data: {
          userId: app.applicantId,
          organizationId: org.id,
          role: 'ORGANIZATION_OWNER',
          status: 'ACTIVE',
        },
      });

      // 4. Update Application status to APPROVED
      const approvedApp = await tx.organizationApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewer: { connect: { id: adminUserId } },
          reviewedAt: new Date(),
          approvedOrganization: { connect: { id: org.id } },
        },
        include: {
          applicant: true,
          reviewer: true,
          approvedOrganization: true,
        },
      });

      // 5. Mark user onboarded
      await tx.user.update({
        where: { id: app.applicantId },
        data: { isOnboarded: true },
      });

      return {
        application: approvedApp,
        organizationId: org.id,
        facilityId: fac.id,
        membershipId: mem.id,
      };
    });

    // 6. Record immutable audit log
    await auditService.log({
      actorId: adminUserId,
      action: 'application.approved',
      entity: 'OrganizationApplication',
      entityId: applicationId,
      previousState: { status: app.status },
      newState: {
        status: 'APPROVED',
        organizationId: result.organizationId,
        facilityId: result.facilityId,
        membershipId: result.membershipId,
      },
      reason: 'Application approved and operational organization provisioned',
    });

    return {
      ...result.application,
      application: result.application,
      organizationId: result.organizationId,
      facilityId: result.facilityId,
      membershipId: result.membershipId,
    };
  },

  /**
   * Rejects an application with a mandatory reason.
   */
  async rejectApplication(
    adminUserId: string,
    applicationId: string,
    reason: string
  ): Promise<OrganizationApplication> {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new Error('A detailed reason is mandatory when rejecting an application');
    }

    const app = await prisma.organizationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (app.applicantId === adminUserId && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Security violation: An applicant cannot reject their own organization application'
      );
    }

    await requirePlatformAdminUser(adminUserId);

    const previousStatus = app.status;

    const updated = await prisma.organizationApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewer: { connect: { id: adminUserId } },
        reviewFeedback: trimmedReason,
        reviewedAt: new Date(),
      },
      include: {
        applicant: true,
        reviewer: true,
      },
    });

    await auditService.log({
      actorId: adminUserId,
      action: 'application.rejected',
      entity: 'OrganizationApplication',
      entityId: applicationId,
      previousState: { status: previousStatus },
      newState: { status: 'REJECTED', reason: trimmedReason },
      reason: trimmedReason,
    });

    return { ...updated, reviewNotes: updated.reviewFeedback } as any;
  },

  /**
   * Requests changes on an application with specific guidance/feedback for the applicant.
   */
  async requestChanges(
    adminUserId: string,
    applicationId: string,
    feedback: string
  ): Promise<OrganizationApplication> {
    const trimmedFeedback = feedback?.trim();
    if (!trimmedFeedback) {
      throw new Error('Feedback message is required when requesting changes on an application');
    }

    const app = await prisma.organizationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (app.applicantId === adminUserId && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Security violation: An applicant cannot request changes on their own application'
      );
    }

    await requirePlatformAdminUser(adminUserId);

    const previousStatus = app.status;

    const updated = await prisma.organizationApplication.update({
      where: { id: applicationId },
      data: {
        status: 'CHANGES_REQUESTED',
        reviewer: { connect: { id: adminUserId } },
        reviewFeedback: trimmedFeedback,
        reviewedAt: new Date(),
      },
      include: {
        applicant: true,
        reviewer: true,
      },
    });

    await auditService.log({
      actorId: adminUserId,
      action: 'application.changes_requested',
      entity: 'OrganizationApplication',
      entityId: applicationId,
      previousState: { status: previousStatus },
      newState: { status: 'CHANGES_REQUESTED', feedback: trimmedFeedback },
      reason: trimmedFeedback,
    });

    return { ...updated, reviewNotes: updated.reviewFeedback } as any;
  },

  /**
   * Calculates real metrics for the Platform Admin Dashboard.
   */
  async getAdminStats() {
    const [
      pendingCount,
      underReviewCount,
      changesRequestedCount,
      approvedCount,
      rejectedCount,
      industryPending,
      ngoPending,
      totalOrgs,
      totalIndustryOrgs,
      totalNgoOrgs,
      totalUsers,
      recentApplications,
      recentAudit,
    ] = await Promise.all([
      prisma.organizationApplication.count({ where: { status: 'PENDING' } }),
      prisma.organizationApplication.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.organizationApplication.count({ where: { status: 'CHANGES_REQUESTED' } }),
      prisma.organizationApplication.count({ where: { status: 'APPROVED' } }),
      prisma.organizationApplication.count({ where: { status: 'REJECTED' } }),
      prisma.organizationApplication.count({ where: { status: 'PENDING', type: 'INDUSTRY' } }),
      prisma.organizationApplication.count({ where: { status: 'PENDING', type: 'NGO' } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { type: 'DONOR' } }),
      prisma.organization.count({ where: { type: 'NGO' } }),
      prisma.user.count(),
      prisma.organizationApplication.findMany({
        include: { applicant: true, reviewer: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      auditService.list({ limit: 8 }).then((res) => res.logs),
    ]);

    return {
      pending: pendingCount,
      underReview: underReviewCount,
      changesRequested: changesRequestedCount,
      approved: approvedCount,
      rejected: rejectedCount,
      pendingIndustry: industryPending,
      pendingNgo: ngoPending,
      approvedTotal: approvedCount,
      rejectedTotal: rejectedCount,
      totalOrganizations: totalOrgs,
      totalIndustryOrgs,
      totalNgoOrgs,
      totalUsers,
      recentApplications,
      recentAudit,
    };
  },
};
