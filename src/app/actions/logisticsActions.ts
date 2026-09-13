'use server';

// ==============================================
// SaveByte — Logistics & Route Server Actions (Phase 4)
// ==============================================

import { revalidatePath } from 'next/cache';
import { logisticsService } from '@/services/logisticsService';

/**
 * Lists delivery routes for the user's organization or actor.
 */
export async function listRoutesAction(status?: string) {
  try {
    const routes = await logisticsService.listRoutes(status ? { status } : undefined);
    return { success: true, routes };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to list routes' };
  }
}

/**
 * Retrieves a specific route by ID with security checks.
 */
export async function getRouteAction(routeId: string) {
  try {
    const route = await logisticsService.getRoute(routeId);
    return { success: true, route };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to retrieve route' };
  }
}

/**
 * Assigns a vehicle, driver, and schedules to a route.
 */
export async function assignRouteAction(
  routeId: string,
  vehicleId?: string,
  driverUserId?: string,
  _scheduledPickupTime?: string,
  _scheduledDeliveryTime?: string
) {
  try {
    const route = await logisticsService.assignRoute(routeId, {
      vehicleId,
      driverUserId,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/routes');
    revalidatePath('/dashboard/recovery');

    return { success: true, route };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign route' };
  }
}

/**
 * Updates route status through the physical logistics lifecycle:
 * PLANNED -> ASSIGNED -> EN_ROUTE_TO_PICKUP -> AT_PICKUP -> COLLECTED (requires PIN) -> EN_ROUTE_TO_DESTINATION -> DELIVERED
 */
export async function updateRouteStatusAction(
  routeId: string,
  newStatus: string,
  verificationPin?: string,
  notes?: string
) {
  try {
    const route = await logisticsService.updateRouteStatus(routeId, newStatus, {
      verificationPin,
      notes,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/routes');
    revalidatePath('/dashboard/recovery');
    revalidatePath('/dashboard/surplus');

    return { success: true, route };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update route status' };
  }
}

/**
 * Registers a new fleet vehicle for food recovery logistics.
 */
export async function createVehicleAction(formData: FormData) {
  try {
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const capacity = parseFloat(formData.get('capacity') as string);
    const unit = (formData.get('unit') as string) || 'kg';
    const refrigerationSupported = formData.get('refrigerationSupported') === 'true';

    const vehicle = await logisticsService.createVehicle({
      vehicleNumber,
      vehicleType,
      capacity,
      unit,
      refrigerationSupported,
    });

    revalidatePath('/dashboard/routes');

    return { success: true, vehicle };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create vehicle' };
  }
}

/**
 * Lists fleet vehicles for the user's active organization.
 */
export async function listVehiclesAction(_activeOnly: boolean = true) {
  try {
    const vehicles = await logisticsService.listVehicles();
    return { success: true, vehicles };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to list vehicles' };
  }
}

/**
 * Aggregates real operational metrics for the logistics dashboard.
 */
export async function getLogisticsOverviewAction() {
  try {
    const metrics = await logisticsService.getLogisticsOverview();
    return { success: true, metrics };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get logistics metrics' };
  }
}
