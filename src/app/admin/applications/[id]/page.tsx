'use client';

// ==============================================
// SaveByte — Application Detail Review Dossier
// ==============================================

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  getApplicationDetailAction,
  markApplicationUnderReviewAction,
  approveApplicationAction,
  rejectApplicationAction,
  requestChangesAction,
} from '@/app/actions/adminActions';
import type { OrganizationApplicationRecord } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  User,
  MapPin,
  Utensils,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import styles from '../../admin.module.css';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<OrganizationApplicationRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');

  const reloadData = useCallback(async () => {
    try {
      const res = await getApplicationDetailAction(applicationId);
      if (res.success && res.application) {
        setApp(res.application);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load application';
      alert(msg);
    }
  }, [applicationId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await getApplicationDetailAction(applicationId);
        if (!ignore && res.success && res.application) {
          setApp(res.application);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load application';
          alert(msg);
        }
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
  }, [applicationId]);

  const handleMarkUnderReview = async () => {
    setActionLoading(true);
    try {
      await markApplicationUnderReviewAction(applicationId);
      await reloadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(`Are you sure you want to APPROVE ${app?.orgName}? This will transactionally provision the Organization, Facility, and Owner Membership.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await approveApplicationAction(applicationId);
      if (res.success) {
        alert('Application approved! Organization and Facility provisioned successfully.');
        await reloadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason for compliance records.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await rejectApplicationAction(applicationId, rejectReason.trim());
      if (res.success) {
        setRejectModalOpen(false);
        setRejectReason('');
        await reloadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changesNotes.trim()) {
      alert('Please provide instructions for what the applicant needs to correct.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await requestChangesAction(applicationId, changesNotes.trim());
      if (res.success) {
        setChangesModalOpen(false);
        setChangesNotes('');
        await reloadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request changes failed';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Badge variant="black">✦ LOADING DOSSIER</Badge>
        <p style={{ marginTop: '1rem' }}>Decrypting and loading verification record...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Badge variant="pink">APPLICATION NOT FOUND</Badge>
        <h2 style={{ marginTop: '1rem' }}>No record matching ID: {applicationId}</h2>
        <Link href="/admin/applications" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
          <Button variant="alt" className="is--black">
            ← Return to Applications Queue
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = app.status === 'PENDING';
  const isUnderReview = app.status === 'UNDER_REVIEW';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';
  const isChangesRequested = app.status === 'CHANGES_REQUESTED';

  return (
    <div>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/admin/applications" style={{ textDecoration: 'none' }}>
          <Button variant="default" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} style={{ marginRight: '0.4rem' }} /> Back to Queue
          </Button>
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Badge variant={app.type === 'INDUSTRY' ? 'pink' : 'cyan'}>
            {app.type} APPLICATION
          </Badge>
          {isPending && <Badge variant="yellow">PENDING REVIEW</Badge>}
          {isUnderReview && <Badge variant="cyan">UNDER REVIEW</Badge>}
          {isApproved && <Badge variant="black">APPROVED</Badge>}
          {isRejected && <Badge variant="pink">REJECTED</Badge>}
          {isChangesRequested && <Badge variant="orange">CHANGES REQUESTED</Badge>}
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className={styles.dossierGrid}>
        {/* Left Column: Dossier Information Sections */}
        <div className={styles.dossierMain}>
          {/* Card 1: Organization Profile */}
          <div className={styles.dossierCard}>
            <div className={styles.dossierCardTitle}>
              <Building2 size={20} />
              <span>1. Organization & Legal Entity</span>
            </div>
            <div className={styles.kvGrid}>
              <div>
                <div className={styles.kvLabel}>Organization Legal Name</div>
                <div className={styles.kvValue}>{app.orgName}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Organization Type</div>
                <div className={styles.kvValue}>{app.orgType}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Registration / Company ID</div>
                <div className={styles.kvValue}>{app.registrationNumber || 'Not provided'}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Industry Category</div>
                <div className={styles.kvValue}>{app.industryCategory || 'N/A'}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Website</div>
                <div className={styles.kvValue}>
                  {app.website ? (
                    <a href={app.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                      {app.website}
                    </a>
                  ) : (
                    'None'
                  )}
                </div>
              </div>

              <div>
                <div className={styles.kvLabel}>Operating Hours</div>
                <div className={styles.kvValue}>{app.operatingHours || 'Standard'}</div>
              </div>

              <div className={styles.kvFull}>
                <div className={styles.kvLabel}>Description / Mission Statement</div>
                <div className={styles.kvValue} style={{ fontWeight: 500, fontSize: '0.9rem', color: '#444' }}>
                  {app.description || 'No description provided.'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Primary Contact */}
          <div className={styles.dossierCard}>
            <div className={styles.dossierCardTitle}>
              <User size={20} />
              <span>2. Authorized Contact Person</span>
            </div>
            <div className={styles.kvGrid}>
              <div>
                <div className={styles.kvLabel}>Contact Name</div>
                <div className={styles.kvValue}>{app.contactName}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Designation / Role</div>
                <div className={styles.kvValue}>{app.contactDesignation}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Official Email</div>
                <div className={styles.kvValue}>{app.contactEmail}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Official Phone</div>
                <div className={styles.kvValue}>{app.contactPhone}</div>
              </div>

              <div className={styles.kvFull}>
                <div className={styles.kvLabel}>Linked SaveByte User Account</div>
                <div className={styles.kvValue} style={{ fontSize: '0.85rem' }}>
                  ID: <code>{app.applicantId}</code> • {app.applicant?.displayName || 'Applicant'} ({app.applicant?.email})
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Primary Facility */}
          <div className={styles.dossierCard}>
            <div className={styles.dossierCardTitle}>
              <MapPin size={20} />
              <span>3. Primary Operational Facility & Location</span>
            </div>
            <div className={styles.kvGrid}>
              <div>
                <div className={styles.kvLabel}>Facility Name</div>
                <div className={styles.kvValue}>{app.facilityName || 'Main Facility'}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Facility Type</div>
                <div className={styles.kvValue}>{app.facilityType || 'OPERATIONAL'}</div>
              </div>

              <div className={styles.kvFull}>
                <div className={styles.kvLabel}>Physical Address</div>
                <div className={styles.kvValue}>{app.address}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>City / State</div>
                <div className={styles.kvValue}>{app.city}, {app.state}</div>
              </div>

              <div>
                <div className={styles.kvLabel}>Postal Code / Country</div>
                <div className={styles.kvValue}>{app.postalCode} ({app.country})</div>
              </div>

              <div>
                <div className={styles.kvLabel}>GPS Coordinates</div>
                <div className={styles.kvValue}>
                  {app.latitude && app.longitude ? (
                    <code>{app.latitude.toFixed(4)}, {app.longitude.toFixed(4)}</code>
                  ) : (
                    'Not provided (Geocoded on provisioning)'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Operational Profile */}
          <div className={styles.dossierCard}>
            <div className={styles.dossierCardTitle}>
              <Utensils size={20} />
              <span>4. Operational Metrics & Logistics</span>
            </div>
            <div className={styles.kvGrid}>
              {app.type === 'INDUSTRY' ? (
                <>
                  <div>
                    <div className={styles.kvLabel}>Approx Daily Food Production</div>
                    <div className={styles.kvValue}>{app.dailyFoodProduction || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Approx Daily Food Consumption</div>
                    <div className={styles.kvValue}>{app.dailyFoodConsumption || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Typical Surplus Quantity</div>
                    <div className={styles.kvValue}>{app.typicalSurplus || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Food Categories Handled</div>
                    <div className={styles.kvValue}>{app.foodCategories || 'Mixed'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Waste Handling Method</div>
                    <div className={styles.kvValue}>{app.wasteHandlingMethod || 'Standard'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Existing Donation Route</div>
                    <div className={styles.kvValue}>{app.existingDonationProcess || 'None'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Cold Storage / Chillers</div>
                    <div className={styles.kvValue}>{app.coldStorageAvailable ? '✅ Available' : '❌ Unavailable'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>IoT Sensors Telemetry</div>
                    <div className={styles.kvValue}>{app.iotSensorsAvailable ? '✅ Installed' : '❌ None'}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className={styles.kvLabel}>Service Area / Zone</div>
                    <div className={styles.kvValue}>{app.serviceArea || 'Citywide'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Beneficiaries Served</div>
                    <div className={styles.kvValue}>{app.beneficiariesServed ? `${app.beneficiariesServed} people` : 'Unspecified'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Daily Meals Distributed</div>
                    <div className={styles.kvValue}>{app.mealsPerDay ? `${app.mealsPerDay} meals` : 'Unspecified'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Food Categories Accepted</div>
                    <div className={styles.kvValue}>{app.foodCategories || 'All edible surplus'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Pickup / Delivery Windows</div>
                    <div className={styles.kvValue}>{app.pickupDeliveryWindows || 'Flexible'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Dry Storage Facility</div>
                    <div className={styles.kvValue}>{app.storageAvailable ? '✅ Available' : '❌ None'}</div>
                  </div>

                  <div>
                    <div className={styles.kvLabel}>Cold Storage Facility</div>
                    <div className={styles.kvValue}>{app.coldStorageAvailable ? '✅ Available' : '❌ None'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Review Decisions & Audit Trail */}
        <div className={styles.dossierSide}>
          {/* Review Actions Card */}
          <div className={styles.actionBox}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} />
              <span>Compliance Decision</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1.25rem' }}>
              Decisions are logged to the immutable append-only audit trail and enforce transactional provisioning.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isPending && (
                <Button
                  variant="default"
                  onClick={handleMarkUnderReview}
                  disabled={actionLoading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Mark Under Active Review
                </Button>
              )}

              {!isApproved && (
                <Button
                  variant="alt"
                  className="is--black"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} />
                  Approve Application
                </Button>
              )}

              {!isApproved && !isRejected && (
                <Button
                  variant="alt"
                  className="is--orange"
                  onClick={() => setChangesModalOpen(true)}
                  disabled={actionLoading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
                  Request Changes
                </Button>
              )}

              {!isApproved && !isRejected && (
                <Button
                  variant="alt"
                  className="is--pink"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <XCircle size={16} style={{ marginRight: '0.5rem' }} />
                  Reject Application
                </Button>
              )}
            </div>

            {isApproved && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--sb-lime)', borderRadius: '0.75em', fontSize: '0.85rem', fontWeight: 700 }}>
                ✅ Provisioned Organization ID:<br />
                <code>{app.approvedOrgId}</code>
              </div>
            )}
          </div>

          {/* Review History Card */}
          <div className={styles.dossierCard}>
            <div className={styles.dossierCardTitle}>
              <Clock size={20} />
              <span>Review History</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>Submitted</div>
                <div style={{ fontWeight: 700 }}>{new Date(app.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>Last Updated</div>
                <div style={{ fontWeight: 700 }}>{new Date(app.updatedAt).toLocaleString()}</div>
              </div>

              {app.reviewer && (
                <div>
                  <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>Assigned Reviewer</div>
                  <div style={{ fontWeight: 700 }}>{app.reviewer.displayName || 'Staff Reviewer'} ({app.reviewer.email})</div>
                </div>
              )}

              {(app.reviewFeedback || app.reviewNotes) && (
                <div>
                  <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>Notes / Instructions</div>
                  <div style={{ background: '#fdfaf6', padding: '0.75rem', borderRadius: '0.5em', border: '1px solid #ddd', marginTop: '0.25rem' }}>
                    {app.reviewFeedback || app.reviewNotes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Reject Application</h3>
            <p className={styles.modalDesc}>
              Please provide a compliance reason for rejecting this application. This note will be recorded in the audit log and shared with the applicant.
            </p>
            <form onSubmit={handleReject}>
              <textarea
                className={styles.modalTextarea}
                placeholder="e.g. Unverifiable business registration number or invalid food safety compliance credentials."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <Button type="button" variant="default" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="alt" className="is--pink" disabled={actionLoading}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {changesModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Request Changes & Clarifications</h3>
            <p className={styles.modalDesc}>
              Detail the exact revisions required from the applicant. The application will be moved to <strong>CHANGES_REQUESTED</strong> status.
            </p>
            <form onSubmit={handleRequestChanges}>
              <textarea
                className={styles.modalTextarea}
                placeholder="e.g. Please update the official registration number to match your government trust certification."
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <Button type="button" variant="default" onClick={() => setChangesModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="alt" className="is--orange" disabled={actionLoading}>
                  Send Changes Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
