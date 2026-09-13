'use client';

// ==============================================
// SaveByte — Delivery Tracking Modal (MapCN Experience)
// ==============================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Building2,
  Heart,
  Navigation,
  KeyRound,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MapRoute,
  RouteProgress,
} from '@/components/ui/map';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface TrackingData {
  routeId: string;
  foodName: string;
  quantity: number;
  unit: string;
  donorName: string;
  donorAddress: string;
  donorCoords: [number, number]; // [lng, lat]
  recipientName: string;
  recipientAddress: string;
  recipientCoords: [number, number]; // [lng, lat]
  vehicleNumber: string;
  vehicleModel: string;
  distanceKm: number;
  estimatedMinutes: number;
  status: string;
  verificationPin?: string;
}

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TrackingData;
  onPinVerified?: (pin: string) => Promise<void>;
  onMarkDelivered?: () => Promise<void>;
}

export function DeliveryTrackingModal({
  isOpen,
  onClose,
  data,
  onPinVerified,
  onMarkDelivered,
}: DeliveryTrackingModalProps) {
  const [currentStatus, setCurrentStatus] = useState(data.status);
  const [simulatedProgress, setSimulatedProgress] = useState(0.45); // 45% along route
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Compute interpolated vehicle coordinates along the line between donor and recipient
  const [donorLng, donorLat] = data.donorCoords;
  const [recLng, recLat] = data.recipientCoords;

  const vehicleLng = Number((donorLng + (recLng - donorLng) * simulatedProgress).toFixed(6));
  const vehicleLat = Number((donorLat + (recLat - donorLat) * simulatedProgress).toFixed(6));
  const vehicleCoords: [number, number] = [vehicleLng, vehicleLat];

  // Route path line string
  const routeLine: [number, number][] = [
    data.donorCoords,
    vehicleCoords,
    data.recipientCoords,
  ];

  // Simulated animation effect moving vehicle smoothly
  useEffect(() => {
    if (!isOpen || currentStatus === 'DELIVERED') return;

    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 0.88) return 0.25; // Loop for demo observation
        return prev + 0.04;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const handleVerifyPin = async () => {
    if (!pinInput || pinInput.length !== 6) {
      setPinError('Please enter a valid 6-digit physical handover PIN');
      return;
    }

    setIsUpdating(true);
    setPinError(null);

    try {
      if (onPinVerified) {
        await onPinVerified(pinInput);
      }
      setPinSuccess(true);
      setCurrentStatus('COLLECTED');
    } catch (err: any) {
      setPinError(err.message || 'Invalid PIN entered');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteDelivery = async () => {
    setIsUpdating(true);
    try {
      if (onMarkDelivered) {
        await onMarkDelivered();
      }
      setCurrentStatus('DELIVERED');
      setSimulatedProgress(1.0);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '2px solid #1B4332',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FDFBF7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#1B4332',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                  Live Logistics Route Tracking
                </h2>
                <Badge variant={currentStatus === 'DELIVERED' ? 'green' : 'yellow'}>
                  {currentStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.15rem 0 0' }}>
                Route ID: {data.routeId} · Powered by MapCN & MapLibre GL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '0.25rem',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Body: Map + Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', flex: 1, minHeight: '440px', overflow: 'hidden' }}>
          {/* Map Column */}
          <div style={{ position: 'relative', height: '100%', minHeight: '440px' }}>
            <Map
              initialCenter={vehicleCoords}
              initialZoom={14}
              style={{ height: '100%', minHeight: '440px', borderRadius: 0, border: 'none' }}
            >
              <MapControls position="top-right" />

              <RouteProgress
                progressPercent={Math.round(simulatedProgress * 100)}
                status={currentStatus}
                etaMinutes={Math.max(2, Math.round(data.estimatedMinutes * (1 - simulatedProgress)))}
              />

              <MapRoute coordinates={routeLine} color="#2D6A4F" width={6} />

              {/* Pickup Marker */}
              <MapMarker coordinates={data.donorCoords}>
                <MarkerContent style={{ background: '#1B4332', color: '#FFFFFF', border: '2px solid #FFFFFF' }}>
                  <Building2 size={16} />
                </MarkerContent>
              </MapMarker>

              {/* Destination Marker */}
              <MapMarker coordinates={data.recipientCoords}>
                <MarkerContent style={{ background: '#DC2626', color: '#FFFFFF', border: '2px solid #FFFFFF' }}>
                  <Heart size={16} />
                </MarkerContent>
              </MapMarker>

              {/* Current Vehicle Marker */}
              <MapMarker coordinates={vehicleCoords}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <MarkerContent
                    style={{
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 0 0 6px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <Truck size={18} />
                  </MarkerContent>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: '#111827',
                      color: '#FFFFFF',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      marginTop: '2px',
                    }}
                  >
                    {data.vehicleNumber}
                  </span>
                </div>
              </MapMarker>
            </Map>

            {/* Simulation Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(17, 24, 39, 0.85)',
                color: '#fff',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
              }}
            >
              <Radio size={12} color="#10B981" />
              Demo tracking — Simulated vehicle position
            </div>
          </div>

          {/* Details Sidebar */}
          <div
            style={{
              padding: '1.25rem',
              overflowY: 'auto',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderLeft: '1px solid #E5E7EB',
            }}
          >
            {/* Food Shipment Card */}
            <div
              style={{
                background: '#FDFBF7',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280' }}>
                Food Recovery Shipment
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1B4332', marginTop: '0.2rem' }}>
                {data.quantity} {data.unit} · {data.foodName}
              </div>
            </div>

            {/* Waypoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1B4332',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280' }}>PICKUP DONOR</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{data.donorName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{data.donorAddress}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#DC2626',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Heart size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280' }}>DESTINATION RECIPIENT</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{data.recipientName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{data.recipientAddress}</div>
                </div>
              </div>
            </div>

            {/* Logistics Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                background: '#F9FAFB',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Vehicle</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>{data.vehicleModel}</span>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>{data.vehicleNumber}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Distance & ETA</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>{data.distanceKm} km</span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'block' }}>
                  ~{data.estimatedMinutes} mins
                </span>
              </div>
            </div>

            {/* Handover PIN Section */}
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '12px',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <KeyRound size={15} color="#B45309" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                  Physical Handover Verification PIN
                </span>
              </div>

              {data.verificationPin && (
                <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.15em', color: '#B45309', margin: '0.2rem 0' }}>
                  {data.verificationPin}
                </div>
              )}

              {currentStatus !== 'DELIVERED' && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #D97706',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleVerifyPin}
                    disabled={isUpdating}
                  >
                    Verify PIN
                  </Button>
                </div>
              )}

              {pinError && (
                <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.35rem', fontWeight: 600 }}>
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={12} />
                  PIN verified! Handover transitioned to COLLECTED.
                </div>
              )}
            </div>

            {/* Action Bar */}
            {currentStatus !== 'DELIVERED' && (
              <Button
                variant="secondary"
                onClick={handleCompleteDelivery}
                disabled={isUpdating}
                style={{ width: '100%' }}
              >
                Mark Handover Completed (Delivered)
              </Button>
            )}

            {currentStatus === 'DELIVERED' && (
              <div
                style={{
                  padding: '0.75rem',
                  background: '#ECFDF5',
                  border: '1px solid #10B981',
                  borderRadius: '10px',
                  color: '#065F46',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                Delivery Handover 100% Completed & Verified!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
