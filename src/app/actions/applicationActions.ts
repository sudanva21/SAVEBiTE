'use server';

// ==============================================
// SaveByte — Application Server Actions (Phase 2.2)
// ==============================================

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authorizationService } from '@/services/authorizationService';
import { applicationService, CreateApplicationInput } from '@/services/applicationService';

/**
 * Submits an Industry Organization Onboarding Application.
 */
export async function submitIndustryApplicationAction(formData: FormData) {
  const context = await authorizationService.requireContext();
  const userId = context.user.id;

  const orgName = formData.get('orgName') as string;
  const orgType = (formData.get('orgType') as string) || 'RESTAURANT';
  const industryCategory = formData.get('industryCategory') as string;
  const registrationNumber = formData.get('registrationNumber') as string;
  const website = formData.get('website') as string;
  const description = formData.get('description') as string;

  const contactName = formData.get('contactName') as string;
  const contactDesignation = formData.get('contactDesignation') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;

  const facilityName = formData.get('facilityName') as string;
  const facilityType = (formData.get('facilityType') as string) || 'KITCHEN';
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const postalCode = formData.get('postalCode') as string;
  const country = (formData.get('country') as string) || 'India';
  const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined;
  const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined;

  const dailyFoodProduction = formData.get('dailyFoodProduction') as string;
  const dailyFoodConsumption = formData.get('dailyFoodConsumption') as string;
  const typicalSurplus = formData.get('typicalSurplus') as string;
  const foodCategories = formData.get('foodCategories') as string;
  const operatingHours = formData.get('operatingHours') as string;
  const wasteHandlingMethod = formData.get('wasteHandlingMethod') as string;
  const existingDonationProcess = formData.get('existingDonationProcess') as string;
  const coldStorageAvailable = formData.get('coldStorageAvailable') === 'true' || formData.get('coldStorageAvailable') === 'on';
  const iotSensorsAvailable = formData.get('iotSensorsAvailable') === 'true' || formData.get('iotSensorsAvailable') === 'on';

  const input: CreateApplicationInput = {
    type: 'INDUSTRY',
    orgName,
    orgType,
    industryCategory,
    registrationNumber,
    website,
    description,
    contactName,
    contactDesignation,
    contactEmail,
    contactPhone,
    facilityName,
    facilityType,
    address,
    city,
    state,
    postalCode,
    country,
    latitude,
    longitude,
    dailyFoodProduction,
    dailyFoodConsumption,
    typicalSurplus,
    foodCategories,
    operatingHours,
    wasteHandlingMethod,
    existingDonationProcess,
    coldStorageAvailable,
    iotSensorsAvailable,
  };

  const app = await applicationService.createApplication(userId, input);

  revalidatePath('/onboarding');
  revalidatePath('/onboarding/status');

  redirect(`/onboarding/status?appId=${app.id}`);
}

/**
 * Submits an NGO / Relief Charity Organization Onboarding Application.
 */
export async function submitNgoApplicationAction(formData: FormData) {
  const context = await authorizationService.requireContext();
  const userId = context.user.id;

  const orgName = formData.get('orgName') as string;
  const orgType = (formData.get('orgType') as string) || 'NGO';
  const registrationNumber = formData.get('registrationNumber') as string;
  const website = formData.get('website') as string;
  const description = formData.get('description') as string;

  const contactName = formData.get('contactName') as string;
  const contactDesignation = formData.get('contactDesignation') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;

  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const postalCode = formData.get('postalCode') as string;
  const country = (formData.get('country') as string) || 'India';
  const serviceArea = formData.get('serviceArea') as string;
  const beneficiariesServed = formData.get('beneficiariesServed') ? parseInt(formData.get('beneficiariesServed') as string, 10) : undefined;
  const mealsPerDay = formData.get('mealsPerDay') ? parseInt(formData.get('mealsPerDay') as string, 10) : undefined;
  const foodCategories = formData.get('foodCategories') as string;
  const pickupDeliveryWindows = formData.get('pickupDeliveryWindows') as string;
  const storageAvailable = formData.get('storageAvailable') === 'true' || formData.get('storageAvailable') === 'on';
  const coldStorageAvailable = formData.get('coldStorageAvailable') === 'true' || formData.get('coldStorageAvailable') === 'on';

  const input: CreateApplicationInput = {
    type: 'NGO',
    orgName,
    orgType,
    registrationNumber,
    website,
    description,
    contactName,
    contactDesignation,
    contactEmail,
    contactPhone,
    address,
    city,
    state,
    postalCode,
    country,
    serviceArea,
    beneficiariesServed,
    mealsPerDay,
    foodCategories,
    pickupDeliveryWindows,
    storageAvailable,
    coldStorageAvailable,
  };

  const app = await applicationService.createApplication(userId, input);

  revalidatePath('/onboarding');
  revalidatePath('/onboarding/status');

  redirect(`/onboarding/status?appId=${app.id}`);
}

/**
 * Resubmits an application with corrected information following CHANGES_REQUESTED review.
 */
export async function resubmitApplicationAction(applicationId: string, formData: FormData) {
  const context = await authorizationService.requireContext();
  const userId = context.user.id;

  const orgName = formData.get('orgName') as string;
  const registrationNumber = formData.get('registrationNumber') as string;
  const website = formData.get('website') as string;
  const description = formData.get('description') as string;
  const contactName = formData.get('contactName') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const postalCode = formData.get('postalCode') as string;

  const app = await applicationService.resubmitApplication(userId, applicationId, {
    orgName: orgName || undefined,
    registrationNumber: registrationNumber || undefined,
    website: website || undefined,
    description: description || undefined,
    contactName: contactName || undefined,
    contactEmail: contactEmail || undefined,
    contactPhone: contactPhone || undefined,
    address: address || undefined,
    city: city || undefined,
    state: state || undefined,
    postalCode: postalCode || undefined,
  });

  revalidatePath('/onboarding');
  revalidatePath('/onboarding/status');
  revalidatePath(`/admin/applications/${applicationId}`);

  return { success: true, application: app };
}

/**
 * Retrieves the caller's submitted applications.
 */
export async function getUserApplicationsAction() {
  const context = await authorizationService.requireContext();
  const applications = await applicationService.getUserApplications(context.user.id);
  return { success: true, applications };
}
