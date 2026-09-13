'use client';

// ==============================================
// SaveByte — Incoming Requests Queue (Donor Operations)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  listIncomingRequestsAction,
  acceptFoodRequestAction,
  rejectFoodRequestAction,
} from '@/app/actions/requestActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reject Modal
  const [rejectReq, setRejectReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listIncomingRequestsAction();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (req: any) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await acceptFoodRequestAction(req.id, req.requestedQuantity);
      if (res.success) {
        setSuccessMsg(`Successfully accepted claim! Recovery dispatch created with Verification PIN: ${res.recovery.verificationPin}`);
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReq) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await rejectFoodRequestAction(rejectReq.id, rejectReason);
      if (res.success) {
        setRejectReq(null);
        setRejectReason('');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const acceptedCount = requests.filter(r => r.status === 'ACCEPTED').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Inbox size={32} /> Incoming Recovery Requests
          </h1>
          <p className={styles.pageSubtitle}>
            Review and fulfill claims submitted by registered NGOs and community shelters against your surplus food.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Pending Review</span>
            <div className={styles.statIconBox}><Clock size={20} /></div>
          </div>
          <div className={styles.statValue}>{pendingCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Accepted Claims</span>
            <div className={styles.statIconBox}><CheckCircle2 size={20} /></div>
          </div>
          <div className={styles.statValue}>{acceptedCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Requests</span>
            <div className={styles.statIconBox}><Inbox size={20} /></div>
          </div>
          <div className={styles.statValue}>{requests.length}</div>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: '#dcfce7',
          border: '2px solid #22c55e',
          borderRadius: '1em',
          padding: '1rem',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <ShieldCheck size={20} />
          <strong>{successMsg}</strong>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '1em',
          padding: '1rem',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Recovery Requests Queue</h3>
        </div>

        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Inbox size={32} /></div>
            <h4 className={styles.emptyTitle}>No recovery requests received yet</h4>
            <p className={styles.emptyDesc}>
              When NGOs or community partners claim portions of your published surplus food, their requests appear here.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Requester</th>
                <th className={styles.th}>Surplus Food Item</th>
                <th className={styles.th}>Requested Qty</th>
                <th className={styles.th}>Urgency & Purpose</th>
                <th className={styles.th}>Submitted At</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Decision Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className={styles.tr}>
                  <td className={styles.td}>
                    {r.requesterOrganization ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={16} color="#4b5563" />
                        <strong>{r.requesterOrganization.name}</strong>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={16} color="#4b5563" />
                        <strong>{r.requesterUser?.displayName || 'Individual User'}</strong>
                      </div>
                    )}
                    {r.beneficiaryCount && (
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Serves: {r.beneficiaryCount} beneficiaries
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <strong>{r.surplusListing?.title || 'Direct Request'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Category: {r.foodCategory}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <strong style={{ fontSize: '1.15rem', color: '#166534' }}>
                      {r.requestedQuantity} {r.unit}
                    </strong>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={r.urgency === 'CRITICAL' ? 'pink' : r.urgency === 'HIGH' ? 'yellow' : 'blue'}>
                      {r.urgency}
                    </Badge>
                    {r.intendedUse && (
                      <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>
                        {r.intendedUse}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: '0.85rem' }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={r.status === 'ACCEPTED' ? 'green' : r.status === 'PENDING' ? 'yellow' : 'pink'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    {r.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="primary" onClick={() => handleAccept(r)}>
                          <CheckCircle2 size={14} /> Accept
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setRejectReq(r);
                            setRejectReason('');
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>
                        {r.status === 'ACCEPTED' ? 'Allocated' : 'Closed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {rejectReq && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reject Food Request</h3>
              <button type="button" onClick={() => setRejectReq(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#444' }}>
                State a reason for rejecting this claim ({rejectReq.requestedQuantity} {rejectReq.unit} of {rejectReq.surplusListing?.title}):
              </p>
              <div className={styles.formGroup}>
                <label className={styles.label}>Rejection Reason</label>
                <textarea
                  required
                  placeholder="e.g. Quantity already allocated to emergency relief or pickup window conflict"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setRejectReq(null)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
