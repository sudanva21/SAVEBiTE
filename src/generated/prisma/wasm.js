
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.4.0
 * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
 */
Prisma.prismaVersion = {
  client: "6.4.0",
  engine: "a9055b89e58b4b5bfb59600785423b1db3d0e75d"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  displayName: 'displayName',
  email: 'email',
  avatarUrl: 'avatarUrl',
  phone: 'phone',
  role: 'role',
  isOnboarded: 'isOnboarded',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  description: 'description',
  email: 'email',
  phone: 'phone',
  website: 'website',
  logoUrl: 'logoUrl',
  isVerified: 'isVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FacilityScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  type: 'type',
  address: 'address',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  operatingStatus: 'operatingStatus',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MembershipScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationApplicationScalarFieldEnum = {
  id: 'id',
  applicantId: 'applicantId',
  type: 'type',
  status: 'status',
  orgName: 'orgName',
  orgType: 'orgType',
  industryCategory: 'industryCategory',
  registrationNumber: 'registrationNumber',
  website: 'website',
  description: 'description',
  contactName: 'contactName',
  contactDesignation: 'contactDesignation',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  facilityName: 'facilityName',
  facilityType: 'facilityType',
  address: 'address',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  serviceArea: 'serviceArea',
  beneficiariesServed: 'beneficiariesServed',
  mealsPerDay: 'mealsPerDay',
  dailyFoodProduction: 'dailyFoodProduction',
  dailyFoodConsumption: 'dailyFoodConsumption',
  typicalSurplus: 'typicalSurplus',
  foodCategories: 'foodCategories',
  operatingHours: 'operatingHours',
  wasteHandlingMethod: 'wasteHandlingMethod',
  existingDonationProcess: 'existingDonationProcess',
  coldStorageAvailable: 'coldStorageAvailable',
  iotSensorsAvailable: 'iotSensorsAvailable',
  storageAvailable: 'storageAvailable',
  pickupDeliveryWindows: 'pickupDeliveryWindows',
  reviewerId: 'reviewerId',
  reviewFeedback: 'reviewFeedback',
  reviewedAt: 'reviewedAt',
  approvedOrgId: 'approvedOrgId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  previousState: 'previousState',
  newState: 'newState',
  reason: 'reason',
  context: 'context',
  createdAt: 'createdAt'
};

exports.Prisma.FoodItemScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  category: 'category',
  description: 'description',
  unit: 'unit',
  storageRequirement: 'storageRequirement',
  dietaryFlags: 'dietaryFlags',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FoodBatchScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  facilityId: 'facilityId',
  foodItemId: 'foodItemId',
  batchNumber: 'batchNumber',
  initialQuantity: 'initialQuantity',
  currentQuantity: 'currentQuantity',
  unit: 'unit',
  preparedAt: 'preparedAt',
  expiresAt: 'expiresAt',
  storageCondition: 'storageCondition',
  qualityStatus: 'qualityStatus',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  facilityId: 'facilityId',
  batchId: 'batchId',
  foodItemId: 'foodItemId',
  type: 'type',
  quantity: 'quantity',
  unit: 'unit',
  referenceType: 'referenceType',
  referenceId: 'referenceId',
  actorId: 'actorId',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.SurplusListingScalarFieldEnum = {
  id: 'id',
  donorOrganizationId: 'donorOrganizationId',
  facilityId: 'facilityId',
  foodItemId: 'foodItemId',
  batchId: 'batchId',
  title: 'title',
  description: 'description',
  totalQuantity: 'totalQuantity',
  allocatedQuantity: 'allocatedQuantity',
  availableQuantity: 'availableQuantity',
  unit: 'unit',
  status: 'status',
  qualityStatus: 'qualityStatus',
  eligibleRecipientType: 'eligibleRecipientType',
  availableFrom: 'availableFrom',
  availableUntil: 'availableUntil',
  pickupAddress: 'pickupAddress',
  pickupCity: 'pickupCity',
  pickupLatitude: 'pickupLatitude',
  pickupLongitude: 'pickupLongitude',
  pickupWindow: 'pickupWindow',
  storageCondition: 'storageCondition',
  isFreeDonation: 'isFreeDonation',
  pricePerUnit: 'pricePerUnit',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FoodRequestScalarFieldEnum = {
  id: 'id',
  requesterUserId: 'requesterUserId',
  requesterOrganizationId: 'requesterOrganizationId',
  surplusListingId: 'surplusListingId',
  foodCategory: 'foodCategory',
  requestedQuantity: 'requestedQuantity',
  unit: 'unit',
  status: 'status',
  intendedUse: 'intendedUse',
  beneficiaryCount: 'beneficiaryCount',
  urgency: 'urgency',
  requiredByDate: 'requiredByDate',
  deliveryLocation: 'deliveryLocation',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecoveryTransactionScalarFieldEnum = {
  id: 'id',
  donorOrganizationId: 'donorOrganizationId',
  facilityId: 'facilityId',
  surplusListingId: 'surplusListingId',
  foodItemId: 'foodItemId',
  batchId: 'batchId',
  foodRequestId: 'foodRequestId',
  recipientUserId: 'recipientUserId',
  recipientOrganizationId: 'recipientOrganizationId',
  orderType: 'orderType',
  quantity: 'quantity',
  unit: 'unit',
  sponsorUserId: 'sponsorUserId',
  sponsorNotes: 'sponsorNotes',
  status: 'status',
  pickupAddress: 'pickupAddress',
  pickupWindow: 'pickupWindow',
  pickupLatitude: 'pickupLatitude',
  pickupLongitude: 'pickupLongitude',
  verificationPin: 'verificationPin',
  scheduledPickupTime: 'scheduledPickupTime',
  collectedAt: 'collectedAt',
  deliveredAt: 'deliveredAt',
  completedAt: 'completedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MatchRecommendationScalarFieldEnum = {
  id: 'id',
  surplusListingId: 'surplusListingId',
  foodRequestId: 'foodRequestId',
  donorOrganizationId: 'donorOrganizationId',
  recipientOrganizationId: 'recipientOrganizationId',
  recipientUserId: 'recipientUserId',
  score: 'score',
  ranking: 'ranking',
  matchingReasons: 'matchingReasons',
  breakdown: 'breakdown',
  distanceKm: 'distanceKm',
  estimatedTravelMinutes: 'estimatedTravelMinutes',
  eligibility: 'eligibility',
  ineligibilityReason: 'ineligibilityReason',
  status: 'status',
  acceptedAt: 'acceptedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VehicleScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  vehicleNumber: 'vehicleNumber',
  vehicleType: 'vehicleType',
  capacity: 'capacity',
  unit: 'unit',
  refrigerationSupported: 'refrigerationSupported',
  currentStatus: 'currentStatus',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryRouteScalarFieldEnum = {
  id: 'id',
  recoveryTransactionId: 'recoveryTransactionId',
  logisticsOrganizationId: 'logisticsOrganizationId',
  vehicleId: 'vehicleId',
  driverUserId: 'driverUserId',
  driverName: 'driverName',
  driverPhone: 'driverPhone',
  pickupLocation: 'pickupLocation',
  pickupLatitude: 'pickupLatitude',
  pickupLongitude: 'pickupLongitude',
  destinationLocation: 'destinationLocation',
  destinationLatitude: 'destinationLatitude',
  destinationLongitude: 'destinationLongitude',
  pickupWindow: 'pickupWindow',
  deliveryWindow: 'deliveryWindow',
  distanceKm: 'distanceKm',
  estimatedDurationMinutes: 'estimatedDurationMinutes',
  status: 'status',
  verificationPin: 'verificationPin',
  startedAt: 'startedAt',
  arrivedPickupAt: 'arrivedPickupAt',
  collectedAt: 'collectedAt',
  deliveredAt: 'deliveredAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIInsightScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  facilityId: 'facilityId',
  type: 'type',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  inputHash: 'inputHash',
  result: 'result',
  confidence: 'confidence',
  provider: 'provider',
  model: 'model',
  generatedAt: 'generatedAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  User: 'User',
  Organization: 'Organization',
  Facility: 'Facility',
  Membership: 'Membership',
  OrganizationApplication: 'OrganizationApplication',
  AuditLog: 'AuditLog',
  FoodItem: 'FoodItem',
  FoodBatch: 'FoodBatch',
  InventoryTransaction: 'InventoryTransaction',
  SurplusListing: 'SurplusListing',
  FoodRequest: 'FoodRequest',
  RecoveryTransaction: 'RecoveryTransaction',
  MatchRecommendation: 'MatchRecommendation',
  Vehicle: 'Vehicle',
  DeliveryRoute: 'DeliveryRoute',
  AIInsight: 'AIInsight'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
