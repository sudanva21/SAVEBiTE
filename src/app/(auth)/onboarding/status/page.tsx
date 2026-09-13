'use client';

// ==============================================
// SaveByte — Phase 2.2 Application Status & Resubmission
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getUserApplicationsAction,
  resubmitApplicationAction,
} from '@/app/actions/applicationActions';
import type { OrganizationApplicationRecord } from '@/types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import styles from './status.module.css';

function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('appId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<OrganizationApplicationRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<OrganizationApplicationRecord | null>(null);
  const [resubmitted, setResubmitted] = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      const res = await getUserApplicationsAction();
      if (res.success && res.applications) {
        setApplications(res.applications);
        if (appIdParam) {
          const matched = res.applications.find((a: OrganizationApplicationRecord) => a.id === appIdParam);
          setSelectedApp(matched || res.applications[0] || null);
        } else {
          setSelectedApp(res.applications[0] || null);
        }
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    }
  }, [appIdParam]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await getUserApplicationsAction();
        if (!ignore && res.success && res.applications) {
          setApplications(res.applications);
          if (appIdParam) {
            const matched = res.applications.find((a: OrganizationApplicationRecord) => a.id === appIdParam);
            setSelectedApp(matched || res.applications[0] || null);
          } else {
            setSelectedApp(res.applications[0] || null);
          }
        }
      } catch (err) {
        console.error('Failed to load applications', err);
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
  }, [appIdParam]);

  const handleResubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await resubmitApplicationAction(selectedApp.id, formData);
      if (res.success) {
        setResubmitted(true);
        await fetchApps();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resubmit application';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Badge variant="black">✦ RETRIEVING APPLICATION STATUS</Badge>
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading your verification records...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedApp) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Badge variant="yellow">NO APPLICATION FOUND</Badge>
            <h2 className={styles.title} style={{ marginTop: '1rem' }}>No Active Organization Applications</h2>
            <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
              You have not submitted an Industry or NGO organization application yet.
            </p>
            <Link href="/onboarding">
              <Button variant="alt" className="is--black">
                Start Onboarding Application →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = selectedApp.status === 'PENDING';
  const isUnderReview = selectedApp.status === 'UNDER_REVIEW';
  const isApproved = selectedApp.status === 'APPROVED';
  const isRejected = selectedApp.status === 'REJECTED';
  const isChangesRequested = selectedApp.status === 'CHANGES_REQUESTED';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          {applications.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {applications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedApp(app)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    border: '2px solid var(--sb-black)',
                    background: selectedApp?.id === app.id ? 'var(--sb-black)' : '#fff',
                    color: selectedApp?.id === app.id ? '#fff' : 'var(--sb-black)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  {app.orgName} ({app.status})
                </button>
              ))}
            </div>
          )}
          <div className={styles.header}>
            <div>
              <Badge variant={selectedApp.type === 'INDUSTRY' ? 'pink' : 'cyan'}>
                ✦ {selectedApp.type} APPLICATION DOSSIER
              </Badge>
              <h1 className={styles.title}>{selectedApp.orgName}</h1>
              <p className={styles.subtitle}>
                Application ID: <code>{selectedApp.id}</code> • Submitted on {new Date(selectedApp.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isPending && <Badge variant="yellow">PENDING REVIEW</Badge>}
              {isUnderReview && <Badge variant="cyan">UNDER REVIEW</Badge>}
              {isApproved && <Badge variant="black">APPROVED & ACTIVE</Badge>}
              {isRejected && <Badge variant="pink">REJECTED</Badge>}
              {isChangesRequested && <Badge variant="orange">CHANGES REQUESTED</Badge>}
            </div>
          </div>

          {/* Status Hero Block */}
          {isPending && (
            <div className={`${styles.statusHero} ${styles.statusHeroPending}`}>
              <div className={styles.statusIconBox}>
                <Clock size={28} />
              </div>
              <div className={styles.statusInfo}>
                <h2>Application Pending Review</h2>
                <p>
                  Your onboarding application has been registered into the queue. SAVEBiET compliance officers verify business registration, food safety certifications, and primary facility credentials.
                </p>
              </div>
            </div>
          )}

          {isUnderReview && (
            <div className={`${styles.statusHero} ${styles.statusHeroReview}`}>
              <div className={styles.statusIconBox}>
                <FileText size={28} />
              </div>
              <div className={styles.statusInfo}>
                <h2>Application Under Active Review</h2>
                <p>
                  A platform administrator is actively verifying your credentials and facility location. You will receive real-time status updates once review concludes.
                </p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className={`${styles.statusHero} ${styles.statusHeroApproved}`}>
              <div className={styles.statusIconBox}>
                <CheckCircle2 size={28} />
              </div>
              <div className={styles.statusInfo}>
                <h2>Application Approved!</h2>
                <p>
                  Welcome to the SAVEBiET Network. Your organization, facility, and Owner membership have been fully provisioned. You now have full operational capability.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className={`${styles.statusHero} ${styles.statusHeroRejected}`}>
              <div className={styles.statusIconBox}>
                <XCircle size={28} />
              </div>
              <div className={styles.statusInfo}>
                <h2>Application Not Approved</h2>
                <p>
                  Following administrative review, your organization application could not be approved at this time. Please see the compliance reason below.
                </p>
              </div>
            </div>
          )}

          {isChangesRequested && (
            <div className={`${styles.statusHero} ${styles.statusHeroChanges}`}>
              <div className={styles.statusIconBox}>
                <AlertCircle size={28} />
              </div>
              <div className={styles.statusInfo}>
                <h2>Action Required: Information Update Requested</h2>
                <p>
                  The SAVEBiET review team has requested clarifications or updated documentation before approval can proceed. Review the administrator note and resubmit below.
                </p>
              </div>
            </div>
          )}

          {/* Review Notes / Administrator Feedback */}
          {selectedApp.reviewNotes && (
            <div className={styles.feedbackBox}>
              <div className={styles.feedbackTitle}>
                <AlertCircle size={18} />
                <span>Administrator Feedback & Instructions</span>
              </div>
              <div className={styles.feedbackContent}>
                {selectedApp.reviewNotes}
              </div>
            </div>
          )}

          {/* Resubmission Success Banner */}
          {resubmitted && (
            <div className={styles.activeAppBanner} style={{ background: 'var(--sb-lime)', marginBottom: '1.5rem' }}>
              <div>
                <strong>Application Resubmitted Successfully!</strong>
                <div>Status updated to PENDING. Your changes have been logged for review.</div>
              </div>
            </div>
          )}

          {/* Application Details Summary */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Organization Type</div>
              <div className={styles.detailValue}>{selectedApp.orgType}</div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Registration Number</div>
              <div className={styles.detailValue}>{selectedApp.registrationNumber || 'Not provided'}</div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Primary Contact</div>
              <div className={styles.detailValue}>
                {selectedApp.contactName} ({selectedApp.contactDesignation})
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Contact Email & Phone</div>
              <div className={styles.detailValue}>
                {selectedApp.contactEmail} • {selectedApp.contactPhone}
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Facility / HQ Address</div>
              <div className={styles.detailValue}>
                {selectedApp.address}, {selectedApp.city}, {selectedApp.state} {selectedApp.postalCode}
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Website</div>
              <div className={styles.detailValue}>
                {selectedApp.website ? (
                  <a href={selectedApp.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                    {selectedApp.website}
                  </a>
                ) : (
                  'None provided'
                )}
              </div>
            </div>
          </div>

          {/* Resubmit Form if CHANGES_REQUESTED */}
          {isChangesRequested && (
            <div className={styles.resubmitSection}>
              <h2 className={styles.resubmitTitle}>
                <RotateCcw size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Update & Resubmit Application
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.25rem' }}>
                Make necessary corrections to your registration details or contact information. Resubmitting will immediately place your application back into the <strong>PENDING</strong> review queue.
              </p>

              <form onSubmit={handleResubmit}>
                <div className={styles.resubmitGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Organization Name</label>
                    <input
                      type="text"
                      name="orgName"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.orgName}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Registration Number / ID</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.registrationNumber || ''}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Contact Person Name</label>
                    <input
                      type="text"
                      name="contactName"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.contactName}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Official Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.contactEmail}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Official Phone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.contactPhone || ''}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Website</label>
                    <input
                      type="url"
                      name="website"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.website || ''}
                    />
                  </div>

                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label className={styles.fieldLabel}>Facility Address</label>
                    <input
                      type="text"
                      name="address"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.address || ''}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>City</label>
                    <input
                      type="text"
                      name="city"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.city || ''}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>State</label>
                    <input
                      type="text"
                      name="state"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.state || ''}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.postalCode || ''}
                      required
                    />
                  </div>

                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label className={styles.fieldLabel}>Organization Description</label>
                    <input
                      type="text"
                      name="description"
                      className={styles.fieldInput}
                      defaultValue={selectedApp.description || ''}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="alt"
                    className="is--orange"
                    disabled={submitting}
                  >
                    {submitting ? 'Resubmitting...' : 'Resubmit Corrected Application →'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Navigation Actions */}
          <div className={styles.actionsRow}>
            <Link href="/dashboard">
              <Button variant="default">
                ← Return to Dashboard
              </Button>
            </Link>

            {isApproved && (
              <Link href="/dashboard">
                <Button variant="alt" className="is--black">
                  Enter Command Center & Facility →
                </Button>
              </Link>
            )}

            {!isApproved && (
              <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                Questions? Contact compliance@savebiet.org
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfbf7' }}>
          <div style={{ padding: '2rem', textAlign: 'center', border: '3px solid var(--sb-black)', borderRadius: '1.5em', background: '#fff' }}>
            <Badge variant="yellow">✦ RETRIEVING VERIFICATION DOSSIER</Badge>
            <p style={{ marginTop: '1rem', fontWeight: 700 }}>Synchronizing SAVEBiET registry records...</p>
          </div>
        </div>
      }
    >
      <ApplicationStatusContent />
    </React.Suspense>
  );
}
