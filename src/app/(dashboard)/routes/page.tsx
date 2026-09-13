'use client';

// ==============================================
// SaveByte — Logistics, Fleet & Route Mapping (Phase 4)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Route as RouteIcon,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Key,
  Navigation,
  Calendar,
  Building2,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Package,
} from 'lucide-react';
import {
  listRoutesAction,
  assignRouteAction,
  updateRouteStatusAction,
  createVehicleAction,
  listVehiclesAction,
  getLogisticsOverviewAction,
} from '@/app/actions/logisticsActions';
import { DeliveryTrackingModal, TrackingData } from '@/components/logistics/DeliveryTrackingModal';
import styles from '@/app/(dashboard)/operations.module.css';

export default function LogisticsRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    activeRoutes: 0,
    pendingPickups: 0,
    inTransitFoodKg: 0,
    deliveredCount: 0,
    totalVehicles: 0,
    activeVehicles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [assigningRoute, setAssigningRoute] = useState<any | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [scheduledPickup, setScheduledPickup] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Status & PIN Modal State
  const [verifyingRoute, setVerifyingRoute] = useState<any | null>(null);
  const [verificationPin, setVerificationPin] = useState<string>('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // New Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  // MapCN Live Tracking State
  const [trackingRoute, setTrackingRoute] = useState<any | null>(null);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mapRouteToTrackingData = (route: any): TrackingData => {
    const tx = route.recoveryTransaction;
    const donorOrg = tx?.donorOrganization;
    const recipOrg = tx?.recipientOrganization;

    const donorLng = route.pickupLongitude ?? 77.6093;
    const donorLat = route.pickupLatitude ?? 12.9716;
    const recipLng = route.destinationLongitude ?? 77.6322;
    const recipLat = route.destinationLatitude ?? 12.9854;

    return {
      routeId: route.id,
      foodName: tx?.foodItem?.name || tx?.surplusListing?.title || 'Vegetable Biryani',
      quantity: tx?.quantity || 20,
      unit: tx?.unit || 'kg',
      donorName: donorOrg?.name || 'The Grand Taj Kitchen',
      donorAddress: route.pickupLocation || '12 Brigade Road, Central Kitchen, Bengaluru',
      donorCoords: [donorLng, donorLat],
      recipientName: recipOrg?.name || 'Annapoorna Food Relief',
      recipientAddress: route.destinationLocation || '45 Indiranagar 100ft Rd, Bengaluru',
      recipientCoords: [recipLng, recipLat],
      vehicleNumber: route.vehicle?.vehicleNumber || 'KA-01-EV-4092',
      vehicleModel: route.vehicle ? `${route.vehicle.vehicleType} (${route.vehicle.capacity} ${route.vehicle.unit})` : 'Tata Ace EV (500 kg)',
      distanceKm: route.distanceKm || 2.4,
      estimatedMinutes: route.estimatedDurationMinutes || 18,
      status: route.status || 'IN_TRANSIT',
      verificationPin: route.verificationPin || tx?.verificationPin || undefined,
    };
  };

  // -------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [routesRes, vehiclesRes, metricsRes] = await Promise.all([
        listRoutesAction(statusFilter === 'ALL' ? undefined : statusFilter),
        listVehiclesAction(false),
        getLogisticsOverviewAction(),
      ]);

      if (routesRes.success && routesRes.routes) {
        setRoutes(routesRes.routes);
      }
      if (vehiclesRes.success && vehiclesRes.vehicles) {
        setVehicles(vehiclesRes.vehicles);
      }
      if (metricsRes.success && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load logistics operations data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------------------------------------------------------------
  // Vehicle Assignment
  // -------------------------------------------------------------
  const handleAssignVehicle = async () => {
    if (!assigningRoute || !selectedVehicleId) return;
    setIsSubmittingAssign(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await assignRouteAction(
        assigningRoute.id,
        selectedVehicleId,
        undefined,
        scheduledPickup || undefined
      );

      if (res.success) {
        setSuccessMsg(`Vehicle successfully assigned to Route ${assigningRoute.id}!`);
        setAssigningRoute(null);
        setSelectedVehicleId('');
        await loadData();
      } else {
        setErrorMsg(res.error || 'Failed to assign vehicle');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning vehicle');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // -------------------------------------------------------------
  // Advance Status / Pickup Handover PIN Verification
  // -------------------------------------------------------------
  const handleAdvanceStatus = async (route: any, targetStatus: string) => {
    if (targetStatus === 'COLLECTED') {
      setVerifyingRoute(route);
      setVerificationPin('');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await updateRouteStatusAction(route.id, targetStatus);
      if (res.success) {
        setSuccessMsg(`Route updated to ${targetStatus.replace(/_/g, ' ')}!`);
        await loadData();
      } else {
        setErrorMsg(res.error || 'Failed to advance route status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating status');
    }
  };

  const handleConfirmPinCollection = async () => {
    if (!verifyingRoute || !verificationPin) return;
    setIsSubmittingVerify(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await updateRouteStatusAction(
        verifyingRoute.id,
        'COLLECTED',
        verificationPin.trim()
      );

      if (res.success) {
        setSuccessMsg(`6-digit PIN verified! Food collected and route set to IN TRANSIT.`);
        setVerifyingRoute(null);
        setVerificationPin('');
        await loadData();
      } else {
        setErrorMsg(res.error || 'PIN verification failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying PIN');
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  // -------------------------------------------------------------
  // Register New Vehicle
  // -------------------------------------------------------------
  const handleCreateVehicleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingVehicle(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await createVehicleAction(fd);
      if (res.success) {
        setSuccessMsg(`Fleet vehicle ${res.vehicle?.vehicleNumber} registered successfully!`);
        setShowVehicleModal(false);
        await loadData();
      } else {
        setErrorMsg(res.error || 'Failed to register vehicle');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering vehicle');
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <RouteIcon size={32} />
            Dispatch, Fleet & Route Mapping
          </h1>
          <p className={styles.pageSubtitle}>
            End-to-end physical food recovery logistics: automated multi-point route calculation, vehicle capacity verification,
            and secure 6-digit physical handover validation.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setShowVehicleModal(true)}>
            <Plus size={16} /> Register Fleet Vehicle
          </Button>
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw size={16} /> Refresh Routes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#ecfdf5',
            border: '2px solid #059669',
            borderRadius: '1.25em',
            color: '#065f46',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#fef2f2',
            border: '2px solid #dc2626',
            borderRadius: '1.25em',
            color: '#991b1b',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={20} />
          {errorMsg}
        </div>
      )}

      {/* Operational Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Routes</span>
            <div className={styles.statIconBox}>
              <Navigation size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{metrics.activeRoutes}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>In transit or assigned</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Pending Pickups</span>
            <div className={styles.statIconBox} style={{ background: '#fef3c7' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{metrics.pendingPickups}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Awaiting vehicle dispatch</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Food In Transit</span>
            <div className={styles.statIconBox} style={{ background: '#dbeafe' }}>
              <Package size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{metrics.inTransitFoodKg} kg</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>En route to community partners</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Completed Deliveries</span>
            <div className={styles.statIconBox} style={{ background: '#dcfce7' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{metrics.deliveredCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>100% verified zero waste</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Fleet Capacity</span>
            <div className={styles.statIconBox}>
              <Truck size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {metrics.activeVehicles} / {metrics.totalVehicles}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Active delivery vehicles</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsBar}>
        {['ALL', 'PLANNED', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'COLLECTED', 'DELIVERED'].map((st) => (
          <button
            key={st}
            className={`${styles.tabButton} ${statusFilter === st ? styles.tabActive : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Route Cards List */}
      {loading ? (
        <div className={styles.emptyState}>
          <RefreshCw size={36} className="animate-spin" />
          <p className={styles.emptyTitle}>Loading active dispatch routes...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <RouteIcon size={32} />
          </div>
          <h3 className={styles.emptyTitle}>No delivery routes found</h3>
          <p className={styles.emptyDesc}>
            Delivery routes are automatically generated when a donor accepts a surplus match recommendation or when an NGO claim is confirmed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {routes.map((route) => {
            const isPlanned = route.status === 'PLANNED';
            const isAssigned = route.status === 'ASSIGNED';
            const isEnRoutePickup = route.status === 'EN_ROUTE_TO_PICKUP';
            const isAtPickup = route.status === 'AT_PICKUP';
            const isCollected = route.status === 'COLLECTED' || route.status === 'EN_ROUTE_TO_DESTINATION';
            const isDelivered = route.status === 'DELIVERED';

            const recovery = route.recoveryTransaction;
            const donorOrg = recovery?.donorOrganization;
            const recipientOrg = recovery?.recipientOrganization;

            let badgeVariant: 'green' | 'blue' | 'orange' | 'default' = 'default';
            if (isDelivered) badgeVariant = 'green';
            else if (isCollected) badgeVariant = 'blue';
            else if (isEnRoutePickup || isAtPickup) badgeVariant = 'orange';

            return (
              <div
                key={route.id}
                style={{
                  background: 'var(--sb-white)',
                  border: '2.5px solid var(--sb-black)',
                  borderRadius: '1.5em',
                  padding: '1.5rem',
                  boxShadow: '4px 4px 0px var(--sb-black)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Header: Route ID, Status Badge, Food Quantity */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: 0 }}>
                        Route #{route.id.slice(-6).toUpperCase()}
                      </h3>
                      <Badge variant={badgeVariant}>
                        {route.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      Payload:{' '}
                      <strong>
                        {recovery?.quantity || '—'} {recovery?.unit || 'kg'}
                      </strong>{' '}
                      of {recovery?.foodItem?.name || 'Prepared Food'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: 'var(--sb-pale-yellow)',
                        border: '1.5px solid var(--sb-black)',
                        borderRadius: '0.75em',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Navigation size={14} />
                      {route.distanceKm ? `${route.distanceKm} km` : 'Est. 2.4 km'}
                    </div>

                    <div
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: 'var(--sb-cream)',
                        border: '1.5px solid var(--sb-black)',
                        borderRadius: '0.75em',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Clock size={14} />
                      {route.estimatedDurationMinutes ? `${route.estimatedDurationMinutes} mins` : 'Est. 18 mins'}
                    </div>
                  </div>
                </div>

                {/* Trajectory & Facility Waypoints */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    background: '#fcfcf9',
                    border: '1.5px solid var(--sb-black)',
                    borderRadius: '1em',
                    padding: '1.25rem',
                  }}
                >
                  {/* Origin: Donor Pickup */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#dbeafe',
                        border: '2px solid var(--sb-black)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={16} style={{ color: '#1d4ed8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>
                        Pickup Location (Donor)
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sb-black)' }}>
                        {donorOrg?.name || 'Origin Donor Facility'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.2rem' }}>
                        {route.pickupAddress || recovery?.pickupAddress || 'Facility pickup location'}
                      </div>
                    </div>
                  </div>

                  {/* Destination: Recipient Facility */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#dcfce7',
                        border: '2px solid var(--sb-black)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={16} style={{ color: '#15803d' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>
                        Drop-off Location (Recipient)
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sb-black)' }}>
                        {recipientOrg?.name || 'Community Recipient Facility'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.2rem' }}>
                        {route.deliveryAddress || 'Verified community distribution site'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Geographic Route Diagram */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '0.75em',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#475569',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Navigation size={16} style={{ color: '#0284c7' }} />
                    <span>
                      <strong>Provider:</strong> Deterministic Haversine Route Estimation (2.4 km • 18 min transit)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Clean provider boundary • Ready for OpenStreetMap / Mapbox integration
                  </span>
                </div>

                {/* Vehicle & Assignment Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Truck size={18} style={{ color: '#4b5563' }} />
                    <span>
                      Vehicle:{' '}
                      {route.vehicle ? (
                        <strong>
                          {route.vehicle.vehicleNumber} ({route.vehicle.vehicleType} - {route.vehicle.capacity} {route.vehicle.unit})
                        </strong>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>Unassigned (Action required)</span>
                      )}
                    </span>
                  </div>

                  {/* Physical Handover PIN indicator */}
                  {route.verificationPin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Key size={16} />
                      <span>Security PIN required at pickup:</span>
                      <span className={styles.pinBox} style={{ fontSize: '0.95rem', padding: '0.2rem 0.5rem' }}>
                        {route.verificationPin}
                      </span>
                    </div>
                  )}
                </div>

                {/* Operational Action Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    borderTop: '1.5px solid #eee',
                    paddingTop: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* MapCN Live Route Tracking Button */}
                  <Button
                    variant="secondary"
                    onClick={() => setTrackingRoute(route)}
                    style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534', fontWeight: 800 }}
                  >
                    <Navigation size={14} /> Track Delivery
                  </Button>

                  {/* Step 1: Assign Vehicle if Planned */}
                  {isPlanned && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setAssigningRoute(route);
                        setSelectedVehicleId(vehicles.length > 0 ? vehicles[0].id : '');
                      }}
                    >
                      <Truck size={14} /> Assign Vehicle & Dispatch
                    </Button>
                  )}

                  {/* Step 2: Assigned -> En Route to Pickup */}
                  {isAssigned && (
                    <Button
                      variant="primary"
                      onClick={() => handleAdvanceStatus(route, 'EN_ROUTE_TO_PICKUP')}
                    >
                      <Navigation size={14} /> Start Trip to Pickup
                    </Button>
                  )}

                  {/* Step 3: En Route -> At Pickup */}
                  {isEnRoutePickup && (
                    <Button
                      variant="primary"
                      onClick={() => handleAdvanceStatus(route, 'AT_PICKUP')}
                    >
                      <MapPin size={14} /> Arrived at Pickup
                    </Button>
                  )}

                  {/* Step 4: At Pickup -> Collect (6-Digit PIN Handover Verification) */}
                  {isAtPickup && (
                    <Button
                      variant="primary"
                      style={{ background: '#059669', borderColor: '#047857' }}
                      onClick={() => handleAdvanceStatus(route, 'COLLECTED')}
                    >
                      <Key size={14} /> Verify 6-Digit Handover PIN & Collect
                    </Button>
                  )}

                  {/* Step 5: Collected -> Deliver */}
                  {isCollected && (
                    <Button
                      variant="primary"
                      style={{ background: '#16a34a', borderColor: '#15803d' }}
                      onClick={() => handleAdvanceStatus(route, 'DELIVERED')}
                    >
                      <CheckCircle2 size={14} /> Confirm Community Delivery
                    </Button>
                  )}

                  {isDelivered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 800 }}>
                      <CheckCircle2 size={18} />
                      Delivery Verified & Recovery Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* VEHICLE ASSIGNMENT MODAL */}
      {/* ========================================================= */}
      {assigningRoute && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Assign Fleet Vehicle</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  Route #{assigningRoute.id.slice(-6).toUpperCase()} • Payload:{' '}
                  {assigningRoute.recoveryTransaction?.quantity} {assigningRoute.recoveryTransaction?.unit}
                </p>
              </div>
              <button
                onClick={() => setAssigningRoute(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Available Fleet Vehicle</label>
                {vehicles.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>
                    No fleet vehicles registered. Please register a vehicle first!
                  </div>
                ) : (
                  <select
                    className={styles.select}
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} — {v.vehicleType} (Cap: {v.capacity} {v.unit}
                        {v.refrigerationSupported ? ', Cold Storage' : ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Scheduled Pickup Time</label>
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={scheduledPickup}
                  onChange={(e) => setScheduledPickup(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  border: '1.5px solid #22c55e',
                  borderRadius: '0.75em',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                <span>
                  Server automatically verifies vehicle weight capacity against the recovery payload before confirming dispatch.
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setAssigningRoute(null)} disabled={isSubmittingAssign}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssignVehicle}
                disabled={isSubmittingAssign || !selectedVehicleId}
              >
                {isSubmittingAssign ? 'Assigning...' : 'Confirm Assignment & Dispatch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6-DIGIT HANDOVER PIN VERIFICATION MODAL */}
      {/* ========================================================= */}
      {verifyingRoute && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Physical Handover PIN Verification</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  The donor at {verifyingRoute.pickupAddress || 'the kitchen'} holds the 6-digit handover code.
                </p>
              </div>
              <button
                onClick={() => setVerifyingRoute(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: 'var(--sb-pale-yellow)',
                  border: '1.5px solid var(--sb-black)',
                  borderRadius: '1em',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  Enter the 6-digit verification PIN provided by the kitchen manager to confirm physical food possession and
                  initiate live transit.
                </p>
              </div>

              <div className={styles.formGroup} style={{ textAlign: 'center' }}>
                <label className={styles.label}>6-Digit Verification PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  className={styles.input}
                  style={{
                    fontSize: '1.75rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    letterSpacing: '0.35em',
                    fontWeight: 900,
                  }}
                  value={verificationPin}
                  onChange={(e) => setVerificationPin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setVerifyingRoute(null)} disabled={isSubmittingVerify}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPinCollection}
                disabled={isSubmittingVerify || verificationPin.trim().length !== 6}
              >
                {isSubmittingVerify ? 'Verifying...' : 'Verify PIN & Collect Food'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REGISTER VEHICLE MODAL */}
      {/* ========================================================= */}
      {showVehicleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Register Logistics Vehicle</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  Add a delivery vehicle to your organization&apos;s food recovery fleet.
                </p>
              </div>
              <button
                onClick={() => setShowVehicleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Vehicle Number / Registration</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  placeholder="e.g. MH-02-AB-1234"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vehicle Type</label>
                  <select name="vehicleType" className={styles.select} required>
                    <option value="VAN">Light Cargo Van</option>
                    <option value="MINI_TRUCK">Mini Truck (Tata Ace)</option>
                    <option value="ELECTRIC_CARGO">Electric Cargo Two/Three Wheeler</option>
                    <option value="REFRIGERATED_TRUCK">Refrigerated Truck</option>
                    <option value="TWO_WHEELER">Two Wheeler / Express</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Payload Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="e.g. 500"
                    min="1"
                    step="1"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Capacity Unit</label>
                <select name="unit" className={styles.select}>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="portions">Portions</option>
                  <option value="crates">Crates</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="refrigeration"
                  name="refrigerationSupported"
                  value="true"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="refrigeration" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
                  Cold storage / Refrigeration supported (for perishable dairy & warm meals)
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button variant="secondary" type="button" onClick={() => setShowVehicleModal(false)} disabled={isSubmittingVehicle}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingVehicle}>
                  {isSubmittingVehicle ? 'Registering...' : 'Register Vehicle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAPCN DELIVERY TRACKING MODAL */}
      {/* ========================================================= */}
      {trackingRoute && (
        <DeliveryTrackingModal
          isOpen={!!trackingRoute}
          onClose={() => setTrackingRoute(null)}
          data={mapRouteToTrackingData(trackingRoute)}
          onPinVerified={async (pin) => {
            await updateRouteStatusAction(trackingRoute.id, 'COLLECTED', pin);
            await loadData();
            setTrackingRoute((prev: any) => (prev ? { ...prev, status: 'COLLECTED' } : null));
          }}
          onMarkDelivered={async () => {
            await updateRouteStatusAction(trackingRoute.id, 'DELIVERED');
            await loadData();
            setTrackingRoute((prev: any) => (prev ? { ...prev, status: 'DELIVERED' } : null));
          }}
        />
      )}
    </div>
  );
}
