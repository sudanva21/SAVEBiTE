'use client';

// ==============================================
// SaveByte — Buy for Me (Consumer Secondary Recovery)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShoppingBag,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tag,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { discoverSurplusAction } from '@/app/actions/surplusActions';
import { buyForMeAction } from '@/app/actions/recoveryActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function BuyForMePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Reservation Modal
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState('1');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discoverSurplusAction({}, 'INDIVIDUAL');
      if (res.success) {
        setListings(res.listings || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to discover surplus meals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmitting(true);
    setError(null);
    setSuccessOrder(null);
    try {
      const fd = new FormData();
      fd.append('surplusListingId', selectedListing.id);
      fd.append('quantity', purchaseQty);
      fd.append('notes', orderNotes);

      const res = await buyForMeAction(fd);
      if (res.success && res.recovery) {
        setSuccessOrder(res.recovery);
        setSelectedListing(null);
        setPurchaseQty('1');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reserve surplus');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <ShoppingBag size={32} /> Buy for Me
          </h1>
          <p className={styles.pageSubtitle}>
            Rescue premium, freshly-prepared meals from partner restaurants and bakeries at deeply discounted rates before end-of-day.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </header>

      {/* Reservation Success Card */}
      {successOrder && (
        <div style={{
          background: '#ecfdf5',
          border: '2.5px solid #059669',
          borderRadius: '1.5em',
          padding: '1.5rem',
          boxShadow: '4px 4px 0px #059669',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#065f46' }}>
            <ShieldCheck size={28} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Meal Successfully Reserved!</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#047857' }}>
            Your reservation for <strong>{successOrder.quantity} {successOrder.unit}</strong> is confirmed. Present your 6-digit verification PIN to the facility staff at pickup:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.pinBox}>
              PIN: {successOrder.verificationPin}
            </div>
            <Link href="/dashboard/recovery">
              <Button variant="primary">
                View Handover Status <ArrowRight size={14} />
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
          <div className={styles.emptyIcon}><ShoppingBag size={32} /></div>
          <h4 className={styles.emptyTitle}>No consumer meal bags available right now</h4>
          <p className={styles.emptyDesc}>
            Kitchens typically post surplus portions between 14:00 and 20:00. Check back during lunch and dinner transition windows!
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
                <Badge variant="pink">
                  {l.isFreeDonation ? 'Free Rescue' : `₹${l.pricePerUnit || 0} / ${l.unit}`}
                </Badge>
              </div>

              <div className={styles.cardBody}>
                {l.description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>{l.description}</p>}

                <div className={styles.cardMetaRow}>
                  <span>Portions Available</span>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>
                    {l.availableQuantity} {l.unit}
                  </strong>
                </div>

                <div className={styles.cardMetaRow}>
                  <span>Pickup Location</span>
                  <span style={{ fontSize: '0.85rem' }}><MapPin size={12} style={{ display: 'inline' }} /> {l.pickupAddress}</span>
                </div>

                <div className={styles.cardMetaRow}>
                  <span>Pickup Window</span>
                  <span>{l.pickupWindow || '14:00 - 18:00'}</span>
                </div>

                <div className={styles.cardMetaRow}>
                  <span>Available Until</span>
                  <span style={{ fontSize: '0.85rem' }}><Clock size={12} style={{ display: 'inline' }} /> {new Date(l.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setSelectedListing(l);
                    setPurchaseQty('1');
                  }}
                >
                  <Tag size={16} /> Reserve & Rescue Meal
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reserve Modal */}
      {selectedListing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reserve Surplus Meal</h3>
              <button type="button" onClick={() => setSelectedListing(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleReserve} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--sb-cream)', padding: '1rem', borderRadius: '1em', border: '1.5px solid var(--sb-black)' }}>
                <strong>{selectedListing.title}</strong>
                <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                  Pickup at: {selectedListing.pickupAddress} ({selectedListing.pickupWindow})
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Quantity to Reserve ({selectedListing.unit})</label>
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  max={selectedListing.availableQuantity}
                  required
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Pickup Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Arriving in 20 minutes, carrying container"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#666', borderLeft: '3px solid var(--sb-forest)', paddingLeft: '0.75rem' }}>
                Note: Upon reservation, SaveByte allocates this stock and generates your secure 6-digit pickup PIN.
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setSelectedListing(null)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
