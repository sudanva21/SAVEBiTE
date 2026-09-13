// ==============================================
// SaveByte — Logistics & Route Service (Phase 4)
// ==============================================

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { DeliveryRoute, Vehicle } from '@/generated/prisma';

export interface VehicleInput {
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  unit?: string;
  refrigerationSupported?: boolean;
}

export interface RouteAssignmentInput {
  vehicleId?: string;
  driverUserId?: string;
  driverName?: string;
  driverPhone?: string;
  logisticsOrganizationId?: string;
}

export interface RouteStatusUpdateMetadata {
  notes?: string;
  verificationPin?: string;
}

export const logisticsService = {
  // ==============================================
  // 1. Vehicle Fleet Management
  // ==============================================

  async createVehicle(
    data: VehicleInput,
    explicitOrgId?: string | null
  ): Promise<Vehicle> {
    const { organization, context } =
      await authorizationService.requirePermission('logistics:manage', explicitOrgId);

    const vehicleNumber = data.vehicleNumber.trim().toUpperCase();
    if (!vehicleNumber) {
      throw new Error('Validation Error: Vehicle registration number is required');
    }

    const capacity = Number(data.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      throw new Error('Validation Error: Vehicle capacity must be a positive number');
    }

    // Check existing vehicle number in this organization
    const existing = await prisma.vehicle.findFirst({
      where: {
        organizationId: organization.id,
        vehicleNumber,
      },
    });

    if (existing) {
      throw new Error(`Conflict: Vehicle with registration ${vehicleNumber} already exists in your fleet`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId: organization.id,
        vehicleNumber,
        vehicleType: data.vehicleType || 'VAN',
        capacity,
        unit: data.unit || 'kg',
        refrigerationSupported: data.refrigerationSupported ?? false,
        currentStatus: 'AVAILABLE',
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'logistics.vehicle_created',
      entity: 'Vehicle',
      entityId: vehicle.id,
      previousState: null,
      newState: { vehicleNumber, capacity, type: data.vehicleType },
      reason: 'New fleet vehicle registered for food recovery transport',
      context: { organizationId: organization.id },
    });

    return vehicle;
  },

  async listVehicles(
    explicitOrgId?: string | null
  ): Promise<Vehicle[]> {
    const { organization } = await authorizationService.requirePermission(
      'route:view',
      explicitOrgId
    );

    return prisma.vehicle.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });
  },

  // ==============================================
  // 2. Delivery Route Management
  // ==============================================

  async listRoutes(
    filters?: { status?: string },
    explicitOrgId?: string | null
  ): Promise<DeliveryRoute[]> {
    await authorizationService.requirePermission('route:view', explicitOrgId);

    const where: Record<string, any> = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.deliveryRoute.findMany({
      where,
      include: {
        recoveryTransaction: {
          include: {
            donorOrganization: true,
            recipientOrganization: true,
            foodItem: true,
          },
        },
        vehicle: true,
        driver: true,
        logisticsOrganization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRoute(routeId: string): Promise<DeliveryRoute | null> {
    await authorizationService.requirePermission('route:view');

    return prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        recoveryTransaction: {
          include: {
            donorOrganization: true,
            recipientOrganization: true,
            foodItem: true,
            facility: true,
          },
        },
        vehicle: true,
        driver: true,
        logisticsOrganization: true,
      },
    });
  },

  /**
   * Assigns a logistics partner, vehicle, and driver to a route.
   * Enforces vehicle capacity validation against food recovery quantity.
   */
  async assignRoute(
    routeId: string,
    assignment: RouteAssignmentInput,
    explicitOrgId?: string | null
  ): Promise<DeliveryRoute> {
    const { context } = await authorizationService.requirePermission(
      'route:assign',
      explicitOrgId
    );

    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: { recoveryTransaction: true },
    });

    if (!route) {
      throw new Error(`Delivery route with ID ${routeId} was not found`);
    }

    if (route.status !== 'PLANNED' && route.status !== 'ASSIGNED') {
      throw new Error(`Invalid State: Route is ${route.status} and cannot be assigned`);
    }

    // Capacity validation if a vehicle is being assigned
    let assignedVehicle: Vehicle | null = null;
    if (assignment.vehicleId) {
      assignedVehicle = await prisma.vehicle.findUnique({
        where: { id: assignment.vehicleId },
      });

      if (!assignedVehicle || !assignedVehicle.isActive) {
        throw new Error('Validation Error: The selected vehicle does not exist or is inactive');
      }

      const shipmentQty = route.recoveryTransaction?.quantity || 0;
      if (assignedVehicle.capacity < shipmentQty) {
        throw new Error(
          `Capacity Exceeded: Vehicle capacity (${assignedVehicle.capacity} ${assignedVehicle.unit}) is insufficient for recovery volume (${shipmentQty} kg)`
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoute = await tx.deliveryRoute.update({
        where: { id: routeId },
        data: {
          vehicleId: assignment.vehicleId || route.vehicleId,
          driverUserId: assignment.driverUserId || route.driverUserId,
          driverName: assignment.driverName || route.driverName,
          driverPhone: assignment.driverPhone || route.driverPhone,
          logisticsOrganizationId:
            assignment.logisticsOrganizationId || route.logisticsOrganizationId,
          status: 'ASSIGNED',
        },
        include: {
          recoveryTransaction: true,
          vehicle: true,
        },
      });

      // Update linked RecoveryTransaction to PICKUP_ASSIGNED
      if (route.recoveryTransactionId) {
        await tx.recoveryTransaction.update({
          where: { id: route.recoveryTransactionId },
          data: {
            status: 'PICKUP_ASSIGNED',
          },
        });
      }

      // Mark vehicle as IN_TRANSIT
      if (assignment.vehicleId) {
        await tx.vehicle.update({
          where: { id: assignment.vehicleId },
          data: { currentStatus: 'IN_TRANSIT' },
        });
      }

      return updatedRoute;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'route.assigned',
      entity: 'DeliveryRoute',
      entityId: routeId,
      previousState: { status: route.status },
      newState: {
        status: 'ASSIGNED',
        vehicleId: assignment.vehicleId,
        driverName: assignment.driverName,
      },
      reason: `Route assigned to vehicle ${assignedVehicle?.vehicleNumber || 'Unassigned'} and driver ${assignment.driverName || 'Designated Driver'}`,
      context: { routeId, recoveryTransactionId: route.recoveryTransactionId },
    });

    return updated;
  },

  /**
   * Updates route lifecycle status with rigorous state machine validation
   * and 6-digit PIN verification on physical collection.
   */
  async updateRouteStatus(
    routeId: string,
    newStatus: string,
    metadata?: RouteStatusUpdateMetadata,
    explicitOrgId?: string | null
  ): Promise<DeliveryRoute> {
    const { context } = await authorizationService.requirePermission(
      'route:update',
      explicitOrgId
    );

    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        recoveryTransaction: true,
        vehicle: true,
      },
    });

    if (!route) {
      throw new Error(`Delivery route with ID ${routeId} was not found`);
    }

    const currentStatus = route.status;

    // Validate state machine transitions
    const validTransitions: Record<string, string[]> = {
      PLANNED: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'CANCELLED'],
      EN_ROUTE_TO_PICKUP: ['AT_PICKUP', 'CANCELLED'],
      AT_PICKUP: ['COLLECTED', 'CANCELLED'],
      COLLECTED: ['EN_ROUTE_TO_DESTINATION', 'DELIVERED'],
      EN_ROUTE_TO_DESTINATION: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid Transition: Cannot move route from ${currentStatus} to ${newStatus}`
      );
    }

    // Physical pickup verification: when moving to COLLECTED, require valid 6-digit PIN
    if (newStatus === 'COLLECTED') {
      const inputPin = metadata?.verificationPin?.trim();
      const expectedPin = route.verificationPin || route.recoveryTransaction?.verificationPin;

      if (!inputPin) {
        throw new Error('Verification Error: 6-digit handover PIN is required to confirm food pickup');
      }

      if (expectedPin && inputPin !== expectedPin) {
        throw new Error(
          'Verification Error: Handover PIN Verification Failed. Invalid pickup verification PIN. Please verify the code with recipient'
        );
      }
    }

    const now = new Date();
    const updateData: Record<string, any> = {
      status: newStatus,
      notes: metadata?.notes
        ? `${route.notes ? route.notes + '\n' : ''}${metadata.notes}`
        : route.notes,
    };

    if (newStatus === 'EN_ROUTE_TO_PICKUP') updateData.startedAt = now;
    if (newStatus === 'AT_PICKUP') updateData.arrivedPickupAt = now;
    if (newStatus === 'COLLECTED') updateData.collectedAt = now;
    if (newStatus === 'DELIVERED') updateData.deliveredAt = now;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoute = await tx.deliveryRoute.update({
        where: { id: routeId },
        data: updateData,
        include: {
          recoveryTransaction: true,
          vehicle: true,
        },
      });

      // Synchronize RecoveryTransaction status
      if (route.recoveryTransactionId) {
        if (newStatus === 'COLLECTED') {
          await tx.recoveryTransaction.update({
            where: { id: route.recoveryTransactionId },
            data: {
              status: 'COLLECTED',
              collectedAt: now,
            },
          });
        } else if (newStatus === 'DELIVERED') {
          await tx.recoveryTransaction.update({
            where: { id: route.recoveryTransactionId },
            data: {
              status: 'DELIVERED',
              deliveredAt: now,
            },
          });

          // Free up vehicle
          if (route.vehicleId) {
            await tx.vehicle.update({
              where: { id: route.vehicleId },
              data: { currentStatus: 'AVAILABLE' },
            });
          }
        }
      }

      return updatedRoute;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'route.status_updated',
      entity: 'DeliveryRoute',
      entityId: routeId,
      previousState: { status: currentStatus },
      newState: { status: newStatus },
      reason: metadata?.notes || `Route progressed from ${currentStatus} to ${newStatus}`,
      context: { routeId, recoveryTransactionId: route.recoveryTransactionId },
    });

    return updated;
  },

  // ==============================================
  // 3. Logistics Overview Metrics
  // ==============================================

  async getLogisticsOverview(_explicitOrgId?: string | null) {
    await authorizationService.requirePermission('route:view');

    const allRoutes = await prisma.deliveryRoute.findMany({
      include: { recoveryTransaction: true },
    });

    const activeRoutes = allRoutes.filter(
      (r) =>
        r.status === 'ASSIGNED' ||
        r.status === 'EN_ROUTE_TO_PICKUP' ||
        r.status === 'AT_PICKUP' ||
        r.status === 'COLLECTED' ||
        r.status === 'EN_ROUTE_TO_DESTINATION'
    ).length;

    const pendingPickups = allRoutes.filter(
      (r) => r.status === 'PLANNED' || r.status === 'ASSIGNED' || r.status === 'AT_PICKUP'
    ).length;

    const inTransit = allRoutes.filter(
      (r) => r.status === 'EN_ROUTE_TO_PICKUP' || r.status === 'COLLECTED' || r.status === 'EN_ROUTE_TO_DESTINATION'
    ).length;

    const deliveriesCompleted = allRoutes.filter((r) => r.status === 'DELIVERED').length;

    const totalDistance = allRoutes.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
    const avgDistance =
      allRoutes.length > 0 ? Number((totalDistance / allRoutes.length).toFixed(1)) : 0;

    const totalRecoveredKg = allRoutes
      .filter((r) => r.status === 'COLLECTED' || r.status === 'DELIVERED')
      .reduce((acc, r) => acc + (r.recoveryTransaction?.quantity || 0), 0);

    return {
      activeRoutes,
      pendingPickups,
      inTransit,
      deliveriesCompleted,
      averageDistanceKm: avgDistance,
      totalRecoveredKg,
      totalRoutes: allRoutes.length,
    };
  },
};
