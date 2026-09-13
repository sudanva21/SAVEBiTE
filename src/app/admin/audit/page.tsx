'use client';

// ==============================================
// SaveByte — Append-Only Platform Audit Log Viewer
// ==============================================

import React, { useState, useEffect } from 'react';
import { listAuditLogsAction } from '@/app/actions/adminActions';
import type { AuditLogRecord } from '@/types';
import { Badge } from '@/components/ui/Badge';
import {
  Lock,
  User,
} from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminAuditPage() {
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await listAuditLogsAction({
          entity: entityFilter === 'ALL' ? undefined : entityFilter,
          limit: 100,
        });
        if (!ignore && res.success) {
          setLogs(res.logs);
          setTotal(res.total);
        }
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [entityFilter]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Immutable Platform Audit Logs
          </h1>
          <Badge variant="black">
            <Lock size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> APPEND-ONLY
          </Badge>
        </div>
        <p style={{ color: '#555', marginTop: '0.25rem' }}>
          Tamper-evident audit trail recording every organizational application lifecycle transition, role assignment, and administrative decision.
        </p>
      </div>

      {/* Filter Bar */}
      <div className={styles.tableCard} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>Filter Entity:</span>
            {['ALL', 'OrganizationApplication', 'Organization', 'Membership', 'Role'].map((e) => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={`${styles.filterBtn} ${entityFilter === e ? styles.filterBtnActive : ''}`}
              >
                {e === 'OrganizationApplication' ? 'Applications' : e}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 700 }}>
            Total Audit Entries: {total}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Actor Identity</th>
                <th>Action Performed</th>
                <th>Entity & Target</th>
                <th>Lifecycle Transition</th>
                <th>Justification / Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    Querying cryptographic audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No audit records match the current entity filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={14} style={{ color: '#888' }} />
                        <strong>{log.actor?.displayName || log.actorId}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>
                        {log.actor?.email}
                      </div>
                    </td>
                    <td>
                      <code style={{ background: '#eee', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <div><strong>{log.entity}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        ID: <code>{log.entityId ? log.entityId.slice(0, 10) + '...' : 'Global'}</code>
                      </div>
                    </td>
                    <td>
                      {log.previousState && log.newState ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: '#888' }}>{typeof log.previousState === 'object' ? JSON.stringify(log.previousState) : String(log.previousState)}</span>
                          <span style={{ margin: '0 0.3rem' }}>→</span>
                          <span style={{ fontWeight: 700, color: 'var(--sb-black)' }}>{typeof log.newState === 'object' ? JSON.stringify(log.newState) : String(log.newState)}</span>
                        </div>
                      ) : log.newState ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{typeof log.newState === 'object' ? JSON.stringify(log.newState) : String(log.newState)}</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '320px' }}>
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
