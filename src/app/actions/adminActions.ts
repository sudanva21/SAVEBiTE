'use server';

// ==============================================
// SaveByte — Platform Administration Server Actions (Phase 2.2)
// ==============================================

import { revalidatePath } from 'next/cache';
import { authorizationService } from '@/services/authorizationService';
import { applicationService, ApplicationListFilters } from '@/services/applicationService';
import { auditService, AuditListFilters } from '@/services/auditService';

/**
 * Retrieves real DB metrics for the Platform Admin Dashboard.
 */
export async function getAdminDashboardStatsAction() {
  await authorizationService.requirePlatformAdmin();
  const stats = await applicationService.getAdminStats();
  return { success: true, stats };
}

/**
 * Lists organization applications with filters and pagination.
 */
export async function listApplicationsAction(filters: ApplicationListFilters = {}) {
  const { context } = await authorizationService.requirePlatformAdmin();
  const result = await applicationService.listApplications(context.user.id, filters);
  return { success: true, ...result };
}

/**
 * Retrieves full details for a single application.
 */
export async function getApplicationDetailAction(applicationId: string) {
  await authorizationService.requirePlatformAdmin();
  const application = await applicationService.getApplicationById(applicationId);
  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }
  return { success: true, application };
}

/**
 * Transitions an application from PENDING to UNDER_REVIEW.
 */
export async function markApplicationUnderReviewAction(applicationId: string) {
  const { context } = await authorizationService.requirePlatformAdmin();
  const application = await applicationService.markUnderReview(context.user.id, applicationId);
  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${applicationId}`);
  return { success: true, application };
}

/**
 * Approves an application and provisions Organization, Facility, and Owner Membership.
 */
export async function approveApplicationAction(applicationId: string) {
  const { context } = await authorizationService.requirePlatformAdmin();
  const result = await applicationService.approveApplication(context.user.id, applicationId);

  revalidatePath('/admin');
  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath('/onboarding');
  revalidatePath('/dashboard');

  return { success: true, ...result };
}

/**
 * Rejects an application with a mandatory reason.
 */
export async function rejectApplicationAction(applicationId: string, reason: string) {
  const { context } = await authorizationService.requirePlatformAdmin();
  const application = await applicationService.rejectApplication(context.user.id, applicationId, reason);

  revalidatePath('/admin');
  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath('/onboarding');

  return { success: true, application };
}

/**
 * Requests changes on an application with specific guidance feedback.
 */
export async function requestChangesAction(applicationId: string, feedback: string) {
  const { context } = await authorizationService.requirePlatformAdmin();
  const application = await applicationService.requestChanges(context.user.id, applicationId, feedback);

  revalidatePath('/admin');
  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath('/onboarding');

  return { success: true, application };
}

/**
 * Lists immutable audit logs for Platform Admins.
 */
export async function listAuditLogsAction(filters: AuditListFilters = {}) {
  await authorizationService.requirePlatformAdmin();
  const result = await auditService.list(filters);
  return { success: true, ...result };
}
