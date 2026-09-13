// ==============================================
// SaveByte — Append-Only Audit Logging Service
// ==============================================
//
// Records tamper-proof audit events for security, governance,
// and state transitions across organizations and applications.
//

import { prisma } from '@/lib/db';
import { AuditLog } from '@/generated/prisma';

export interface CreateAuditLogEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousState?: unknown;
  newState?: unknown;
  reason?: string | null;
  context?: unknown;
}

export interface AuditListFilters {
  entity?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  /**
   * Appends an immutable audit log entry.
   */
  async log(entry: CreateAuditLogEntry): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        actorId: entry.actorId || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        previousState: entry.previousState ?? null,
        newState: entry.newState ?? null,
        reason: entry.reason || null,
        context: entry.context ?? null,
      },
    });
  },

  /**
   * Retrieves paginated audit logs for administrators.
   */
  async list(filters: AuditListFilters = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
};
