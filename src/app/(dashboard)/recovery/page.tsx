'use client';

// ==============================================
// SaveByte — Recovery, Pickup & Handover Tracker (Phase 3)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Recycle,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  User,
  KeyRound,
  Truck,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  listRecoveriesAction,
  confirmPickupAction,
  confirmDeliveryAction,
  completeRecoveryAction,
} from '@/app/actions/recoveryActions';
import { DeliveryTrackingModal, TrackingData } from '@/components/logistics/DeliveryTrackingModal';
import styles from '@/app/(dashboard)/operations.module.css';

export default function RecoveryTrackerPage() {
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // MapCN Live Tracking Modal
  const [trackingTx, setTrackingTx] = useState<any | null>(null);

  // Pickup PIN Modal
  const [pickupTx, setPickupTx] = useState<any | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const txToTrackingData = (tx: any): TrackingData => {
    const route = tx.deliveryRoute;
    const donorLng = route?.pickupLongitude ?? 77.6093;
    const donorLat = route?.pickupLatitude ?? 12.9716;
    const recipLng = route?.destinationLongitude ?? 77.6322;
    const recipLat = route?.destinationLatitude ?? 12.9854;

    return {
      routeId: route?.id || tx.id,
      foodName: tx.surplusListing?.title || tx.foodItem?.name || 'Vegetable Biryani',
      quantity: tx.quantity,
      unit: tx.unit,
      donorName: tx.donorOrganization?.name || 'The Grand Taj Kitchen',
      donorAddress: tx.pickupAddress || '12 Brigade Road, Central Kitchen, Bengaluru',
      donorCoords: [donorLng, donorLat],
      recipientName: tx.recipientOrganization?.name || tx.recipientUser?.displayName || 'Annapoorna Food Relief',
      recipientAddress: tx.deliveryAddress || '45 Indiranagar 100ft Rd, Bengaluru',
      recipientCoords: [recipLng, recipLat],
      vehicleNumber: route?.vehicle?.vehicleNumber || 'KA-01-EV-4092',
      vehicleModel: route?.vehicle?.vehicleType
        ? `${route.vehicle.vehicleType} (${route.vehicle.capacity} ${route.vehicle.unit})`
        : 'Tata Ace EV (500 kg)',
      distanceKm: route?.distanceKm || 2.4,
      estimatedMinutes: route?.estimatedDurationMinutes || 18,
      status: route?.status || (tx.status === 'COLLECTED' ? 'IN_TRANSIT' : tx.status === 'DELIVERED' ? 'DELIVERED' : 'ASSIGNED'),
      verificationPin: tx.verificationPin || route?.verificationPin,
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRecoveriesAction();
      if (res.success) {
        setRecoveries(res.recoveries || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load recoveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupTx) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await confirmPickupAction(pickupTx.id, enteredPin);
      if (res.success) {
        setPickupTx(null);
        setEnteredPin('');
        setSuccessMsg(`Pickup verified and confirmed for ${res.recovery.quantity} ${res.recovery.unit}! Status updated to COLLECTED.`);
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm pickup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async (txId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await confirmDeliveryAction(txId, 'Verified delivery at recipient location');
      if (res.success) {
        setSuccessMsg(`Delivery recorded! Food status updated to DELIVERED.`);
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record delivery');
    }
  };

  const handleComplete = async (txId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await completeRecoveryAction(txId, 'Handover finalized. Meal recovery cycle completed.');
      if (res.success) {
        setSuccessMsg(`Recovery transaction COMPLETED! Impact successfully recorded.`);
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete recovery');
    }
  };

  const activeDeliveriesCount = recoveries.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
  const completedCount = recoveries.filter(r => r.status === 'COMPLETED').length;
  const totalQuantityRecovered = recoveries
    .filter(r => r.status === 'COMPLETED')
    .reduce((acc, r) => acc + (r.quantity || 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Recycle size={32} /> Recovery & Handover Tracker
          </h1>
          <p className={styles.pageSubtitle}>
            End-to-end verification lifecycle: track meal reservation, physical pickup with secure PIN validation, and delivery completion.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Dispatches</span>
            <div className={styles.statIconBox}><Truck size={20} /></div>
          </div>
          <div className={styles.statValue}>{activeDeliveriesCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Completed Recoveries</span>
            <div className={styles.statIconBox}><CheckCircle2 size={20} /></div>
          </div>
          <div className={styles.statValue}>{completedCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Food Rescued</span>
            <div className={styles.statIconBox}><ShieldCheck size={20} /></div>
          </div>
          <div className={styles.statValue}>{totalQuantityRecovered.toLocaleString()} kg</div>
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

      {/* Recovery Cards */}
      {recoveries.length === 0 ? (
        <div className={styles.emptyState} style={{ background: 'var(--sb-white)', border: '2px solid var(--sb-black)', borderRadius: '1.5em' }}>
          <div className={styles.emptyIcon}><Recycle size={32} /></div>
          <h4 className={styles.emptyTitle}>No recovery transactions active</h4>
          <p className={styles.emptyDesc}>
            Transactions are generated when a donor accepts an NGO request, or when a user reserves food via Buy for Me or Sponsor a Meal.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {recoveries.map((tx) => {
            const isCompleted = tx.status === 'COMPLETED';
            const isDelivered = tx.status === 'DELIVERED';
            const isCollected = tx.status === 'COLLECTED';
            const isReady = tx.status === 'READY_FOR_PICKUP' || tx.status === 'RESERVED' || tx.status === 'PICKUP_ASSIGNED';

            return (
              <div
                key={tx.id}
                style={{
                  background: 'var(--sb-white)',
                  border: '2.5px solid var(--sb-black)',
                  borderRadius: '1.75em',
                  padding: '1.5rem',
                  boxShadow: '5px 5px 0px var(--sb-black)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.35rem' }}>
                        {tx.surplusListing?.title || tx.foodItem?.name || 'Food Recovery Batch'}
                      </h3>
                      <Badge variant={tx.orderType === 'NGO_CLAIM' ? 'purple' : tx.orderType === 'SPONSORED_MEAL' ? 'pink' : 'cyan'}>
                        {tx.orderType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Transaction ID: <strong>{tx.id}</strong></span>
                      <span>•</span>
                      <span>Created: {new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Status & PIN */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div className={styles.pinBox}>
                      <KeyRound size={16} /> PIN: {tx.verificationPin}
                    </div>
                    <Badge variant={isCompleted ? 'green' : isDelivered ? 'cyan' : isCollected ? 'blue' : 'yellow'}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>

                {/* Progress Steps */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  background: 'var(--sb-cream)',
                  padding: '0.75rem 1rem',
                  borderRadius: '1em',
                  border: '1.5px solid var(--sb-black)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: isReady || isCollected || isDelivered || isCompleted ? 800 : 500, color: isReady || isCollected || isDelivered || isCompleted ? 'var(--sb-black)' : '#888' }}>
                    <CheckCircle2 size={16} color={isReady || isCollected || isDelivered || isCompleted ? '#166534' : '#aaa'} />
                    1. Reserved
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: isCollected || isDelivered || isCompleted ? 800 : 500, color: isCollected || isDelivered || isCompleted ? 'var(--sb-black)' : '#888' }}>
                    <CheckCircle2 size={16} color={isCollected || isDelivered || isCompleted ? '#166534' : '#aaa'} />
                    2. Picked Up (PIN)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: isDelivered || isCompleted ? 800 : 500, color: isDelivered || isCompleted ? 'var(--sb-black)' : '#888' }}>
                    <CheckCircle2 size={16} color={isDelivered || isCompleted ? '#166534' : '#aaa'} />
                    3. Delivered
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: isCompleted ? 800 : 500, color: isCompleted ? 'var(--sb-black)' : '#888' }}>
                    <CheckCircle2 size={16} color={isCompleted ? '#166534' : '#aaa'} />
                    4. Completed
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.9rem',
                }}>
                  <div>
                    <span style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Quantity</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>
                      {tx.quantity} {tx.unit}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Donor Organization</span>
                    <div style={{ fontWeight: 700 }}>{tx.donorOrganization?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{tx.pickupAddress}</div>
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Recipient / Beneficiary</span>
                    <div style={{ fontWeight: 700 }}>
                      {tx.recipientOrganization?.name || tx.recipientUser?.displayName || 'Community Pool'}
                    </div>
                    {tx.sponsorUser && (
                      <div style={{ fontSize: '0.8rem', color: '#c026d3' }}>
                        Sponsored by: {tx.sponsorUser.displayName}
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Handover Timeline</span>
                    <div style={{ fontSize: '0.85rem' }}>
                      {tx.collectedAt ? `Collected: ${new Date(tx.collectedAt).toLocaleTimeString()}` : 'Awaiting pickup'}
                    </div>
                    {tx.completedAt && (
                      <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                        Completed: {new Date(tx.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Handover Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1.5px dashed #ccc', paddingTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* MapCN Route Tracker Button */}
                  <Button
                    variant="secondary"
                    onClick={() => setTrackingTx(tx)}
                    style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534', fontWeight: 800 }}
                  >
                    <Truck size={16} /> Track Delivery
                  </Button>

                  {!isCompleted && (
                    <>
                      {isReady && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setPickupTx(tx);
                            setEnteredPin('');
                          }}
                        >
                          <KeyRound size={16} /> Enter PIN to Confirm Pickup
                        </Button>
                      )}
                    {isCollected && (
                      <Button variant="secondary" onClick={() => handleConfirmDelivery(tx.id)}>
                        <Truck size={16} /> Confirm Handover / Delivery
                      </Button>
                    )}
                    {(isDelivered || isCollected) && (
                      <Button variant="primary" onClick={() => handleComplete(tx.id)}>
                        <CheckCircle2 size={16} /> Finalize & Complete Recovery
                      </Button>
                    )}
                  </>
                )}
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PIN Verification Modal */}
      {pickupTx && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Physical Pickup</h3>
              <button type="button" onClick={() => setPickupTx(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleConfirmPickup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#333' }}>
                Ask the recipient or recovery driver for the 6-digit verification PIN provided on their reservation screen:
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>6-Digit Handover Verification PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 849201"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className={styles.input}
                  style={{
                    fontSize: '1.75rem',
                    textAlign: 'center',
                    letterSpacing: '0.25em',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#666', background: 'var(--sb-cream)', padding: '0.75rem', borderRadius: '0.75em' }}>
                Dispatching: <strong>{pickupTx.quantity} {pickupTx.unit}</strong> of {pickupTx.surplusListing?.title}
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setPickupTx(null)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting || enteredPin.length !== 6}>
                  {submitting ? 'Verifying PIN...' : 'Verify PIN & Confirm Pickup'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MapCN Delivery Tracking Modal */}
      {trackingTx && (
        <DeliveryTrackingModal
          isOpen={!!trackingTx}
          onClose={() => setTrackingTx(null)}
          data={txToTrackingData(trackingTx)}
          onPinVerified={async (pin) => {
            await confirmPickupAction(trackingTx.id, pin);
            await loadData();
            setTrackingTx((prev: any) => (prev ? { ...prev, status: 'COLLECTED' } : null));
          }}
          onMarkDelivered={async () => {
            await confirmDeliveryAction(trackingTx.id);
            await loadData();
            setTrackingTx((prev: any) => (prev ? { ...prev, status: 'DELIVERED' } : null));
          }}
        />
      )}
    </div>
  );
}
