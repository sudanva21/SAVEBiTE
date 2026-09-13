'use client';

// ==============================================
// SaveByte — Sponsor a Meal (Community Direct Relief)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Heart,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HandHeart,
} from 'lucide-react';
import { discoverSurplusAction } from '@/app/actions/surplusActions';
import { sponsorMealAction } from '@/app/actions/recoveryActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function SponsorMealPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Sponsor Modal
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [sponsorQty, setSponsorQty] = useState('10');
  const [sponsorNotes, setSponsorNotes] = useState('Sponsorship for local children shelter');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discoverSurplusAction({}, 'ALL');
      if (res.success) {
        setListings(res.listings || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meal listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmitting(true);
    setError(null);
    setSuccessOrder(null);
    try {
      const fd = new FormData();
      fd.append('surplusListingId', selectedListing.id);
      fd.append('quantity', sponsorQty);
      fd.append('sponsorNotes', sponsorNotes);

      const res = await sponsorMealAction(fd);
      if (res.success && res.recovery) {
        setSuccessOrder(res.recovery);
        setSelectedListing(null);
        setSponsorQty('10');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sponsor meals');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Heart size={32} color="#dc2626" /> Sponsor a Meal
          </h1>
          <p className={styles.pageSubtitle}>
            Directly sponsor verified surplus meals from partner kitchens to be allocated and delivered to community shelters and hunger-relief kitchens.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </header>

      {/* Success Banner */}
      {successOrder && (
        <div style={{
          background: '#fef2f2',
          border: '2.5px solid #dc2626',
          borderRadius: '1.5em',
          padding: '1.5rem',
          boxShadow: '4px 4px 0px #dc2626',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b' }}>
            <Heart size={28} color="#dc2626" />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Meals Sponsored Successfully!</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#7f1d1d' }}>
            You have sponsored <strong>{successOrder.quantity} {successOrder.unit}</strong> of nutritious food. The batch has been marked as READY_FOR_PICKUP for relief volunteers:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.pinBox}>
              PIN: {successOrder.verificationPin}
            </div>
            <Link href="/dashboard/recovery">
              <Button variant="primary">
                Track Recovery Impact <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
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

      {/* Cards Grid */}
      {listings.length === 0 ? (
        <div className={styles.emptyState} style={{ background: 'var(--sb-white)', border: '2px solid var(--sb-black)', borderRadius: '1.5em' }}>
          <div className={styles.emptyIcon}><Heart size={32} color="#dc2626" /></div>
          <h4 className={styles.emptyTitle}>No meal batches currently awaiting sponsorship</h4>
          <p className={styles.emptyDesc}>
            Check back soon as commercial kitchens and banquet providers post fresh preparation surplus batches.
          </p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {listings.map((l) => (
            <div key={l.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{l.title}</h3>
                  <div className={styles.cardSub}>
                    <Building2 size={14} />
                    <strong>{l.donorOrganization?.name}</strong>
                  </div>
                </div>
                <Badge variant="purple">Direct Relief</Badge>
              </div>

              <div className={styles.cardBody}>
                {l.description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>{l.description}</p>}

                <div className={styles.cardMetaRow}>
                  <span>Meals Available for Relief</span>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>
                    {l.availableQuantity} {l.unit}
                  </strong>
                </div>

                <div className={styles.cardMetaRow}>
                  <span>Kitchen Location</span>
                  <span style={{ fontSize: '0.85rem' }}><MapPin size={12} style={{ display: 'inline' }} /> {l.pickupAddress}</span>
                </div>

                <div className={styles.cardMetaRow}>
                  <span>Freshness Window</span>
                  <span><Clock size={12} style={{ display: 'inline' }} /> Until {new Date(l.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setSelectedListing(l);
                    setSponsorQty(Math.min(10, l.availableQuantity).toString());
                  }}
                >
                  <HandHeart size={16} /> Sponsor This Food Batch
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sponsor Modal */}
      {selectedListing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Sponsor Food Relief</h3>
              <button type="button" onClick={() => setSelectedListing(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--sb-cream)', padding: '1rem', borderRadius: '1em', border: '1.5px solid var(--sb-black)' }}>
                <strong>{selectedListing.title}</strong>
                <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                  Kitchen: {selectedListing.donorOrganization?.name} | Available: {selectedListing.availableQuantity} {selectedListing.unit}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Quantity to Sponsor ({selectedListing.unit})</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={selectedListing.availableQuantity}
                  required
                  value={sponsorQty}
                  onChange={(e) => setSponsorQty(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dedication or Notes for Community Volunteers</label>
                <textarea
                  placeholder="e.g. Dedicated to community hunger relief, please deliver to evening shelter"
                  value={sponsorNotes}
                  onChange={(e) => setSponsorNotes(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setSelectedListing(null)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Allocating...' : 'Complete Meal Sponsorship'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
