import React from 'react';
import Link from 'next/link';
import { applicationService } from '@/services/applicationService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ClipboardList,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  HeartHandshake,
} from 'lucide-react';
import styles from './admin.module.css';

export default async function AdminDashboardPage() {
  const stats = await applicationService.getAdminStats();

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
          Platform Administration Overview
        </h1>
        <p style={{ color: '#555', marginTop: '0.25rem' }}>
          Real-time organizational verification pipeline, compliance operations, and audit records.
        </p>
      </div>

      {/* Stats Cards: Applications Review Pipeline */}
      <div style={{ marginBottom: '1rem', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Applications Pipeline
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardYellow}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Pending Industry</span>
            <Building size={20} />
          </div>
          <div className={styles.statValue}>{stats.pendingIndustry}</div>
          <div className={styles.statSubtext}>Awaiting initial review</div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardCyan}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Pending NGOs</span>
            <HeartHandshake size={20} />
          </div>
          <div className={styles.statValue}>{stats.pendingNgo}</div>
          <div className={styles.statSubtext}>Relief charities in queue</div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardCyan}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Under Review</span>
            <Clock size={20} />
          </div>
          <div className={styles.statValue}>{stats.underReview}</div>
          <div className={styles.statSubtext}>Active officer investigations</div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardOrange}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Changes Requested</span>
            <AlertCircle size={20} />
          </div>
          <div className={styles.statValue}>{stats.changesRequested}</div>
          <div className={styles.statSubtext}>Awaiting applicant updates</div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardLime}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Approved</span>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.statValue}>{stats.approvedTotal}</div>
          <div className={styles.statSubtext}>Provisioned organizations</div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardPink}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Rejected</span>
            <XCircle size={20} />
          </div>
          <div className={styles.statValue}>{stats.rejectedTotal}</div>
          <div className={styles.statSubtext}>Compliance rejections</div>
        </div>
      </div>

      {/* Stats Cards: Platform Growth */}
      <div style={{ marginBottom: '1rem', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Platform Network Entities
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Organizations</span>
            <Building2 size={20} />
          </div>
          <div className={styles.statValue}>{stats.totalOrganizations}</div>
          <div className={styles.statSubtext}>
            {stats.totalIndustryOrgs} Industry • {stats.totalNgoOrgs} NGOs
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Registered Users</span>
            <Users size={20} />
          </div>
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={styles.statSubtext}>Individual savers & team members</div>
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <div className={styles.tableTitle}>
            <ClipboardList size={22} />
            <span>Recent Applications Requiring Action</span>
          </div>
          <Link href="/admin/applications">
            <Button variant="alt" className="is--black" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              View Complete Queue →
            </Button>
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Organization</th>
                <th>Type</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                    No applications currently registered in the database.
                  </td>
                </tr>
              ) : (
                stats.recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.applicant?.displayName || app.contactName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{app.applicant?.email || app.contactEmail}</div>
                    </td>
                    <td>
                      <strong>{app.orgName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Reg: {app.registrationNumber || 'N/A'}</div>
                    </td>
                    <td>
                      <Badge variant={app.type === 'INDUSTRY' ? 'pink' : 'cyan'}>
                        {app.type}
                      </Badge>
                    </td>
                    <td>
                      {app.city}, {app.state}
                    </td>
                    <td>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {app.status === 'PENDING' && <Badge variant="yellow">PENDING</Badge>}
                      {app.status === 'UNDER_REVIEW' && <Badge variant="cyan">UNDER REVIEW</Badge>}
                      {app.status === 'CHANGES_REQUESTED' && <Badge variant="orange">CHANGES REQUESTED</Badge>}
                      {app.status === 'APPROVED' && <Badge variant="black">APPROVED</Badge>}
                      {app.status === 'REJECTED' && <Badge variant="pink">REJECTED</Badge>}
                    </td>
                    <td>
                      <Link href={`/admin/applications/${app.id}`}>
                        <Button variant="default" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                          Review Dossier →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Administrative Audit Activity */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <div className={styles.tableTitle}>
            <ShieldCheck size={22} />
            <span>Recent Administrative Activity (Append-Only Audit)</span>
          </div>
          <Link href="/admin/audit">
            <Button variant="default" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              View All Logs →
            </Button>
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Transition</th>
                <th>Details / Reason</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAudit.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                stats.recentAudit.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <strong>{(log as any).actor?.displayName || log.actorId}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>{(log as any).actor?.email}</div>
                    </td>
                    <td>
                      <code>{log.action}</code>
                    </td>
                    <td>
                      {log.entity} ({log.entityId ? log.entityId.slice(0, 8) + '...' : 'N/A'})
                    </td>
                    <td>
                      {log.previousState && log.newState ? (
                        <span style={{ fontSize: '0.8rem' }}>
                          <code>{JSON.stringify(log.previousState)}</code> → <code>{JSON.stringify(log.newState)}</code>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '280px' }}>
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
