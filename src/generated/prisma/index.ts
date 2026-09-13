// ==============================================
// SaveByte — Generated Prisma Client Types & Driver Adapter
// ==============================================

export interface User {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isOnboarded: boolean;
  role?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberships?: Membership[];
  foodRequests?: FoodRequest[];
  recoveryOrdersReceived?: RecoveryTransaction[];
  recoveryOrdersSponsored?: RecoveryTransaction[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  memberships?: Membership[];
  facilities?: Facility[];
  foodItems?: FoodItem[];
  foodBatches?: FoodBatch[];
  inventoryTransactions?: InventoryTransaction[];
  surplusListings?: SurplusListing[];
  foodRequests?: FoodRequest[];
  donorRecoveryOrders?: RecoveryTransaction[];
  recipientRecoveryOrders?: RecoveryTransaction[];
  donorMatches?: MatchRecommendation[];
  recipientMatches?: MatchRecommendation[];
  vehicles?: Vehicle[];
  logisticsRoutes?: DeliveryRoute[];
  aiInsights?: AIInsight[];
}

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  operatingStatus: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  foodBatches?: FoodBatch[];
  inventoryTransactions?: InventoryTransaction[];
  surplusListings?: SurplusListing[];
  recoveryOrders?: RecoveryTransaction[];
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  organization?: Organization | null;
}

export interface OrganizationApplication {
  id: string;
  applicantId: string;
  type: string;
  status: string;
  orgName: string;
  orgType: string;
  industryCategory: string | null;
  registrationNumber: string | null;
  website: string | null;
  description: string | null;
  contactName: string;
  contactDesignation: string | null;
  contactEmail: string;
  contactPhone: string | null;
  facilityName: string | null;
  facilityType: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceArea: string | null;
  beneficiariesServed: number | null;
  mealsPerDay: number | null;
  dailyFoodProduction: string | null;
  dailyFoodConsumption: string | null;
  typicalSurplus: string | null;
  foodCategories: string | null;
  operatingHours: string | null;
  wasteHandlingMethod: string | null;
  existingDonationProcess: string | null;
  coldStorageAvailable: boolean;
  iotSensorsAvailable: boolean;
  storageAvailable: boolean;
  pickupDeliveryWindows: string | null;
  reviewerId: string | null;
  reviewFeedback: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  approvedOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
  applicant?: User;
  reviewer?: User | null;
  approvedOrganization?: Organization | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousState: any;
  newState: any;
  reason: string | null;
  context: any;
  createdAt: Date;
  actor?: User | null;
}

// ==============================================
// Phase 3: Core Food Recovery Ecosystem Models
// ==============================================

export interface FoodItem {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  storageRequirement: string | null;
  dietaryFlags: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  batches?: FoodBatch[];
  inventoryTransactions?: InventoryTransaction[];
  surplusListings?: SurplusListing[];
  recoveryOrders?: RecoveryTransaction[];
}

export interface FoodBatch {
  id: string;
  organizationId: string;
  facilityId: string;
  foodItemId: string;
  batchNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  unit: string;
  preparedAt: Date;
  expiresAt: Date;
  storageCondition: string;
  qualityStatus: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  facility?: Facility;
  foodItem?: FoodItem;
  inventoryTransactions?: InventoryTransaction[];
  surplusListings?: SurplusListing[];
  recoveryOrders?: RecoveryTransaction[];
}

export interface InventoryTransaction {
  id: string;
  organizationId: string;
  facilityId: string;
  batchId: string;
  foodItemId: string;
  type: string;
  quantity: number;
  unit: string;
  referenceType: string | null;
  referenceId: string | null;
  actorId: string | null;
  notes: string | null;
  createdAt: Date;
  organization?: Organization;
  facility?: Facility;
  batch?: FoodBatch;
  foodItem?: FoodItem;
}

export interface SurplusListing {
  id: string;
  donorOrganizationId: string;
  facilityId: string;
  foodItemId: string;
  batchId: string;
  title: string;
  description: string | null;
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  unit: string;
  status: string;
  qualityStatus: string;
  eligibleRecipientType: string;
  availableFrom: Date;
  availableUntil: Date;
  pickupAddress: string;
  pickupCity: string | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupWindow: string | null;
  storageCondition: string;
  isFreeDonation: boolean;
  pricePerUnit: number | null;
  createdAt: Date;
  updatedAt: Date;
  donorOrganization?: Organization;
  facility?: Facility;
  foodItem?: FoodItem;
  batch?: FoodBatch;
  requests?: FoodRequest[];
  recoveryOrders?: RecoveryTransaction[];
  matches?: MatchRecommendation[];
}

export interface FoodRequest {
  id: string;
  requesterUserId: string;
  requesterOrganizationId: string | null;
  surplusListingId: string | null;
  foodCategory: string;
  requestedQuantity: number;
  unit: string;
  status: string;
  intendedUse: string | null;
  beneficiaryCount: number | null;
  urgency: string;
  requiredByDate: Date | null;
  deliveryLocation: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  requesterUser?: User;
  requesterOrganization?: Organization | null;
  surplusListing?: SurplusListing | null;
  recoveryOrders?: RecoveryTransaction[];
  matches?: MatchRecommendation[];
}

export interface RecoveryTransaction {
  id: string;
  donorOrganizationId: string;
  facilityId: string;
  surplusListingId: string;
  foodItemId: string;
  batchId: string;
  foodRequestId: string | null;
  recipientUserId: string;
  recipientOrganizationId: string | null;
  orderType: string;
  quantity: number;
  unit: string;
  sponsorUserId: string | null;
  sponsorNotes: string | null;
  status: string;
  pickupAddress: string;
  pickupWindow: string | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  verificationPin: string;
  scheduledPickupTime: Date | null;
  collectedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  donorOrganization?: Organization;
  facility?: Facility;
  surplusListing?: SurplusListing;
  foodItem?: FoodItem;
  batch?: FoodBatch;
  foodRequest?: FoodRequest | null;
  recipientUser?: User;
  recipientOrganization?: Organization | null;
  sponsorUser?: User | null;
  deliveryRoute?: DeliveryRoute | null;
}

// ==============================================
// Phase 4: Matching Engine & Route Logistics Models
// ==============================================

export interface MatchRecommendation {
  id: string;
  surplusListingId: string;
  foodRequestId: string | null;
  donorOrganizationId: string;
  recipientOrganizationId: string | null;
  recipientUserId: string | null;
  score: number;
  ranking: number;
  matchingReasons: string;
  breakdown: string | null;
  distanceKm: number | null;
  estimatedTravelMinutes: number | null;
  eligibility: string;
  ineligibilityReason: string | null;
  status: string;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  surplusListing?: SurplusListing;
  foodRequest?: FoodRequest | null;
  donorOrganization?: Organization;
  recipientOrganization?: Organization | null;
  recipientUser?: User | null;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  unit: string;
  refrigerationSupported: boolean;
  currentStatus: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  deliveryRoutes?: DeliveryRoute[];
}

export interface DeliveryRoute {
  id: string;
  recoveryTransactionId: string;
  logisticsOrganizationId: string | null;
  vehicleId: string | null;
  driverUserId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  pickupLocation: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  destinationLocation: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  pickupWindow: string | null;
  deliveryWindow: string | null;
  distanceKm: number;
  estimatedDurationMinutes: number;
  status: string;
  verificationPin: string | null;
  startedAt: Date | null;
  arrivedPickupAt: Date | null;
  collectedAt: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  recoveryTransaction?: RecoveryTransaction;
  logisticsOrganization?: Organization | null;
  vehicle?: Vehicle | null;
  driver?: User | null;
}

// ==============================================
// Phase 5: AI Intelligence & Insights
// ==============================================

export interface AIInsight {
  id: string;
  organizationId: string;
  facilityId: string | null;
  type: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  inputHash: string;
  result: string;
  confidence: number;
  provider: string;
  model: string | null;
  generatedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
}

// ==============================================
// Delegate Interfaces
// ==============================================

export interface UserDelegate {
  findUnique(args: { where: { id?: string; clerkUserId?: string }; include?: any }): Promise<User | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<User | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<User[]>;
  create(args: { data: Partial<User>; include?: any }): Promise<User>;
  upsert(args: {
    where: { clerkUserId: string };
    update: Partial<User>;
    create: Partial<User>;
    include?: any;
  }): Promise<User>;
  update(args: { where: { id?: string; clerkUserId?: string }; data: Partial<User>; include?: any }): Promise<User>;
  delete(args: { where: { id?: string; clerkUserId?: string } }): Promise<User>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

export interface OrganizationDelegate {
  findUnique(args: { where: { id?: string; slug?: string }; include?: any }): Promise<Organization | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<Organization | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<Organization[]>;
  create(args: { data: Partial<Organization>; include?: any }): Promise<Organization>;
  update(args: { where: { id: string }; data: Partial<Organization>; include?: any }): Promise<Organization>;
  delete(args: { where: { id: string } }): Promise<Organization>;
  count(args?: { where?: any }): Promise<number>;
}

export interface FacilityDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<Facility | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<Facility | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<Facility[]>;
  create(args: { data: Partial<Facility>; include?: any }): Promise<Facility>;
  update(args: { where: { id: string }; data: Partial<Facility>; include?: any }): Promise<Facility>;
  delete(args: { where: { id: string } }): Promise<Facility>;
  count(args?: { where?: any }): Promise<number>;
}

export interface MembershipDelegate {
  findUnique(args: { where: { id?: string; userId_organizationId?: { userId: string; organizationId: string | null } }; include?: any }): Promise<Membership | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<Membership | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<Membership[]>;
  create(args: { data: Partial<Membership>; include?: any }): Promise<Membership>;
  update(args: { where: { id: string }; data: Partial<Membership>; include?: any }): Promise<Membership>;
  delete(args: { where: { id: string } }): Promise<Membership>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

export interface OrganizationApplicationDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<OrganizationApplication | null>;
  findFirst(args?: { where?: any; include?: any; orderBy?: any }): Promise<OrganizationApplication | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<OrganizationApplication[]>;
  create(args: { data: Partial<OrganizationApplication>; include?: any }): Promise<OrganizationApplication>;
  update(args: { where: { id: string }; data: Partial<OrganizationApplication>; include?: any }): Promise<OrganizationApplication>;
  delete(args: { where: { id: string } }): Promise<OrganizationApplication>;
  count(args?: { where?: any }): Promise<number>;
}

export interface AuditLogDelegate {
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<AuditLog[]>;
  create(args: { data: Partial<AuditLog>; include?: any }): Promise<AuditLog>;
  count(args?: { where?: any }): Promise<number>;
}

export interface FoodItemDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<FoodItem | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<FoodItem | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<FoodItem[]>;
  create(args: { data: Partial<FoodItem>; include?: any }): Promise<FoodItem>;
  update(args: { where: { id: string }; data: Partial<FoodItem>; include?: any }): Promise<FoodItem>;
  delete(args: { where: { id: string } }): Promise<FoodItem>;
  count(args?: { where?: any }): Promise<number>;
}

export interface FoodBatchDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<FoodBatch | null>;
  findFirst(args?: { where?: any; include?: any; orderBy?: any }): Promise<FoodBatch | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<FoodBatch[]>;
  create(args: { data: Partial<FoodBatch>; include?: any }): Promise<FoodBatch>;
  update(args: { where: { id: string }; data: Partial<FoodBatch>; include?: any }): Promise<FoodBatch>;
  delete(args: { where: { id: string } }): Promise<FoodBatch>;
  count(args?: { where?: any }): Promise<number>;
}

export interface InventoryTransactionDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<InventoryTransaction | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<InventoryTransaction | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<InventoryTransaction[]>;
  create(args: { data: Partial<InventoryTransaction>; include?: any }): Promise<InventoryTransaction>;
  count(args?: { where?: any }): Promise<number>;
}

export interface SurplusListingDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<SurplusListing | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<SurplusListing | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<SurplusListing[]>;
  create(args: { data: Partial<SurplusListing>; include?: any }): Promise<SurplusListing>;
  update(args: { where: { id: string }; data: Partial<SurplusListing>; include?: any }): Promise<SurplusListing>;
  delete(args: { where: { id: string } }): Promise<SurplusListing>;
  count(args?: { where?: any }): Promise<number>;
}

export interface FoodRequestDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<FoodRequest | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<FoodRequest | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<FoodRequest[]>;
  create(args: { data: Partial<FoodRequest>; include?: any }): Promise<FoodRequest>;
  update(args: { where: { id: string }; data: Partial<FoodRequest>; include?: any }): Promise<FoodRequest>;
  delete(args: { where: { id: string } }): Promise<FoodRequest>;
  count(args?: { where?: any }): Promise<number>;
}

export interface RecoveryTransactionDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<RecoveryTransaction | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<RecoveryTransaction | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<RecoveryTransaction[]>;
  create(args: { data: Partial<RecoveryTransaction>; include?: any }): Promise<RecoveryTransaction>;
  update(args: { where: { id: string }; data: Partial<RecoveryTransaction>; include?: any }): Promise<RecoveryTransaction>;
  delete(args: { where: { id: string } }): Promise<RecoveryTransaction>;
  count(args?: { where?: any }): Promise<number>;
}

export interface MatchRecommendationDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<MatchRecommendation | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<MatchRecommendation | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<MatchRecommendation[]>;
  create(args: { data: Partial<MatchRecommendation>; include?: any }): Promise<MatchRecommendation>;
  update(args: { where: { id: string }; data: Partial<MatchRecommendation>; include?: any }): Promise<MatchRecommendation>;
  delete(args: { where: { id: string } }): Promise<MatchRecommendation>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

export interface VehicleDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<Vehicle | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<Vehicle | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<Vehicle[]>;
  create(args: { data: Partial<Vehicle>; include?: any }): Promise<Vehicle>;
  update(args: { where: { id: string }; data: Partial<Vehicle>; include?: any }): Promise<Vehicle>;
  delete(args: { where: { id: string } }): Promise<Vehicle>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

export interface DeliveryRouteDelegate {
  findUnique(args: { where: { id?: string; recoveryTransactionId?: string }; include?: any }): Promise<DeliveryRoute | null>;
  findFirst(args?: { where?: any; include?: any }): Promise<DeliveryRoute | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<DeliveryRoute[]>;
  create(args: { data: Partial<DeliveryRoute>; include?: any }): Promise<DeliveryRoute>;
  update(args: { where: { id?: string; recoveryTransactionId?: string }; data: Partial<DeliveryRoute>; include?: any }): Promise<DeliveryRoute>;
  delete(args: { where: { id?: string; recoveryTransactionId?: string } }): Promise<DeliveryRoute>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

export interface AIInsightDelegate {
  findUnique(args: { where: { id: string }; include?: any }): Promise<AIInsight | null>;
  findFirst(args?: { where?: any; include?: any; orderBy?: any }): Promise<AIInsight | null>;
  findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }): Promise<AIInsight[]>;
  create(args: { data: Partial<AIInsight>; include?: any }): Promise<AIInsight>;
  update(args: { where: { id: string }; data: Partial<AIInsight>; include?: any }): Promise<AIInsight>;
  delete(args: { where: { id: string } }): Promise<AIInsight>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  count(args?: { where?: any }): Promise<number>;
}

// In-memory backing store for demo/development execution
export const memoryStore = {
  users: new Map<string, User>(),
  organizations: new Map<string, Organization>(),
  facilities: new Map<string, Facility>(),
  memberships: new Map<string, Membership>(),
  organizationApplications: new Map<string, OrganizationApplication>(),
  auditLogs: new Map<string, AuditLog>(),
  foodItems: new Map<string, FoodItem>(),
  foodBatches: new Map<string, FoodBatch>(),
  inventoryTransactions: new Map<string, InventoryTransaction>(),
  surplusListings: new Map<string, SurplusListing>(),
  foodRequests: new Map<string, FoodRequest>(),
  recoveryTransactions: new Map<string, RecoveryTransaction>(),
  matchRecommendations: new Map<string, MatchRecommendation>(),
  vehicles: new Map<string, Vehicle>(),
  deliveryRoutes: new Map<string, DeliveryRoute>(),
  aiInsights: new Map<string, AIInsight>(),
};

// Generic matcher helper for Prisma-like where conditions
function matchesCondition(itemVal: any, cond: any): boolean {
  if (cond === undefined) return true;
  if (cond === null) return itemVal === null;

  if (typeof cond === 'object' && !(cond instanceof Date)) {
    if (Array.isArray(cond)) {
      return cond.includes(itemVal);
    }
    if ('in' in cond && Array.isArray(cond.in)) {
      if (!cond.in.includes(itemVal)) return false;
    }
    if ('notIn' in cond && Array.isArray(cond.notIn)) {
      if (cond.notIn.includes(itemVal)) return false;
    }
    if ('not' in cond) {
      if (itemVal === cond.not) return false;
    }
    if ('gt' in cond) {
      if (!(itemVal > cond.gt)) return false;
    }
    if ('gte' in cond) {
      if (!(itemVal >= cond.gte)) return false;
    }
    if ('lt' in cond) {
      if (!(itemVal < cond.lt)) return false;
    }
    if ('lte' in cond) {
      if (!(itemVal <= cond.lte)) return false;
    }
    if ('contains' in cond) {
      const target = String(itemVal || '').toLowerCase();
      const search = String(cond.contains || '').toLowerCase();
      if (!target.includes(search)) return false;
    }
    return true;
  }

  if (cond instanceof Date && itemVal instanceof Date) {
    return itemVal.getTime() === cond.getTime();
  }

  return itemVal === cond;
}

function matchesFilter(item: any, where?: any): boolean {
  if (!where) return true;

  if (where.OR && Array.isArray(where.OR)) {
    const orPass = where.OR.some((subWhere: any) => matchesFilter(item, subWhere));
    if (!orPass) return false;
  }

  if (where.AND && Array.isArray(where.AND)) {
    const andPass = where.AND.every((subWhere: any) => matchesFilter(item, subWhere));
    if (!andPass) return false;
  }

  for (const [key, cond] of Object.entries(where)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') continue;
    const itemVal = item[key];
    if (!matchesCondition(itemVal, cond)) {
      return false;
    }
  }

  return true;
}

function sortItems<T>(list: T[], orderBy?: any): T[] {
  if (!orderBy) return list;
  const result = [...list];

  const orderKey = Object.keys(orderBy)[0];
  const orderDirection = orderBy[orderKey]; // 'asc' | 'desc'

  if (orderKey) {
    result.sort((a: any, b: any) => {
      const valA = a[orderKey];
      const valB = b[orderKey];
      if (valA instanceof Date && valB instanceof Date) {
        return orderDirection === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return orderDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '');
      const strB = String(valB || '');
      return orderDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }

  return result;
}

export class PrismaClient {
  user: UserDelegate;
  organization: OrganizationDelegate;
  facility: FacilityDelegate;
  membership: MembershipDelegate;
  organizationApplication: OrganizationApplicationDelegate;
  auditLog: AuditLogDelegate;
  foodItem: FoodItemDelegate;
  foodBatch: FoodBatchDelegate;
  inventoryTransaction: InventoryTransactionDelegate;
  surplusListing: SurplusListingDelegate;
  foodRequest: FoodRequestDelegate;
  recoveryTransaction: RecoveryTransactionDelegate;
  matchRecommendation: MatchRecommendationDelegate;
  vehicle: VehicleDelegate;
  deliveryRoute: DeliveryRouteDelegate;
  aiInsight: AIInsightDelegate;

  constructor(options?: { adapter?: any }) {
    // ---------------- User Delegate ----------------
    this.user = {
      findUnique: async ({ where, include }) => {
        for (const u of memoryStore.users.values()) {
          if (where.id && u.id === where.id) return this.hydrateUser(u, include);
          if (where.clerkUserId && u.clerkUserId === where.clerkUserId) return this.hydrateUser(u, include);
        }
        return null;
      },
      findFirst: async (args) => {
        for (const u of memoryStore.users.values()) {
          if (matchesFilter(u, args?.where)) return this.hydrateUser(u, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.users.values()).filter(u => matchesFilter(u, args?.where));
        list = sortItems(list, args?.orderBy);
        return list.map(u => this.hydrateUser(u, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'usr_' + Math.random().toString(36).substring(2, 9);
        const user: User = {
          id,
          clerkUserId: data.clerkUserId || '',
          displayName: data.displayName || null,
          email: data.email || null,
          avatarUrl: data.avatarUrl || null,
          phone: data.phone || null,
          isOnboarded: data.isOnboarded || false,
          role: data.role || 'INDIVIDUAL_USER',
          status: data.status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.users.set(id, user);
        return this.hydrateUser(user, include);
      },
      upsert: async ({ where, update, create, include }) => {
        let existing: User | null = null;
        for (const u of memoryStore.users.values()) {
          if (u.clerkUserId === where.clerkUserId) {
            existing = u;
            break;
          }
        }
        if (existing) {
          const updated: User = {
            ...existing,
            ...update,
            updatedAt: new Date(),
          };
          memoryStore.users.set(existing.id, updated);
          return this.hydrateUser(updated, include);
        } else {
          const id = 'usr_' + Math.random().toString(36).substring(2, 9);
          const newUser: User = {
            id,
            clerkUserId: where.clerkUserId,
            displayName: create.displayName || null,
            email: create.email || null,
            avatarUrl: create.avatarUrl || null,
            phone: create.phone || null,
            isOnboarded: create.isOnboarded || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          memoryStore.users.set(id, newUser);
          return this.hydrateUser(newUser, include);
        }
      },
      update: async ({ where, data, include }) => {
        let target: User | null = null;
        for (const u of memoryStore.users.values()) {
          if (where.id && u.id === where.id) target = u;
          if (where.clerkUserId && u.clerkUserId === where.clerkUserId) target = u;
        }
        if (!target) {
          target = {
            id: where.id || 'usr_default',
            clerkUserId: where.clerkUserId || 'clerk_mock',
            displayName: null,
            email: null,
            avatarUrl: null,
            phone: null,
            isOnboarded: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        const updated: User = { ...target, ...data, updatedAt: new Date() };
        memoryStore.users.set(updated.id, updated);
        return this.hydrateUser(updated, include);
      },
      delete: async ({ where }) => {
        let deleted: User | null = null;
        for (const [id, u] of memoryStore.users.entries()) {
          if (where.id && u.id === where.id) {
            deleted = u;
            memoryStore.users.delete(id);
            break;
          }
        }
        return deleted || ({} as User);
      },
      deleteMany: async () => {
        const count = memoryStore.users.size;
        memoryStore.users.clear();
        return { count };
      },
      count: async () => memoryStore.users.size,
    };

    // ---------------- Organization Delegate ----------------
    this.organization = {
      findUnique: async ({ where, include }) => {
        for (const o of memoryStore.organizations.values()) {
          if (where.id && o.id === where.id) return this.hydrateOrg(o, include);
          if (where.slug && o.slug === where.slug) return this.hydrateOrg(o, include);
        }
        return null;
      },
      findFirst: async (args) => {
        for (const o of memoryStore.organizations.values()) {
          if (matchesFilter(o, args?.where)) return this.hydrateOrg(o, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.organizations.values()).filter(o => matchesFilter(o, args?.where));
        list = sortItems(list, args?.orderBy);
        return list.map(o => this.hydrateOrg(o, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'org_' + Math.random().toString(36).substring(2, 9);
        const org: Organization = {
          id,
          name: data.name || '',
          slug: data.slug || (data.name || 'org').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: data.type || 'DONOR',
          description: data.description || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          logoUrl: data.logoUrl || null,
          isVerified: data.isVerified || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.organizations.set(id, org);
        return this.hydrateOrg(org, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.organizations.get(where.id);
        if (!existing) throw new Error(`Organization ${where.id} not found`);
        const updated: Organization = { ...existing, ...data, updatedAt: new Date() };
        memoryStore.organizations.set(where.id, updated);
        return this.hydrateOrg(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.organizations.get(where.id);
        if (existing) memoryStore.organizations.delete(where.id);
        return existing || ({} as Organization);
      },
      count: async (args) => {
        return Array.from(memoryStore.organizations.values()).filter(o => matchesFilter(o, args?.where)).length;
      },
    };

    // ---------------- Facility Delegate ----------------
    this.facility = {
      findUnique: async ({ where, include }) => {
        const f = memoryStore.facilities.get(where.id);
        return f ? this.hydrateFacility(f, include) : null;
      },
      findFirst: async (args) => {
        for (const f of memoryStore.facilities.values()) {
          if (matchesFilter(f, args?.where)) return this.hydrateFacility(f, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.facilities.values()).filter(f => matchesFilter(f, args?.where));
        list = sortItems(list, args?.orderBy);
        return list.map(f => this.hydrateFacility(f, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'fac_' + Math.random().toString(36).substring(2, 9);
        const facility: Facility = {
          id,
          organizationId: data.organizationId || '',
          name: data.name || 'Primary Facility',
          type: data.type || 'PRIMARY_LOCATION',
          address: data.address || '',
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || 'India',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          operatingStatus: data.operatingStatus || 'ACTIVE',
          isPrimary: data.isPrimary || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.facilities.set(id, facility);
        return this.hydrateFacility(facility, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.facilities.get(where.id);
        if (!existing) throw new Error(`Facility ${where.id} not found`);
        const updated: Facility = { ...existing, ...data, updatedAt: new Date() };
        memoryStore.facilities.set(where.id, updated);
        return this.hydrateFacility(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.facilities.get(where.id);
        if (existing) memoryStore.facilities.delete(where.id);
        return existing || ({} as Facility);
      },
      count: async () => memoryStore.facilities.size,
    };

    // ---------------- Membership Delegate ----------------
    this.membership = {
      findUnique: async ({ where, include }) => {
        if (where.id) {
          const m = memoryStore.memberships.get(where.id);
          return m ? this.hydrateMembership(m, include) : null;
        }
        if (where.userId_organizationId) {
          for (const m of memoryStore.memberships.values()) {
            if (m.userId === where.userId_organizationId.userId && m.organizationId === where.userId_organizationId.organizationId) {
              return this.hydrateMembership(m, include);
            }
          }
        }
        return null;
      },
      findFirst: async (args) => {
        for (const m of memoryStore.memberships.values()) {
          if (matchesFilter(m, args?.where)) return this.hydrateMembership(m, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.memberships.values()).filter(m => matchesFilter(m, args?.where));
        list = sortItems(list, args?.orderBy);
        return list.map(m => this.hydrateMembership(m, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'mem_' + Math.random().toString(36).substring(2, 9);
        const mem: Membership = {
          id,
          userId: data.userId || '',
          organizationId: data.organizationId || null,
          role: data.role || 'INDIVIDUAL_USER',
          status: data.status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.memberships.set(id, mem);
        return this.hydrateMembership(mem, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.memberships.get(where.id);
        if (!existing) throw new Error(`Membership ${where.id} not found`);
        const updated: Membership = { ...existing, ...data, updatedAt: new Date() };
        memoryStore.memberships.set(where.id, updated);
        return this.hydrateMembership(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.memberships.get(where.id);
        if (existing) memoryStore.memberships.delete(where.id);
        return existing || ({} as Membership);
      },
      deleteMany: async (args) => {
        let count = 0;
        for (const [id, m] of memoryStore.memberships.entries()) {
          if (matchesFilter(m, args?.where)) {
            memoryStore.memberships.delete(id);
            count++;
          }
        }
        return { count };
      },
      count: async (args) => {
        return Array.from(memoryStore.memberships.values()).filter(m => matchesFilter(m, args?.where)).length;
      },
    };

    // ---------------- Organization Application Delegate ----------------
    this.organizationApplication = {
      findUnique: async ({ where, include }) => {
        const app = memoryStore.organizationApplications.get(where.id);
        return app ? this.hydrateApplication(app, include) : null;
      },
      findFirst: async (args) => {
        for (const app of memoryStore.organizationApplications.values()) {
          if (matchesFilter(app, args?.where)) return this.hydrateApplication(app, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.organizationApplications.values()).filter(a => matchesFilter(a, args?.where));
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(a => this.hydrateApplication(a, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'app_' + Math.random().toString(36).substring(2, 9);
        const fb = data.reviewFeedback || data.reviewNotes || null;
        const app: OrganizationApplication = {
          id,
          applicantId: data.applicantId || '',
          type: data.type || 'INDUSTRY',
          status: data.status || 'PENDING',
          orgName: data.orgName || '',
          orgType: data.orgType || 'RESTAURANT',
          industryCategory: data.industryCategory || null,
          registrationNumber: data.registrationNumber || null,
          website: data.website || null,
          description: data.description || null,
          contactName: data.contactName || '',
          contactDesignation: data.contactDesignation || null,
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || null,
          facilityName: data.facilityName || null,
          facilityType: data.facilityType || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || 'India',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          serviceArea: data.serviceArea || null,
          beneficiariesServed: data.beneficiariesServed || null,
          mealsPerDay: data.mealsPerDay || null,
          dailyFoodProduction: data.dailyFoodProduction || null,
          dailyFoodConsumption: data.dailyFoodConsumption || null,
          typicalSurplus: data.typicalSurplus || null,
          foodCategories: data.foodCategories || null,
          operatingHours: data.operatingHours || null,
          wasteHandlingMethod: data.wasteHandlingMethod || null,
          existingDonationProcess: data.existingDonationProcess || null,
          coldStorageAvailable: data.coldStorageAvailable || false,
          iotSensorsAvailable: data.iotSensorsAvailable || false,
          storageAvailable: data.storageAvailable || false,
          pickupDeliveryWindows: data.pickupDeliveryWindows || null,
          reviewerId: data.reviewerId || null,
          reviewFeedback: fb,
          reviewNotes: fb,
          reviewedAt: data.reviewedAt || null,
          approvedOrgId: data.approvedOrgId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.organizationApplications.set(id, app);
        return this.hydrateApplication(app, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.organizationApplications.get(where.id);
        if (!existing) throw new Error(`Application ${where.id} not found`);
        const fb = data.reviewFeedback !== undefined ? data.reviewFeedback : (data.reviewNotes !== undefined ? data.reviewNotes : existing.reviewFeedback);
        const notes = data.reviewNotes !== undefined ? data.reviewNotes : (data.reviewFeedback !== undefined ? data.reviewFeedback : existing.reviewNotes);
        const updated: OrganizationApplication = {
          ...existing,
          ...data,
          reviewFeedback: fb,
          reviewNotes: notes,
          updatedAt: new Date(),
        };
        memoryStore.organizationApplications.set(where.id, updated);
        return this.hydrateApplication(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.organizationApplications.get(where.id);
        if (existing) memoryStore.organizationApplications.delete(where.id);
        return existing || ({} as OrganizationApplication);
      },
      count: async (args) => {
        return Array.from(memoryStore.organizationApplications.values()).filter(a => matchesFilter(a, args?.where)).length;
      },
    };

    // ---------------- Audit Log Delegate ----------------
    this.auditLog = {
      findMany: async (args) => {
        let list = Array.from(memoryStore.auditLogs.values()).filter(l => matchesFilter(l, args?.where));
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(l => this.hydrateAuditLog(l, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'aud_' + Math.random().toString(36).substring(2, 9);
        const log: AuditLog = {
          id,
          actorId: data.actorId || null,
          action: data.action || '',
          entity: data.entity || '',
          entityId: data.entityId || '',
          previousState: data.previousState || null,
          newState: data.newState || null,
          reason: data.reason || null,
          context: data.context || null,
          createdAt: new Date(),
        };
        memoryStore.auditLogs.set(id, log);
        return this.hydrateAuditLog(log, include);
      },
      count: async (args) => {
        return Array.from(memoryStore.auditLogs.values()).filter(l => matchesFilter(l, args?.where)).length;
      },
    };

    // ---------------- FoodItem Delegate ----------------
    this.foodItem = {
      findUnique: async ({ where, include }) => {
        const item = memoryStore.foodItems.get(where.id);
        return item ? this.hydrateFoodItem(item, include) : null;
      },
      findFirst: async (args) => {
        for (const item of memoryStore.foodItems.values()) {
          if (matchesFilter(item, args?.where)) return this.hydrateFoodItem(item, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.foodItems.values()).filter(item => matchesFilter(item, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateFoodItem(item, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'food_' + Math.random().toString(36).substring(2, 9);
        const item: FoodItem = {
          id,
          organizationId: data.organizationId || '',
          name: data.name || '',
          category: data.category || 'OTHER',
          description: data.description || null,
          unit: data.unit || 'kg',
          storageRequirement: data.storageRequirement || 'AMBIENT',
          dietaryFlags: data.dietaryFlags || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.foodItems.set(id, item);
        return this.hydrateFoodItem(item, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.foodItems.get(where.id);
        if (!existing) throw new Error(`FoodItem ${where.id} not found`);
        const updated: FoodItem = { ...existing, ...data, updatedAt: new Date() };
        memoryStore.foodItems.set(where.id, updated);
        return this.hydrateFoodItem(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.foodItems.get(where.id);
        if (existing) memoryStore.foodItems.delete(where.id);
        return existing || ({} as FoodItem);
      },
      count: async (args) => {
        return Array.from(memoryStore.foodItems.values()).filter(item => matchesFilter(item, args?.where)).length;
      },
    };

    // ---------------- FoodBatch Delegate ----------------
    this.foodBatch = {
      findUnique: async ({ where, include }) => {
        const batch = memoryStore.foodBatches.get(where.id);
        return batch ? this.hydrateFoodBatch(batch, include) : null;
      },
      findFirst: async (args) => {
        let list = Array.from(memoryStore.foodBatches.values()).filter(b => matchesFilter(b, args?.where));
        if (args?.orderBy) {
          list = sortItems(list, args.orderBy);
        }
        if (list.length > 0) return this.hydrateFoodBatch(list[0], args?.include);
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.foodBatches.values()).filter(b => matchesFilter(b, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(b => this.hydrateFoodBatch(b, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'batch_' + Math.random().toString(36).substring(2, 9);
        const batch: FoodBatch = {
          id,
          organizationId: data.organizationId || '',
          facilityId: data.facilityId || '',
          foodItemId: data.foodItemId || '',
          batchNumber: data.batchNumber || 'BATCH-' + Date.now().toString(36).toUpperCase(),
          initialQuantity: Number(data.initialQuantity ?? 0),
          currentQuantity: Number(data.currentQuantity ?? data.initialQuantity ?? 0),
          unit: data.unit || 'kg',
          preparedAt: data.preparedAt ? new Date(data.preparedAt) : new Date(),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 86400000),
          storageCondition: data.storageCondition || 'ROOM_TEMP',
          qualityStatus: data.qualityStatus || 'SUITABLE_FOR_HUMAN_RECOVERY',
          status: data.status || 'ACTIVE',
          notes: data.notes || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: new Date(),
        };
        memoryStore.foodBatches.set(id, batch);
        return this.hydrateFoodBatch(batch, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.foodBatches.get(where.id);
        if (!existing) throw new Error(`FoodBatch ${where.id} not found`);
        const updated: FoodBatch = {
          ...existing,
          ...data,
          initialQuantity: data.initialQuantity !== undefined ? Number(data.initialQuantity) : existing.initialQuantity,
          currentQuantity: data.currentQuantity !== undefined ? Number(data.currentQuantity) : existing.currentQuantity,
          preparedAt: data.preparedAt ? new Date(data.preparedAt) : existing.preparedAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt,
          updatedAt: new Date(),
        };
        memoryStore.foodBatches.set(where.id, updated);
        return this.hydrateFoodBatch(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.foodBatches.get(where.id);
        if (existing) memoryStore.foodBatches.delete(where.id);
        return existing || ({} as FoodBatch);
      },
      count: async (args) => {
        return Array.from(memoryStore.foodBatches.values()).filter(b => matchesFilter(b, args?.where)).length;
      },
    };

    // ---------------- InventoryTransaction Delegate ----------------
    this.inventoryTransaction = {
      findUnique: async ({ where, include }) => {
        const tx = memoryStore.inventoryTransactions.get(where.id);
        return tx ? this.hydrateInventoryTx(tx, include) : null;
      },
      findFirst: async (args) => {
        for (const tx of memoryStore.inventoryTransactions.values()) {
          if (matchesFilter(tx, args?.where)) return this.hydrateInventoryTx(tx, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.inventoryTransactions.values()).filter(tx => matchesFilter(tx, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(tx => this.hydrateInventoryTx(tx, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'itx_' + Math.random().toString(36).substring(2, 9);
        const tx: InventoryTransaction = {
          id,
          organizationId: data.organizationId || '',
          facilityId: data.facilityId || '',
          batchId: data.batchId || '',
          foodItemId: data.foodItemId || '',
          type: data.type || 'PRODUCED',
          quantity: Number(data.quantity ?? 0),
          unit: data.unit || 'kg',
          referenceType: data.referenceType || null,
          referenceId: data.referenceId || null,
          actorId: data.actorId || null,
          notes: data.notes || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        };
        memoryStore.inventoryTransactions.set(id, tx);
        return this.hydrateInventoryTx(tx, include);
      },
      count: async (args) => {
        return Array.from(memoryStore.inventoryTransactions.values()).filter(tx => matchesFilter(tx, args?.where)).length;
      },
    };

    // ---------------- SurplusListing Delegate ----------------
    this.surplusListing = {
      findUnique: async ({ where, include }) => {
        const listing = memoryStore.surplusListings.get(where.id);
        return listing ? this.hydrateSurplusListing(listing, include) : null;
      },
      findFirst: async (args) => {
        for (const listing of memoryStore.surplusListings.values()) {
          if (matchesFilter(listing, args?.where)) return this.hydrateSurplusListing(listing, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.surplusListings.values()).filter(l => matchesFilter(l, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(l => this.hydrateSurplusListing(l, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'surp_' + Math.random().toString(36).substring(2, 9);
        const listing: SurplusListing = {
          id,
          donorOrganizationId: data.donorOrganizationId || '',
          facilityId: data.facilityId || '',
          foodItemId: data.foodItemId || '',
          batchId: data.batchId || '',
          title: data.title || '',
          description: data.description || null,
          totalQuantity: Number(data.totalQuantity ?? 0),
          allocatedQuantity: Number(data.allocatedQuantity ?? 0),
          availableQuantity: Number(data.availableQuantity ?? data.totalQuantity ?? 0),
          unit: data.unit || 'kg',
          status: data.status || 'PUBLISHED',
          qualityStatus: data.qualityStatus || 'SUITABLE_FOR_HUMAN_RECOVERY',
          eligibleRecipientType: data.eligibleRecipientType || 'ALL',
          availableFrom: data.availableFrom ? new Date(data.availableFrom) : new Date(),
          availableUntil: data.availableUntil ? new Date(data.availableUntil) : new Date(Date.now() + 86400000),
          pickupAddress: data.pickupAddress || '',
          pickupCity: data.pickupCity || null,
          pickupLatitude: data.pickupLatitude || null,
          pickupLongitude: data.pickupLongitude || null,
          pickupWindow: data.pickupWindow || null,
          storageCondition: data.storageCondition || 'AMBIENT',
          isFreeDonation: data.isFreeDonation !== undefined ? data.isFreeDonation : true,
          pricePerUnit: data.pricePerUnit !== undefined ? Number(data.pricePerUnit) : 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: new Date(),
        };
        memoryStore.surplusListings.set(id, listing);
        return this.hydrateSurplusListing(listing, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.surplusListings.get(where.id);
        if (!existing) throw new Error(`SurplusListing ${where.id} not found`);
        const updated: SurplusListing = {
          ...existing,
          ...data,
          totalQuantity: data.totalQuantity !== undefined ? Number(data.totalQuantity) : existing.totalQuantity,
          allocatedQuantity: data.allocatedQuantity !== undefined ? Number(data.allocatedQuantity) : (existing.allocatedQuantity ?? 0),
          availableQuantity: data.availableQuantity !== undefined ? Number(data.availableQuantity) : existing.availableQuantity,
          availableFrom: data.availableFrom ? new Date(data.availableFrom) : existing.availableFrom,
          availableUntil: data.availableUntil ? new Date(data.availableUntil) : existing.availableUntil,
          updatedAt: new Date(),
        };
        memoryStore.surplusListings.set(where.id, updated);
        return this.hydrateSurplusListing(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.surplusListings.get(where.id);
        if (existing) memoryStore.surplusListings.delete(where.id);
        return existing || ({} as SurplusListing);
      },
      count: async (args) => {
        return Array.from(memoryStore.surplusListings.values()).filter(l => matchesFilter(l, args?.where)).length;
      },
    };

    // ---------------- FoodRequest Delegate ----------------
    this.foodRequest = {
      findUnique: async ({ where, include }) => {
        const req = memoryStore.foodRequests.get(where.id);
        return req ? this.hydrateFoodRequest(req, include) : null;
      },
      findFirst: async (args) => {
        for (const req of memoryStore.foodRequests.values()) {
          if (matchesFilter(req, args?.where)) return this.hydrateFoodRequest(req, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.foodRequests.values()).filter(req => matchesFilter(req, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(req => this.hydrateFoodRequest(req, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'req_' + Math.random().toString(36).substring(2, 9);
        const req: FoodRequest = {
          id,
          requesterUserId: data.requesterUserId || '',
          requesterOrganizationId: data.requesterOrganizationId || null,
          surplusListingId: data.surplusListingId || null,
          foodCategory: data.foodCategory || 'OTHER',
          requestedQuantity: Number(data.requestedQuantity ?? 0),
          unit: data.unit || 'kg',
          status: data.status || 'PENDING',
          intendedUse: data.intendedUse || null,
          beneficiaryCount: data.beneficiaryCount || null,
          urgency: data.urgency || 'STANDARD',
          requiredByDate: data.requiredByDate ? new Date(data.requiredByDate) : null,
          deliveryLocation: data.deliveryLocation || null,
          notes: data.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.foodRequests.set(id, req);
        return this.hydrateFoodRequest(req, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.foodRequests.get(where.id);
        if (!existing) throw new Error(`FoodRequest ${where.id} not found`);
        const updated: FoodRequest = {
          ...existing,
          ...data,
          requestedQuantity: data.requestedQuantity !== undefined ? Number(data.requestedQuantity) : existing.requestedQuantity,
          requiredByDate: data.requiredByDate ? new Date(data.requiredByDate) : existing.requiredByDate,
          updatedAt: new Date(),
        };
        memoryStore.foodRequests.set(where.id, updated);
        return this.hydrateFoodRequest(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.foodRequests.get(where.id);
        if (existing) memoryStore.foodRequests.delete(where.id);
        return existing || ({} as FoodRequest);
      },
      count: async (args) => {
        return Array.from(memoryStore.foodRequests.values()).filter(r => matchesFilter(r, args?.where)).length;
      },
    };

    // ---------------- RecoveryTransaction Delegate ----------------
    this.recoveryTransaction = {
      findUnique: async ({ where, include }) => {
        const tx = memoryStore.recoveryTransactions.get(where.id);
        return tx ? this.hydrateRecoveryTransaction(tx, include) : null;
      },
      findFirst: async (args) => {
        for (const tx of memoryStore.recoveryTransactions.values()) {
          if (matchesFilter(tx, args?.where)) return this.hydrateRecoveryTransaction(tx, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.recoveryTransactions.values()).filter(tx => matchesFilter(tx, args?.where));
        list = sortItems(list, args?.orderBy || { createdAt: 'desc' });
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(tx => this.hydrateRecoveryTransaction(tx, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'rec_' + Math.random().toString(36).substring(2, 9);
        const pin = data.verificationPin || Math.floor(100000 + Math.random() * 900000).toString();
        const tx: RecoveryTransaction = {
          id,
          donorOrganizationId: data.donorOrganizationId || '',
          facilityId: data.facilityId || '',
          surplusListingId: data.surplusListingId || '',
          foodItemId: data.foodItemId || '',
          batchId: data.batchId || '',
          foodRequestId: data.foodRequestId || null,
          recipientUserId: data.recipientUserId || '',
          recipientOrganizationId: data.recipientOrganizationId || null,
          orderType: data.orderType || 'NGO_CLAIM',
          quantity: Number(data.quantity ?? 0),
          unit: data.unit || 'kg',
          sponsorUserId: data.sponsorUserId || null,
          sponsorNotes: data.sponsorNotes || null,
          status: data.status || 'RESERVED',
          pickupAddress: data.pickupAddress || '',
          pickupWindow: data.pickupWindow || null,
          pickupLatitude: data.pickupLatitude || null,
          pickupLongitude: data.pickupLongitude || null,
          verificationPin: pin,
          scheduledPickupTime: data.scheduledPickupTime ? new Date(data.scheduledPickupTime) : null,
          collectedAt: data.collectedAt ? new Date(data.collectedAt) : null,
          deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : null,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          notes: data.notes || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: new Date(),
        };
        memoryStore.recoveryTransactions.set(id, tx);
        return this.hydrateRecoveryTransaction(tx, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.recoveryTransactions.get(where.id);
        if (!existing) throw new Error(`RecoveryTransaction ${where.id} not found`);
        const updated: RecoveryTransaction = {
          ...existing,
          ...data,
          quantity: data.quantity !== undefined ? Number(data.quantity) : existing.quantity,
          scheduledPickupTime: data.scheduledPickupTime ? new Date(data.scheduledPickupTime) : existing.scheduledPickupTime,
          collectedAt: data.collectedAt ? new Date(data.collectedAt) : existing.collectedAt,
          deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : existing.deliveredAt,
          completedAt: data.completedAt ? new Date(data.completedAt) : existing.completedAt,
          updatedAt: new Date(),
        };
        memoryStore.recoveryTransactions.set(where.id, updated);
        return this.hydrateRecoveryTransaction(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.recoveryTransactions.get(where.id);
        if (existing) memoryStore.recoveryTransactions.delete(where.id);
        return existing || ({} as RecoveryTransaction);
      },
      count: async (args) => {
        return Array.from(memoryStore.recoveryTransactions.values()).filter(tx => matchesFilter(tx, args?.where)).length;
      },
    };

    // ---------------- MatchRecommendation Delegate ----------------
    this.matchRecommendation = {
      findUnique: async ({ where, include }) => {
        const item = memoryStore.matchRecommendations.get(where.id);
        if (!item) return null;
        return this.hydrateMatchRecommendation(item, include);
      },
      findFirst: async (args) => {
        for (const item of memoryStore.matchRecommendations.values()) {
          if (matchesFilter(item, args?.where)) return this.hydrateMatchRecommendation(item, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.matchRecommendations.values()).filter(item => matchesFilter(item, args?.where));
        list = sortItems(list, args?.orderBy);
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateMatchRecommendation(item, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const item: MatchRecommendation = {
          id,
          surplusListingId: data.surplusListingId || '',
          foodRequestId: data.foodRequestId || null,
          donorOrganizationId: data.donorOrganizationId || '',
          recipientOrganizationId: data.recipientOrganizationId || null,
          recipientUserId: data.recipientUserId || null,
          score: data.score !== undefined ? Number(data.score) : 0,
          ranking: data.ranking !== undefined ? Number(data.ranking) : 1,
          matchingReasons: data.matchingReasons || '',
          breakdown: data.breakdown || null,
          distanceKm: data.distanceKm !== undefined ? Number(data.distanceKm) : null,
          estimatedTravelMinutes: data.estimatedTravelMinutes !== undefined ? Number(data.estimatedTravelMinutes) : null,
          eligibility: data.eligibility || 'ELIGIBLE',
          ineligibilityReason: data.ineligibilityReason || null,
          status: data.status || 'SUGGESTED',
          acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.matchRecommendations.set(id, item);
        return this.hydrateMatchRecommendation(item, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.matchRecommendations.get(where.id);
        if (!existing) throw new Error(`MatchRecommendation ${where.id} not found`);
        const updated: MatchRecommendation = {
          ...existing,
          ...data,
          score: data.score !== undefined ? Number(data.score) : existing.score,
          ranking: data.ranking !== undefined ? Number(data.ranking) : existing.ranking,
          acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : existing.acceptedAt,
          updatedAt: new Date(),
        };
        memoryStore.matchRecommendations.set(where.id, updated);
        return this.hydrateMatchRecommendation(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.matchRecommendations.get(where.id);
        if (existing) memoryStore.matchRecommendations.delete(where.id);
        return existing || ({} as MatchRecommendation);
      },
      deleteMany: async (args) => {
        let count = 0;
        for (const [id, item] of Array.from(memoryStore.matchRecommendations.entries())) {
          if (matchesFilter(item, args?.where)) {
            memoryStore.matchRecommendations.delete(id);
            count++;
          }
        }
        return { count };
      },
      count: async (args) => {
        return Array.from(memoryStore.matchRecommendations.values()).filter(item => matchesFilter(item, args?.where)).length;
      },
    };

    // ---------------- Vehicle Delegate ----------------
    this.vehicle = {
      findUnique: async ({ where, include }) => {
        const item = memoryStore.vehicles.get(where.id);
        if (!item) return null;
        return this.hydrateVehicle(item, include);
      },
      findFirst: async (args) => {
        for (const item of memoryStore.vehicles.values()) {
          if (matchesFilter(item, args?.where)) return this.hydrateVehicle(item, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.vehicles.values()).filter(item => matchesFilter(item, args?.where));
        list = sortItems(list, args?.orderBy);
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateVehicle(item, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const item: Vehicle = {
          id,
          organizationId: data.organizationId || '',
          vehicleNumber: data.vehicleNumber || '',
          vehicleType: data.vehicleType || 'VAN',
          capacity: data.capacity !== undefined ? Number(data.capacity) : 100,
          unit: data.unit || 'kg',
          refrigerationSupported: data.refrigerationSupported ?? false,
          currentStatus: data.currentStatus || 'AVAILABLE',
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.vehicles.set(id, item);
        return this.hydrateVehicle(item, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.vehicles.get(where.id);
        if (!existing) throw new Error(`Vehicle ${where.id} not found`);
        const updated: Vehicle = {
          ...existing,
          ...data,
          capacity: data.capacity !== undefined ? Number(data.capacity) : existing.capacity,
          updatedAt: new Date(),
        };
        memoryStore.vehicles.set(where.id, updated);
        return this.hydrateVehicle(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.vehicles.get(where.id);
        if (existing) memoryStore.vehicles.delete(where.id);
        return existing || ({} as Vehicle);
      },
      deleteMany: async (args) => {
        let count = 0;
        for (const [id, item] of Array.from(memoryStore.vehicles.entries())) {
          if (matchesFilter(item, args?.where)) {
            memoryStore.vehicles.delete(id);
            count++;
          }
        }
        return { count };
      },
      count: async (args) => {
        return Array.from(memoryStore.vehicles.values()).filter(item => matchesFilter(item, args?.where)).length;
      },
    };

    // ---------------- DeliveryRoute Delegate ----------------
    this.deliveryRoute = {
      findUnique: async ({ where, include }) => {
        if (where.id) {
          const item = memoryStore.deliveryRoutes.get(where.id);
          if (item) return this.hydrateDeliveryRoute(item, include);
        }
        if (where.recoveryTransactionId) {
          for (const item of memoryStore.deliveryRoutes.values()) {
            if (item.recoveryTransactionId === where.recoveryTransactionId) {
              return this.hydrateDeliveryRoute(item, include);
            }
          }
        }
        return null;
      },
      findFirst: async (args) => {
        for (const item of memoryStore.deliveryRoutes.values()) {
          if (matchesFilter(item, args?.where)) return this.hydrateDeliveryRoute(item, args?.include);
        }
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.deliveryRoutes.values()).filter(item => matchesFilter(item, args?.where));
        list = sortItems(list, args?.orderBy);
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateDeliveryRoute(item, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || `route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const item: DeliveryRoute = {
          id,
          recoveryTransactionId: data.recoveryTransactionId || '',
          logisticsOrganizationId: data.logisticsOrganizationId || null,
          vehicleId: data.vehicleId || null,
          driverUserId: data.driverUserId || null,
          driverName: data.driverName || null,
          driverPhone: data.driverPhone || null,
          pickupLocation: data.pickupLocation || '',
          pickupLatitude: data.pickupLatitude !== undefined ? Number(data.pickupLatitude) : null,
          pickupLongitude: data.pickupLongitude !== undefined ? Number(data.pickupLongitude) : null,
          destinationLocation: data.destinationLocation || '',
          destinationLatitude: data.destinationLatitude !== undefined ? Number(data.destinationLatitude) : null,
          destinationLongitude: data.destinationLongitude !== undefined ? Number(data.destinationLongitude) : null,
          pickupWindow: data.pickupWindow || null,
          deliveryWindow: data.deliveryWindow || null,
          distanceKm: data.distanceKm !== undefined ? Number(data.distanceKm) : 0,
          estimatedDurationMinutes: data.estimatedDurationMinutes !== undefined ? Number(data.estimatedDurationMinutes) : 0,
          status: data.status || 'PLANNED',
          verificationPin: data.verificationPin || null,
          startedAt: data.startedAt ? new Date(data.startedAt) : null,
          arrivedPickupAt: data.arrivedPickupAt ? new Date(data.arrivedPickupAt) : null,
          collectedAt: data.collectedAt ? new Date(data.collectedAt) : null,
          deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : null,
          notes: data.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.deliveryRoutes.set(id, item);
        return this.hydrateDeliveryRoute(item, include);
      },
      update: async ({ where, data, include }) => {
        let existing: DeliveryRoute | undefined;
        if (where.id) {
          existing = memoryStore.deliveryRoutes.get(where.id);
        } else if (where.recoveryTransactionId) {
          for (const item of memoryStore.deliveryRoutes.values()) {
            if (item.recoveryTransactionId === where.recoveryTransactionId) {
              existing = item;
              break;
            }
          }
        }
        if (!existing) throw new Error(`DeliveryRoute not found`);
        const updated: DeliveryRoute = {
          ...existing,
          ...data,
          distanceKm: data.distanceKm !== undefined ? Number(data.distanceKm) : existing.distanceKm,
          estimatedDurationMinutes: data.estimatedDurationMinutes !== undefined ? Number(data.estimatedDurationMinutes) : existing.estimatedDurationMinutes,
          startedAt: data.startedAt ? new Date(data.startedAt) : existing.startedAt,
          arrivedPickupAt: data.arrivedPickupAt ? new Date(data.arrivedPickupAt) : existing.arrivedPickupAt,
          collectedAt: data.collectedAt ? new Date(data.collectedAt) : existing.collectedAt,
          deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : existing.deliveredAt,
          updatedAt: new Date(),
        };
        memoryStore.deliveryRoutes.set(existing.id, updated);
        return this.hydrateDeliveryRoute(updated, include);
      },
      delete: async ({ where }) => {
        let existing: DeliveryRoute | undefined;
        if (where.id) {
          existing = memoryStore.deliveryRoutes.get(where.id);
          if (existing) memoryStore.deliveryRoutes.delete(where.id);
        } else if (where.recoveryTransactionId) {
          for (const item of memoryStore.deliveryRoutes.values()) {
            if (item.recoveryTransactionId === where.recoveryTransactionId) {
              existing = item;
              memoryStore.deliveryRoutes.delete(item.id);
              break;
            }
          }
        }
        return existing || ({} as DeliveryRoute);
      },
      deleteMany: async (args) => {
        let count = 0;
        for (const [id, item] of Array.from(memoryStore.deliveryRoutes.entries())) {
          if (matchesFilter(item, args?.where)) {
            memoryStore.deliveryRoutes.delete(id);
            count++;
          }
        }
        return { count };
      },
      count: async (args) => {
        return Array.from(memoryStore.deliveryRoutes.values()).filter(item => matchesFilter(item, args?.where)).length;
      },
    };

    // ---------------- AI Insight Delegate ----------------
    this.aiInsight = {
      findUnique: async ({ where, include }) => {
        if (where.id) {
          const item = memoryStore.aiInsights.get(where.id);
          if (item) return this.hydrateAIInsight(item, include);
        }
        return null;
      },
      findFirst: async (args) => {
        let list = Array.from(memoryStore.aiInsights.values()).filter(item => matchesFilter(item, args?.where));
        if (args?.orderBy) {
          list = sortItems(list, args.orderBy);
        }
        if (list.length > 0) return this.hydrateAIInsight(list[0], args?.include);
        return null;
      },
      findMany: async (args) => {
        let list = Array.from(memoryStore.aiInsights.values()).filter(item => matchesFilter(item, args?.where));
        if (args?.orderBy) {
          list = sortItems(list, args.orderBy);
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }
        return list.map(item => this.hydrateAIInsight(item, args?.include));
      },
      create: async ({ data, include }) => {
        const id = data.id || 'ins_' + Math.random().toString(36).substring(2, 9);
        const item: AIInsight = {
          id,
          organizationId: data.organizationId || '',
          facilityId: data.facilityId || null,
          type: data.type || 'DEMAND_FORECAST',
          periodStart: data.periodStart ? new Date(data.periodStart) : null,
          periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
          inputHash: data.inputHash || '',
          result: data.result || '{}',
          confidence: data.confidence !== undefined ? Number(data.confidence) : 50,
          provider: data.provider || 'deterministic_baseline',
          model: data.model || null,
          generatedAt: data.generatedAt ? new Date(data.generatedAt) : new Date(),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.aiInsights.set(id, item);
        return this.hydrateAIInsight(item, include);
      },
      update: async ({ where, data, include }) => {
        const existing = memoryStore.aiInsights.get(where.id);
        if (!existing) throw new Error(`AIInsight not found: ${where.id}`);
        const updated: AIInsight = {
          ...existing,
          ...data,
          periodStart: data.periodStart ? new Date(data.periodStart) : existing.periodStart,
          periodEnd: data.periodEnd ? new Date(data.periodEnd) : existing.periodEnd,
          confidence: data.confidence !== undefined ? Number(data.confidence) : existing.confidence,
          generatedAt: data.generatedAt ? new Date(data.generatedAt) : existing.generatedAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt,
          updatedAt: new Date(),
        };
        memoryStore.aiInsights.set(existing.id, updated);
        return this.hydrateAIInsight(updated, include);
      },
      delete: async ({ where }) => {
        const existing = memoryStore.aiInsights.get(where.id);
        if (existing) memoryStore.aiInsights.delete(where.id);
        return existing || ({} as AIInsight);
      },
      deleteMany: async (args) => {
        let count = 0;
        for (const [id, item] of Array.from(memoryStore.aiInsights.entries())) {
          if (matchesFilter(item, args?.where)) {
            memoryStore.aiInsights.delete(id);
            count++;
          }
        }
        return { count };
      },
      count: async (args) => {
        return Array.from(memoryStore.aiInsights.values()).filter(item => matchesFilter(item, args?.where)).length;
      },
    };
  }

  // ---------------- Hydration Helpers ----------------

  private hydrateUser(user: User, include?: any): User {
    const copy = { ...user };
    if (include?.memberships) {
      copy.memberships = Array.from(memoryStore.memberships.values())
        .filter(m => m.userId === user.id)
        .map(m => this.hydrateMembership(m, typeof include.memberships === 'object' ? include.memberships.include : undefined));
    }
    if (include?.foodRequests) {
      copy.foodRequests = Array.from(memoryStore.foodRequests.values())
        .filter(r => r.requesterUserId === user.id)
        .map(r => this.hydrateFoodRequest(r));
    }
    if (include?.recoveryOrdersReceived) {
      copy.recoveryOrdersReceived = Array.from(memoryStore.recoveryTransactions.values())
        .filter(r => r.recipientUserId === user.id)
        .map(r => this.hydrateRecoveryTransaction(r));
    }
    if (include?.recoveryOrdersSponsored) {
      copy.recoveryOrdersSponsored = Array.from(memoryStore.recoveryTransactions.values())
        .filter(r => r.sponsorUserId === user.id)
        .map(r => this.hydrateRecoveryTransaction(r));
    }
    return copy;
  }

  private hydrateOrg(org: Organization, include?: any): Organization {
    const copy = { ...org };
    if (include?.facilities) {
      copy.facilities = Array.from(memoryStore.facilities.values())
        .filter(f => f.organizationId === org.id)
        .map(f => this.hydrateFacility(f));
    }
    if (include?.memberships) {
      copy.memberships = Array.from(memoryStore.memberships.values())
        .filter(m => m.organizationId === org.id);
    }
    if (include?.foodItems) {
      copy.foodItems = Array.from(memoryStore.foodItems.values())
        .filter(item => item.organizationId === org.id);
    }
    if (include?.foodBatches) {
      copy.foodBatches = Array.from(memoryStore.foodBatches.values())
        .filter(b => b.organizationId === org.id);
    }
    if (include?.surplusListings) {
      copy.surplusListings = Array.from(memoryStore.surplusListings.values())
        .filter(s => s.donorOrganizationId === org.id);
    }
    if (include?.foodRequests) {
      copy.foodRequests = Array.from(memoryStore.foodRequests.values())
        .filter(r => r.requesterOrganizationId === org.id);
    }
    if (include?.vehicles) {
      copy.vehicles = Array.from(memoryStore.vehicles.values())
        .filter(v => v.organizationId === org.id)
        .map(v => this.hydrateVehicle(v));
    }
    if (include?.logisticsRoutes) {
      copy.logisticsRoutes = Array.from(memoryStore.deliveryRoutes.values())
        .filter(r => r.logisticsOrganizationId === org.id)
        .map(r => this.hydrateDeliveryRoute(r));
    }
    if (include?.donorMatches) {
      copy.donorMatches = Array.from(memoryStore.matchRecommendations.values())
        .filter(m => m.donorOrganizationId === org.id)
        .map(m => this.hydrateMatchRecommendation(m));
    }
    if (include?.recipientMatches) {
      copy.recipientMatches = Array.from(memoryStore.matchRecommendations.values())
        .filter(m => m.recipientOrganizationId === org.id)
        .map(m => this.hydrateMatchRecommendation(m));
    }
    if (include?.aiInsights) {
      copy.aiInsights = Array.from(memoryStore.aiInsights.values())
        .filter(a => a.organizationId === org.id)
        .map(a => this.hydrateAIInsight(a));
    }
    return copy;
  }

  private hydrateFacility(facility: Facility, include?: any): Facility {
    const copy = { ...facility };
    if (include?.organization) {
      copy.organization = memoryStore.organizations.get(facility.organizationId);
    }
    if (include?.foodBatches) {
      copy.foodBatches = Array.from(memoryStore.foodBatches.values())
        .filter(b => b.facilityId === facility.id);
    }
    if (include?.surplusListings) {
      copy.surplusListings = Array.from(memoryStore.surplusListings.values())
        .filter(s => s.facilityId === facility.id);
    }
    return copy;
  }

  private hydrateMembership(membership: Membership, include?: any): Membership {
    const copy = { ...membership };
    if (include?.organization && membership.organizationId) {
      const org = memoryStore.organizations.get(membership.organizationId);
      if (org) {
        copy.organization = this.hydrateOrg(org, typeof include.organization === 'object' ? include.organization.include : undefined);
      }
    }
    if (include?.user) {
      const usr = memoryStore.users.get(membership.userId);
      if (usr) copy.user = usr;
    }
    return copy;
  }

  private hydrateApplication(app: OrganizationApplication, include?: any): OrganizationApplication {
    const copy = { ...app };
    if (include?.applicant && app.applicantId) {
      const u = memoryStore.users.get(app.applicantId);
      if (u) copy.applicant = u;
    }
    if (include?.reviewer && app.reviewerId) {
      const u = memoryStore.users.get(app.reviewerId);
      if (u) copy.reviewer = u;
    }
    if (include?.approvedOrganization && app.approvedOrgId) {
      const o = memoryStore.organizations.get(app.approvedOrgId);
      if (o) copy.approvedOrganization = o;
    }
    return copy;
  }

  private hydrateAuditLog(log: AuditLog, include?: any): AuditLog {
    const copy = { ...log };
    if (include?.actor && log.actorId) {
      const u = memoryStore.users.get(log.actorId);
      if (u) copy.actor = u;
    }
    return copy;
  }

  private hydrateFoodItem(item: FoodItem, include?: any): FoodItem {
    const copy = { ...item };
    if (include?.organization) {
      const org = memoryStore.organizations.get(item.organizationId);
      if (org) copy.organization = org;
    }
    if (include?.batches) {
      copy.batches = Array.from(memoryStore.foodBatches.values())
        .filter(b => b.foodItemId === item.id);
    }
    return copy;
  }

  private hydrateFoodBatch(batch: FoodBatch, include?: any): FoodBatch {
    const copy = { ...batch };
    if (include?.organization) {
      const org = memoryStore.organizations.get(batch.organizationId);
      if (org) copy.organization = org;
    }
    if (include?.facility) {
      const fac = memoryStore.facilities.get(batch.facilityId);
      if (fac) copy.facility = fac;
    }
    if (include?.foodItem) {
      const item = memoryStore.foodItems.get(batch.foodItemId);
      if (item) copy.foodItem = item;
    }
    return copy;
  }

  private hydrateInventoryTx(tx: InventoryTransaction, include?: any): InventoryTransaction {
    const copy = { ...tx };
    if (include?.organization) {
      const org = memoryStore.organizations.get(tx.organizationId);
      if (org) copy.organization = org;
    }
    if (include?.facility) {
      const fac = memoryStore.facilities.get(tx.facilityId);
      if (fac) copy.facility = fac;
    }
    if (include?.batch) {
      const batch = memoryStore.foodBatches.get(tx.batchId);
      if (batch) copy.batch = batch;
    }
    if (include?.foodItem) {
      const item = memoryStore.foodItems.get(tx.foodItemId);
      if (item) copy.foodItem = item;
    }
    return copy;
  }

  private hydrateSurplusListing(listing: SurplusListing, include?: any): SurplusListing {
    const copy = { ...listing };
    if (include?.donorOrganization) {
      const org = memoryStore.organizations.get(listing.donorOrganizationId);
      if (org) copy.donorOrganization = org;
    }
    if (include?.facility) {
      const fac = memoryStore.facilities.get(listing.facilityId);
      if (fac) copy.facility = fac;
    }
    if (include?.foodItem) {
      const item = memoryStore.foodItems.get(listing.foodItemId);
      if (item) copy.foodItem = item;
    }
    if (include?.batch) {
      const batch = memoryStore.foodBatches.get(listing.batchId);
      if (batch) copy.batch = batch;
    }
    if (include?.requests) {
      copy.requests = Array.from(memoryStore.foodRequests.values())
        .filter(r => r.surplusListingId === listing.id);
    }
    if (include?.matches) {
      copy.matches = Array.from(memoryStore.matchRecommendations.values())
        .filter(m => m.surplusListingId === listing.id)
        .map(m => this.hydrateMatchRecommendation(m));
    }
    return copy;
  }

  private hydrateFoodRequest(req: FoodRequest, include?: any): FoodRequest {
    const copy = { ...req };
    if (include?.requesterUser) {
      const u = memoryStore.users.get(req.requesterUserId);
      if (u) copy.requesterUser = u;
    }
    if (include?.requesterOrganization && req.requesterOrganizationId) {
      const org = memoryStore.organizations.get(req.requesterOrganizationId);
      if (org) copy.requesterOrganization = org;
    }
    if (include?.surplusListing && req.surplusListingId) {
      const surplus = memoryStore.surplusListings.get(req.surplusListingId);
      if (surplus) copy.surplusListing = this.hydrateSurplusListing(surplus, typeof include.surplusListing === 'object' ? include.surplusListing.include : undefined);
    }
    if (include?.matches) {
      copy.matches = Array.from(memoryStore.matchRecommendations.values())
        .filter(m => m.foodRequestId === req.id)
        .map(m => this.hydrateMatchRecommendation(m));
    }
    return copy;
  }

  private hydrateRecoveryTransaction(tx: RecoveryTransaction, include?: any): RecoveryTransaction {
    const copy = { ...tx };
    if (include?.donorOrganization) {
      const org = memoryStore.organizations.get(tx.donorOrganizationId);
      if (org) copy.donorOrganization = org;
    }
    if (include?.facility) {
      const fac = memoryStore.facilities.get(tx.facilityId);
      if (fac) copy.facility = fac;
    }
    if (include?.surplusListing) {
      const surplus = memoryStore.surplusListings.get(tx.surplusListingId);
      if (surplus) copy.surplusListing = this.hydrateSurplusListing(surplus);
    }
    if (include?.foodItem) {
      const item = memoryStore.foodItems.get(tx.foodItemId);
      if (item) copy.foodItem = item;
    }
    if (include?.batch) {
      const batch = memoryStore.foodBatches.get(tx.batchId);
      if (batch) copy.batch = batch;
    }
    if (include?.foodRequest && tx.foodRequestId) {
      const req = memoryStore.foodRequests.get(tx.foodRequestId);
      if (req) copy.foodRequest = req;
    }
    if (include?.recipientUser) {
      const u = memoryStore.users.get(tx.recipientUserId);
      if (u) copy.recipientUser = u;
    }
    if (include?.recipientOrganization && tx.recipientOrganizationId) {
      const org = memoryStore.organizations.get(tx.recipientOrganizationId);
      if (org) copy.recipientOrganization = org;
    }
    if (include?.sponsorUser && tx.sponsorUserId) {
      const u = memoryStore.users.get(tx.sponsorUserId);
      if (u) copy.sponsorUser = u;
    }
    if (include?.deliveryRoute) {
      for (const r of memoryStore.deliveryRoutes.values()) {
        if (r.recoveryTransactionId === tx.id) {
          copy.deliveryRoute = this.hydrateDeliveryRoute(r);
          break;
        }
      }
    }
    return copy;
  }

  private hydrateMatchRecommendation(rec: MatchRecommendation, include?: any): MatchRecommendation {
    const copy = { ...rec };
    if (include?.surplusListing) {
      const s = memoryStore.surplusListings.get(rec.surplusListingId);
      if (s) copy.surplusListing = this.hydrateSurplusListing(s);
    }
    if (include?.foodRequest && rec.foodRequestId) {
      const r = memoryStore.foodRequests.get(rec.foodRequestId);
      if (r) copy.foodRequest = this.hydrateFoodRequest(r);
    }
    if (include?.donorOrganization) {
      const o = memoryStore.organizations.get(rec.donorOrganizationId);
      if (o) copy.donorOrganization = o;
    }
    if (include?.recipientOrganization && rec.recipientOrganizationId) {
      const o = memoryStore.organizations.get(rec.recipientOrganizationId);
      if (o) copy.recipientOrganization = o;
    }
    if (include?.recipientUser && rec.recipientUserId) {
      const u = memoryStore.users.get(rec.recipientUserId);
      if (u) copy.recipientUser = u;
    }
    return copy;
  }

  private hydrateVehicle(veh: Vehicle, include?: any): Vehicle {
    const copy = { ...veh };
    if (include?.organization) {
      const o = memoryStore.organizations.get(veh.organizationId);
      if (o) copy.organization = o;
    }
    if (include?.deliveryRoutes) {
      copy.deliveryRoutes = Array.from(memoryStore.deliveryRoutes.values())
        .filter(r => r.vehicleId === veh.id)
        .map(r => this.hydrateDeliveryRoute(r));
    }
    return copy;
  }

  private hydrateDeliveryRoute(route: DeliveryRoute, include?: any): DeliveryRoute {
    const copy = { ...route };
    if (include?.recoveryTransaction) {
      const tx = memoryStore.recoveryTransactions.get(route.recoveryTransactionId);
      if (tx) copy.recoveryTransaction = this.hydrateRecoveryTransaction(tx);
    }
    if (include?.logisticsOrganization && route.logisticsOrganizationId) {
      const o = memoryStore.organizations.get(route.logisticsOrganizationId);
      if (o) copy.logisticsOrganization = o;
    }
    if (include?.vehicle && route.vehicleId) {
      const v = memoryStore.vehicles.get(route.vehicleId);
      if (v) copy.vehicle = this.hydrateVehicle(v);
    }
    if (include?.driver && route.driverUserId) {
      const u = memoryStore.users.get(route.driverUserId);
      if (u) copy.driver = u;
    }
    return copy;
  }

  private hydrateAIInsight(insight: AIInsight, include?: any): AIInsight {
    const copy = { ...insight };
    if (include?.organization) {
      const o = memoryStore.organizations.get(insight.organizationId);
      if (o) copy.organization = o;
    }
    return copy;
  }

  async $transaction<T>(arg: ((prisma: PrismaClient) => Promise<T>) | Promise<any>[]): Promise<any> {
    if (typeof arg === 'function') {
      return arg(this);
    }
    return Promise.all(arg);
  }

  async $connect() {}
  async $disconnect() {}
}
