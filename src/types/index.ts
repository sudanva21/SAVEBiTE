// ==============================================
// SaveByte — Core Types (Phase 2 Identity & Domain)
// ==============================================

/** Organization classification types */
export type OrganizationType =
  | 'DONOR'
  | 'RESTAURANT'
  | 'HOTEL'
  | 'INSTITUTIONAL_KITCHEN'
  | 'FOOD_PROCESSING_UNIT'
  | 'NGO'
  | 'FOOD_BANK'
  | 'SHELTER'
  | 'COMMUNITY_KITCHEN'
  | 'SECONDARY_BUYER'
  | 'INDUSTRIAL_RECOVERY_PARTNER'
  | 'LOGISTICS_PARTNER'
  | 'PLATFORM'
  | (string & {});

/** Membership roles within an organization */
export type MembershipRole =
  | 'ORGANIZATION_OWNER'
  | 'ORGANIZATION_ADMIN'
  | 'DONOR_MANAGER'
  | 'KITCHEN_MANAGER'
  | 'PROCESSING_MANAGER'
  | 'NGO_COORDINATOR'
  | 'FOOD_BANK_COORDINATOR'
  | 'SHELTER_COORDINATOR'
  | 'COMMUNITY_KITCHEN_MANAGER'
  | 'BUYER'
  | 'INDUSTRIAL_RECOVERY_MANAGER'
  | 'LOGISTICS_MANAGER'
  | 'INDIVIDUAL_USER'
  | 'PLATFORM_ADMIN'
  | (string & {});

/** Membership lifecycle status */
export type MembershipStatus =
  | 'INVITED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REMOVED';

/** Facility classification types */
export type FacilityType =
  | 'KITCHEN'
  | 'WAREHOUSE'
  | 'COLD_STORAGE'
  | 'PROCESSING_PLANT'
  | 'DISTRIBUTION_CENTER'
  | 'COMMUNITY_KITCHEN'
  | 'RECOVERY_FACILITY'
  | 'LOGISTICS_HUB'
  | 'PRIMARY_LOCATION'
  | (string & {});

/** Capability permission keys for authorization */
export type PermissionKey =
  // Organization management
  | 'org:view'
  | 'org:manage'
  | 'org:update'
  | 'org:delete'
  // Member management
  | 'member:view'
  | 'member:invite'
  | 'member:update_role'
  | 'member:remove'
  // Facility management
  | 'facility:view'
  | 'facility:create'
  | 'facility:update'
  | 'facility:delete'
  // Food lifecycle foundation
  | 'food:create'
  | 'food:edit'
  | 'food:delete'
  | 'food:view'
  | 'food:publish'
  // Inventory
  | 'inventory:manage'
  | 'inventory:view'
  // Surplus & Requests
  | 'surplus:publish'
  | 'surplus:claim'
  | 'request:create'
  | 'request:accept'
  | 'request:view'
  // Sponsorship & Secondary Market
  | 'sponsorship:create'
  | 'buyer:purchase'
  | 'recovery:manage'
  // Logistics & Routes (Phase 4)
  | 'logistics:dispatch'
  | 'logistics:view'
  | 'logistics:manage'
  | 'route:view'
  | 'route:manage'
  | 'route:assign'
  | 'route:update'
  // Matching Engine (Phase 4)
  | 'matching:view'
  | 'matching:manage'
  | 'matching:accept'
  | 'matching:reject'
  // Analytics & Telemetry
  | 'analytics:view'
  | 'telemetry:view'
  | 'digital_twin:control'
  | 'esg:export'
  // Phase 5: AI Intelligence & Audit
  | 'ai:view'
  | 'ai:analyze'
  | 'ai:recommend'
  | 'ai:audit'
  // Platform Administration & Applications (Phase 2.2)
  | 'admin:access'
  | 'application:view'
  | 'application:review'
  | 'application:approve'
  | 'application:reject'
  | 'application:request_changes'
  | 'audit:view';

/** Active identity context resolved on server */
export interface IdentityContext {
  user: {
    id: string;
    clerkUserId: string;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
    phone: string | null;
    isOnboarded: boolean;
    role?: string | null;
  };
  memberships: Array<{
    id: string;
    userId: string;
    organizationId: string | null;
    role: string;
    status: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
      description: string | null;
      isVerified: boolean;
      facilities?: Array<{
        id: string;
        name: string;
        type: string;
        address: string;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingStatus: string;
        isPrimary: boolean;
      }>;
    } | null;
  }>;
  activeMembership: {
    id: string;
    userId: string;
    organizationId: string | null;
    role: string;
    status: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
      description: string | null;
      isVerified: boolean;
      facilities?: Array<{
        id: string;
        name: string;
        type: string;
        address: string;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingStatus: string;
        isPrimary: boolean;
      }>;
    } | null;
  } | null;
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
    type: string;
    description: string | null;
    isVerified: boolean;
    facilities?: Array<{
      id: string;
      name: string;
      type: string;
      address: string;
      city: string | null;
      state: string | null;
      latitude: number | null;
      longitude: number | null;
      operatingStatus: string;
      isPrimary: boolean;
    }>;
  } | null;
  isIndividual: boolean;
}

/** Input payload for creating a new Organization */
export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryFacility: {
    name: string;
    type?: FacilityType;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

/** Input payload for creating a Facility */
export interface CreateFacilityInput {
  name: string;
  type: FacilityType;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  operatingStatus?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  isPrimary?: boolean;
}

/** Navigation and UI presentation types */
export interface NavLink {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  isExternal?: boolean;
  isComingSoon?: boolean;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  isComingSoon?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
  icon: string;
}

export interface LifecycleStage {
  key: string;
  label: string;
  icon: string;
  description: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming-soon' | 'development';
}

// ==============================================
// Phase 2.2: Applications & Audit Types
// ==============================================

export type ApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export type ApplicationType = 'INDUSTRY' | 'NGO';

export interface OrganizationApplicationRecord {
  id: string;
  applicantId: string;
  type: ApplicationType | string;
  status: ApplicationStatus | string;
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
  reviewNotes?: string | null;
  reviewedAt: Date | string | null;
  approvedOrgId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  applicant?: {
    id: string;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  reviewer?: {
    id: string;
    displayName: string | null;
    email: string | null;
  } | null;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousState: unknown;
  newState: unknown;
  reason: string | null;
  context: unknown;
  createdAt: Date | string;
  actor?: {
    id: string;
    displayName: string | null;
    email: string | null;
  } | null;
}

// ==============================================
// Phase 3: Core Food Recovery Ecosystem Types
// ==============================================

export type FoodCategory =
  | 'PREPARED_MEALS'
  | 'GRAINS_RICE'
  | 'VEGETABLES'
  | 'FRUITS'
  | 'BAKERY'
  | 'DAIRY'
  | 'PACKAGED_FOOD'
  | 'BEVERAGES'
  | 'OTHER';

export type StorageCondition =
  | 'ROOM_TEMP'
  | 'COLD_STORAGE'
  | 'FROZEN'
  | 'HEATED'
  | 'AMBIENT'
  | 'REFRIGERATED'
  | 'WARM';

export type QualityStatus =
  | 'SUITABLE_FOR_HUMAN_RECOVERY'
  | 'REVIEW_REQUIRED'
  | 'NOT_SUITABLE_FOR_HUMAN_RECOVERY';

export type SurplusStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'RESERVED'
  | 'PICKUP_ASSIGNED'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'RECOVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'WASTED';

export type FoodRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FULFILLED';

export type RecoveryTransactionStatus =
  | 'RESERVED'
  | 'READY_FOR_PICKUP'
  | 'PICKUP_ASSIGNED'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderType =
  | 'NGO_CLAIM'
  | 'BUY_FOR_ME'
  | 'SPONSORED_MEAL';

export interface CreateFoodItemInput {
  name: string;
  category: FoodCategory | string;
  description?: string | null;
  unit: string;
  storageRequirement?: StorageCondition | string | null;
  dietaryFlags?: string | null;
}

export interface CreateFoodBatchInput {
  facilityId: string;
  foodItemId: string;
  batchNumber?: string;
  initialQuantity: number;
  unit?: string;
  preparedAt?: Date | string;
  expiresAt: Date | string;
  storageCondition?: StorageCondition | string;
  qualityStatus?: QualityStatus | string;
  notes?: string | null;
}

export interface CreateSurplusListingInput {
  facilityId: string;
  foodItemId: string;
  batchId: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit?: string;
  qualityStatus?: QualityStatus | string;
  eligibleRecipientType?: 'ALL' | 'NGO_ONLY' | 'INDIVIDUAL_ONLY';
  availableFrom?: Date | string;
  availableUntil: Date | string;
  pickupAddress?: string;
  pickupCity?: string | null;
  pickupWindow?: string | null;
  storageCondition?: StorageCondition | string;
  isFreeDonation?: boolean;
  pricePerUnit?: number;
}

export interface CreateFoodRequestInput {
  surplusListingId?: string | null;
  foodCategory?: FoodCategory | string;
  requestedQuantity: number;
  unit?: string;
  intendedUse?: string | null;
  beneficiaryCount?: number | null;
  urgency?: 'STANDARD' | 'HIGH' | 'CRITICAL';
  requiredByDate?: Date | string | null;
  deliveryLocation?: string | null;
  notes?: string | null;
}

export interface InitiateBuyForMeInput {
  surplusListingId: string;
  quantity: number;
  notes?: string | null;
}

export interface InitiateSponsorMealInput {
  surplusListingId: string;
  quantity: number;
  sponsorNotes?: string | null;
}

export interface SurplusFilterOptions {
  category?: string;
  city?: string;
  recipientType?: string;
  status?: string;
  qualityStatus?: string;
  availableOnly?: boolean;
  minQuantity?: number;
  page?: number;
  limit?: number;
}

export interface RequestFilterOptions {
  status?: string;
  organizationId?: string;
  surplusListingId?: string;
  page?: number;
  limit?: number;
}

export interface RecoveryFilterOptions {
  status?: string;
  donorOrgId?: string;
  recipientOrgId?: string;
  recipientUserId?: string;
  orderType?: string;
  page?: number;
  limit?: number;
}

// ==============================================
// Phase 5: AI Intelligence & Prediction Types
// ==============================================

export interface DemandForecast {
  organizationId: string;
  facilityId?: string | null;
  forecastDate: string; // ISO date string
  foodCategory: string;
  predictedQuantity: number;
  unit: string;
  confidence: number; // 0 - 100 percentage
  historicalDataPoints: number;
  trend: string; // e.g. "+6% versus recent baseline"
  explanation: string;
  isLimitedData: boolean;
  dataLabel: 'Measured historical data' | 'Limited historical data' | 'Simulation / estimate';
  generatedAt: string;
}

export type SurplusRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SurplusPrediction {
  organizationId: string;
  facilityId?: string | null;
  predictionDate: string;
  foodCategory: string;
  expectedProduction: number;
  predictedDemand: number;
  currentInventory: number;
  predictedSurplus: number;
  surplusPercentage: number;
  unit: string;
  riskLevel: SurplusRiskLevel;
  confidence: number;
  explanation: string;
  recommendations: string[];
  generatedAt: string;
}

export type ExpiryUrgencyStatus = 'SAFE' | 'WATCH' | 'URGENT' | 'CRITICAL' | 'EXPIRED';

export interface ExpiryItemUrgency {
  batchId?: string;
  surplusListingId?: string;
  foodItemId: string;
  foodName: string;
  category: string;
  currentQuantity: number;
  unit: string;
  expiresAt: string;
  availableUntil?: string;
  hoursUntilExpiry: number;
  urgency: ExpiryUrgencyStatus;
  urgencyReason: string;
  suitabilityStatus: string;
  hasActiveRecipient: boolean;
  disclaimer: string;
}

export interface RecoveryPriorityItem {
  id: string; // listing or batch ID
  priorityRank: number;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  urgency: ExpiryUrgencyStatus;
  hoursRemaining: number;
  activeRecipientFound: boolean;
  priorityScore: number; // 0 - 100
  reasons: string[];
  recommendedAction: string;
}

export interface WasteCategoryMetric {
  category: string;
  quantityWasted: number;
  unit: string;
  percentageOfTotalWaste: number;
  estimatedFinancialLoss?: number;
  primaryCause: string;
}

export interface WasteAnalysis {
  organizationId: string;
  facilityId?: string | null;
  analysisPeriod: string; // e.g. "Last 30 days"
  periodDays: number;
  totalProduced: number;
  totalConsumed: number;
  totalSurplus: number;
  totalRecovered: number;
  totalWasted: number;
  unit: string;
  wasteRate: number; // percentage of total production wasted
  recoveryRate: number; // percentage of total surplus recovered
  topWasteCategories: WasteCategoryMetric[];
  rootCauses: string[];
  recommendations: string[];
  confidence: number;
  dataPointsAnalyzed: number;
  generatedAt: string;
}

export interface ProductionRecommendation {
  organizationId: string;
  facilityId?: string | null;
  targetDate: string;
  foodCategory: string;
  currentPlannedProduction: number;
  recommendedProduction: number;
  productionDelta: number; // positive = increase, negative = decrease
  percentageChange: number;
  unit: string;
  // 6-part explainability contract
  what: string;
  why: string;
  basedOnWhat: string;
  howConfident: number; // percentage
  confidenceTier: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
  limitations: string;
  requiresHumanApproval: boolean;
  generatedAt: string;
}

export interface AIAuditReport {
  organizationId: string;
  organizationName: string;
  facilityId?: string | null;
  periodLabel: string;
  periodDays: number;
  generatedAt: string;
  executiveSummary: {
    totalFoodProcessed: number;
    totalFoodRecovered: number;
    totalRecordedWaste: number;
    recoveryRate: number;
    wasteRate: number;
    unit: string;
    summaryNarrative: string;
  };
  demandVsProduction: {
    averageDailyProduction: number;
    averageDailyDemand: number;
    overproductionDaysCount: number;
    underproductionDaysCount: number;
    comparableDaysAnalyzed: number;
  };
  inventoryRisk: {
    batchesAtRisk: number;
    quantityAtRisk: number;
    criticalExpiringBatches: number;
  };
  expiryRisk: {
    expiredUnrecoveredKg: number;
    avgTimeBeforeListingHours: number;
    windowAdherenceRate: number;
  };
  recoveryPerformance: {
    surplusListingsCount: number;
    successfulRecoveriesCount: number;
    avgHoursToRecovery: number;
    unclaimedExpiredListings: number;
  };
  topWasteCategories: WasteCategoryMetric[];
  operationalBottlenecks: string[];
  aiFindings: string[];
  recommendations: string[];
  potentialImpact: {
    potentialFoodSavedKg: number;
    co2eAvoidedKg: number;
    recoveryRateImprovementPercent: number;
  };
  confidence: number;
  dataReliability: 'High - Substantial history' | 'Moderate - Standard history' | 'Low - Limited historical data';
}

export interface AIOverview {
  demandForecast: DemandForecast;
  surplusPrediction: SurplusPrediction;
  urgentFoodCount: number;
  criticalFoodKg: number;
  recoveryPriorityList: RecoveryPriorityItem[];
  topRecommendation: ProductionRecommendation;
  quickWasteMetrics: {
    recoveryRate: number;
    wasteRate: number;
    topCategory: string;
  };
  providerStatus: {
    providerName: string;
    modelName: string;
    isFallback: boolean;
    notice: string;
  };
}


