'use client';

// ==============================================
// SaveByte — Matching Engine & Recipient Intelligence (Phase 4)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  GitMerge,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  HandHeart,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  Truck,
} from 'lucide-react';
import { getMatchesForSurplusAction, acceptMatchAction, rejectMatchAction } from '@/app/actions/matchingActions';
import { discoverSurplusAction } from '@/app/actions/surplusActions';
import { createFoodRequestAction } from '@/app/actions/requestActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function MatchingEnginePage() {
  const [activeTab, setActiveTab] = useState<'DONOR_MATCHING' | 'RECIPIENT_DISCOVERY'>('DONOR_MATCHING');

  // Donor Matching State
  const [donorSurpluses, setDonorSurpluses] = useState<any[]>([]);
  const [selectedSurplusId, setSelectedSurplusId] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [acceptingMatch, setAcceptingMatch] = useState<any | null>(null);
  const [acceptQty, setAcceptQty] = useState<number>(0);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

  // Recipient Discovery State
  const [discoveryListings, setDiscoveryListings] = useState<any[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedClaimListing, setSelectedClaimListing] = useState<any | null>(null);
  const [claimQty, setClaimQty] = useState('');
  const [intendedUse, setIntendedUse] = useState('Community food distribution');
  const [beneficiaries, setBeneficiaries] = useState('50');
  const [urgency, setUrgency] = useState('STANDARD');
  const [claimNotes, setClaimNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Global Notification State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Load Donor Listings for Matching
  // -------------------------------------------------------------
  const loadDonorSurpluses = useCallback(async () => {
    try {
      const res = await discoverSurplusAction({}, 'ALL');
      if (res.success && res.listings) {
        setDonorSurpluses(res.listings);
        if (res.listings.length > 0 && !selectedSurplusId) {
          setSelectedSurplusId(res.listings[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching donor listings', err);
    }
  }, [selectedSurplusId]);

  // -------------------------------------------------------------
  // Load Matches for Selected Surplus Listing
  // -------------------------------------------------------------
  const loadMatches = useCallback(async (surplusId: string) => {
    if (!surplusId) return;
    setLoadingMatches(true);
    setErrorMsg(null);
    try {
      const res = await getMatchesForSurplusAction(surplusId);
      if (res.success && res.matches) {
        setMatches(res.matches);
      } else {
        setErrorMsg(res.error || 'Failed to evaluate matches');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error running matching engine');
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // -------------------------------------------------------------
  // Load Recipient Discovery Listings
  // -------------------------------------------------------------
  const loadDiscovery = useCallback(async () => {
    setLoadingDiscovery(true);
    setErrorMsg(null);
    try {
      const res = await discoverSurplusAction(
        { category: filterCategory || undefined, city: filterCity || undefined },
        'NGO'
      );
      if (res.success) {
        setDiscoveryListings(res.listings || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load discovery surplus');
    } finally {
      setLoadingDiscovery(false);
    }
  }, [filterCategory, filterCity]);

  useEffect(() => {
    loadDonorSurpluses();
    loadDiscovery();
  }, [loadDonorSurpluses, loadDiscovery]);

  useEffect(() => {
    if (selectedSurplusId) {
      loadMatches(selectedSurplusId);
    }
  }, [selectedSurplusId, loadMatches]);

  // -------------------------------------------------------------
  // Handle Match Acceptance
  // -------------------------------------------------------------
  const handleOpenAcceptModal = (match: any) => {
    setAcceptingMatch(match);
    const candidateQty = match.foodRequest?.requestedQuantity || match.surplusListing?.availableQuantity || 0;
    const maxAvail = match.surplusListing?.availableQuantity || 0;
    setAcceptQty(Math.min(candidateQty, maxAvail));
  };

  const handleConfirmAccept = async () => {
    if (!acceptingMatch) return;
    setIsSubmittingAccept(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await acceptMatchAction(acceptingMatch.id, acceptQty);
      if (res.success) {
        setSuccessMsg(
          `Match accepted! Allocated ${acceptQty} ${acceptingMatch.surplusListing?.unit || 'kg'} to ${
            acceptingMatch.recipientOrganization?.name || 'recipient'
          }. Route created and ready for dispatch!`
        );
        setAcceptingMatch(null);
        await loadMatches(selectedSurplusId);
        await loadDonorSurpluses();
      } else {
        setErrorMsg(res.error || 'Failed to accept match recommendation');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error accepting match');
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  // -------------------------------------------------------------
  // Handle Match Rejection
  // -------------------------------------------------------------
  const handleReject = async (matchId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await rejectMatchAction(matchId, 'Declined by donor operator');
      if (res.success) {
        setSuccessMsg('Match recommendation rejected.');
        await loadMatches(selectedSurplusId);
      } else {
        setErrorMsg(res.error || 'Failed to reject match');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting match');
    }
  };

  // -------------------------------------------------------------
  // Handle NGO Claim
  // -------------------------------------------------------------
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimListing) return;
    setSubmittingClaim(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const fd = new FormData();
      fd.append('surplusListingId', selectedClaimListing.id);
      fd.append('foodCategory', selectedClaimListing.foodItem?.category || 'OTHER');
      fd.append('requestedQuantity', claimQty);
      fd.append('unit', selectedClaimListing.unit);
      fd.append('intendedUse', intendedUse);
      fd.append('beneficiaryCount', beneficiaries);
      fd.append('urgency', urgency);
      fd.append('notes', claimNotes);

      const res = await createFoodRequestAction(fd);
      if (res.success) {
        setSelectedClaimListing(null);
        setClaimQty('');
        setSuccessMsg(
          `Recovery claim for ${claimQty} ${selectedClaimListing.unit} submitted to ${selectedClaimListing.donorOrganization?.name}!`
        );
        await loadDiscovery();
      } else {
        setErrorMsg('Failed to submit claim');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const currentSurplus = donorSurpluses.find((s) => s.id === selectedSurplusId);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <GitMerge size={32} />
            Matching Engine & Recipient Intelligence
          </h1>
          <p className={styles.pageSubtitle}>
            Deterministic, explainable operational matchmaking connecting available surplus batches with eligible
            community kitchens, food banks, shelters, and recovery partners.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            onClick={() => {
              loadDonorSurpluses();
              if (selectedSurplusId) loadMatches(selectedSurplusId);
              loadDiscovery();
            }}
          >
            <RefreshCw size={16} />
            Refresh Intelligence
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

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabButton} ${activeTab === 'DONOR_MATCHING' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('DONOR_MATCHING')}
        >
          <Sparkles size={18} />
          Donor Engine: Surplus Matching & Candidate Ranking
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'RECIPIENT_DISCOVERY' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('RECIPIENT_DISCOVERY')}
        >
          <Building2 size={18} />
          Recipient Discovery: Explore Surplus Feeds & Submit Claims
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DONOR ENGINE (SURPLUS MATCHING & RANKED CANDIDATES) */}
      {/* ========================================================= */}
      {activeTab === 'DONOR_MATCHING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Surplus Selector Banner */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2.5px solid var(--sb-black)',
              borderRadius: '1.5em',
              padding: '1.5rem',
              boxShadow: '4px 4px 0px var(--sb-black)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>
                  Target Surplus Listing
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: '0.25rem 0 0 0' }}>
                  {currentSurplus ? currentSurplus.title : 'Select a Surplus Listing'}
                </h2>
              </div>

              {donorSurpluses.length > 0 && (
                <div style={{ minWidth: '280px' }}>
                  <select
                    className={styles.select}
                    value={selectedSurplusId}
                    onChange={(e) => setSelectedSurplusId(e.target.value)}
                  >
                    {donorSurpluses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.availableQuantity} {s.unit} avail) — {s.donorOrganization?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {currentSurplus && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--sb-pale-yellow)',
                  border: '1.5px solid var(--sb-black)',
                  borderRadius: '1em',
                  fontSize: '0.9rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                    Available / Total
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>
                    {currentSurplus.availableQuantity} / {currentSurplus.totalQuantity} {currentSurplus.unit}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                    Allocated
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#059669' }}>
                    {currentSurplus.allocatedQuantity || (currentSurplus.totalQuantity - currentSurplus.availableQuantity)}{' '}
                    {currentSurplus.unit}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                    Available Until
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                    {new Date(currentSurplus.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                    Pickup Window
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                    {currentSurplus.pickupWindow || 'Immediate'}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                    Location
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {currentSurplus.pickupAddress || 'Facility pickup'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches List Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: 0 }}>
              Top Ranked Match Candidates ({matches.length})
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
              Ranked deterministically by category, urgency, distance, and capacity
            </span>
          </div>

          {loadingMatches ? (
            <div className={styles.emptyState}>
              <RefreshCw size={36} className="animate-spin" />
              <p className={styles.emptyTitle}>Evaluating eligible recipients...</p>
              <p className={styles.emptyDesc}>
                Computing multi-factor compatibility scores, verifying storage conditions, and calculating transit distances.
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <GitMerge size={32} />
              </div>
              <h3 className={styles.emptyTitle}>No eligible recipient matches found</h3>
              <p className={styles.emptyDesc}>
                There are currently no active recipient requests matching this surplus category or location.
                Recipients will appear as soon as compatible claims are registered.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {matches.map((match, idx) => {
                const isAccepted = match.status === 'ACCEPTED';
                const isRejected = match.status === 'REJECTED';
                const req = match.foodRequest;
                const recipientOrg = match.recipientOrganization;

                let scoreColor = '#10b981'; // Green
                if (match.score < 70) scoreColor = '#f59e0b'; // Amber
                if (match.score < 50) scoreColor = '#ef4444'; // Red

                return (
                  <div
                    key={match.id}
                    style={{
                      background: 'var(--sb-white)',
                      border: '2.5px solid var(--sb-black)',
                      borderRadius: '1.5em',
                      padding: '1.5rem',
                      boxShadow: '4px 4px 0px var(--sb-black)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      opacity: isRejected ? 0.6 : 1,
                    }}
                  >
                    {/* Top Row: Rank, Recipient Name, Score, Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'var(--sb-cream)',
                            border: '2px solid var(--sb-black)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.2rem',
                          }}
                        >
                          #{idx + 1}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: 0 }}>
                              {recipientOrg?.name || 'Verified Recipient'}
                            </h4>
                            {recipientOrg?.type && (
                              <Badge variant="yellow">{recipientOrg.type.replace('_', ' ')}</Badge>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <span>
                              <strong>{req ? `${req.requestedQuantity} ${req.unit}` : 'Flexible'}</strong> requested
                            </span>
                            {req?.urgency && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                • Urgency:{' '}
                                <strong style={{ color: req.urgency === 'CRITICAL' ? '#dc2626' : req.urgency === 'HIGH' ? '#d97706' : '#2563eb' }}>
                                  {req.urgency}
                                </strong>
                              </span>
                            )}
                            {req?.beneficiaryCount && (
                              <span>• {req.beneficiaryCount} Beneficiaries</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            background: scoreColor,
                            color: '#fff',
                            border: '2px solid var(--sb-black)',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '9999px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.15rem',
                            boxShadow: '2px 2px 0px var(--sb-black)',
                          }}
                        >
                          {match.score}% Match
                        </div>

                        {isAccepted && (
                          <Badge variant="green">
                            <Check size={14} /> ACCEPTED
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="orange">
                            <X size={14} /> REJECTED
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Explainable Match Breakdown & Reasons */}
                    <div
                      style={{
                        background: '#fafaf6',
                        border: '1.5px solid var(--sb-black)',
                        borderRadius: '1em',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--sb-black)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Info size={16} />
                        Explainable Scoring Breakdown
                      </div>

                      {/* Reasons List */}
                      {match.matchingReasons && match.matchingReasons.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
                          {match.matchingReasons.map((reason: string, rIdx: number) => (
                            <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                              <span style={{ color: '#059669' }}>
                                <CheckCircle2 size={16} />
                              </span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Evaluation created: {new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {!isAccepted && !isRejected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Button
                            variant="secondary"
                            onClick={() => handleReject(match.id)}
                          >
                            <X size={14} />
                            Decline
                          </Button>

                          <Button
                            variant="primary"
                            onClick={() => handleOpenAcceptModal(match)}
                            disabled={currentSurplus?.availableQuantity <= 0}
                          >
                            <Check size={16} />
                            Accept Match & Allocate
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RECIPIENT DISCOVERY (SURPLUS FEEDS & SUBMIT CLAIMS) */}
      {/* ========================================================= */}
      {activeTab === 'RECIPIENT_DISCOVERY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters Bar */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2px solid var(--sb-black)',
              borderRadius: '1.25em',
              padding: '1rem 1.25rem',
              boxShadow: '3px 3px 0px var(--sb-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className={styles.select}
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Food Categories</option>
                <option value="PREPARED_MEALS">Prepared Meals</option>
                <option value="GRAINS_RICE">Grains & Rice</option>
                <option value="VEGETABLES">Vegetables</option>
                <option value="FRUITS">Fruits</option>
                <option value="BAKERY">Bakery</option>
                <option value="DAIRY">Dairy</option>
              </select>

              <input
                type="text"
                placeholder="Filter by City (e.g. Mumbai)..."
                className={styles.input}
                style={{ width: '220px', padding: '0.5rem 1rem' }}
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
            </div>

            <Button variant="secondary" onClick={loadDiscovery}>
              <Search size={14} /> Filter Feeds
            </Button>
          </div>

          {/* Discovery Cards Grid */}
          {loadingDiscovery ? (
            <div className={styles.emptyState}>
              <RefreshCw size={36} className="animate-spin" />
              <p className={styles.emptyTitle}>Scanning open surplus feeds...</p>
            </div>
          ) : discoveryListings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Building2 size={32} />
              </div>
              <h3 className={styles.emptyTitle}>No surplus feeds available</h3>
              <p className={styles.emptyDesc}>
                There are currently no active donor listings matching your filters. Check back shortly as donors post daily surpluses.
              </p>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {discoveryListings.map((listing) => (
                <div key={listing.id} className={styles.card}>
                  <div>
                    <div className={styles.cardHeader}>
                      <div>
                        <h4 className={styles.cardTitle}>{listing.title}</h4>
                        <div className={styles.cardSub}>
                          <Building2 size={14} />
                          {listing.donorOrganization?.name || 'Verified Kitchen'}
                        </div>
                      </div>
                      <Badge variant="green">{listing.foodItem?.category || 'FOOD'}</Badge>
                    </div>

                    <div className={styles.cardBody} style={{ marginTop: '1rem' }}>
                      <div className={styles.cardMetaRow}>
                        <span>Available Surplus</span>
                        <strong>
                          {listing.availableQuantity} {listing.unit}
                        </strong>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <span>Pickup Location</span>
                        <span style={{ textAlign: 'right' }}>{listing.pickupCity || listing.pickupAddress || 'Facility'}</span>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <span>Pickup Window</span>
                        <strong>{listing.pickupWindow || 'Standard'}</strong>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <span>Expires / Valid Until</span>
                        <strong>
                          {new Date(listing.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="primary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setSelectedClaimListing(listing);
                        setClaimQty(String(listing.availableQuantity));
                      }}
                    >
                      <HandHeart size={16} />
                      Request Recovery Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ACCEPT MATCH & ALLOCATION MODAL (PARTIAL ALLOCATION SUPPORT) */}
      {/* ========================================================= */}
      {acceptingMatch && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Accept Match & Allocate Surplus</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  {acceptingMatch.recipientOrganization?.name || 'Recipient'} • {acceptingMatch.score}% Compatibility Score
                </p>
              </div>
              <button
                onClick={() => setAcceptingMatch(null)}
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
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Total Surplus Posted:</span>
                  <strong>
                    {acceptingMatch.surplusListing?.totalQuantity} {acceptingMatch.surplusListing?.unit}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Currently Available:</span>
                  <strong>
                    {acceptingMatch.surplusListing?.availableQuantity} {acceptingMatch.surplusListing?.unit}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Recipient Requested:</span>
                  <strong>
                    {acceptingMatch.foodRequest?.requestedQuantity || acceptingMatch.surplusListing?.availableQuantity}{' '}
                    {acceptingMatch.surplusListing?.unit}
                  </strong>
                </div>
              </div>

              {/* Quantity Allocation Input */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Allocated Quantity ({acceptingMatch.surplusListing?.unit || 'kg'})
                </label>
                <input
                  type="number"
                  min="1"
                  max={acceptingMatch.surplusListing?.availableQuantity}
                  step="0.5"
                  className={styles.input}
                  value={acceptQty}
                  onChange={(e) => setAcceptQty(parseFloat(e.target.value) || 0)}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  Remaining surplus after allocation:{' '}
                  <strong>
                    {Math.max(0, (acceptingMatch.surplusListing?.availableQuantity || 0) - acceptQty)}{' '}
                    {acceptingMatch.surplusListing?.unit}
                  </strong>
                </span>
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
                  Acceptance generates a verified <strong>RecoveryTransaction</strong>, assigns a logistics pickup route, and locks inventory.
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setAcceptingMatch(null)} disabled={isSubmittingAccept}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAccept}
                disabled={isSubmittingAccept || acceptQty <= 0 || acceptQty > (acceptingMatch.surplusListing?.availableQuantity || 0)}
              >
                {isSubmittingAccept ? 'Processing Allocation...' : `Confirm & Allocate ${acceptQty} ${acceptingMatch.surplusListing?.unit || 'kg'}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECIPIENT CLAIM MODAL */}
      {/* ========================================================= */}
      {selectedClaimListing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Claim Surplus Food</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  {selectedClaimListing.title} from {selectedClaimListing.donorOrganization?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedClaimListing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Claim Quantity ({selectedClaimListing.unit}) - Max: {selectedClaimListing.availableQuantity}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedClaimListing.availableQuantity}
                  step="0.5"
                  className={styles.input}
                  value={claimQty}
                  onChange={(e) => setClaimQty(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Beneficiaries Count</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    value={beneficiaries}
                    onChange={(e) => setBeneficiaries(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Urgency Level</label>
                  <select
                    className={styles.select}
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Intended Distribution Use</label>
                <input
                  type="text"
                  className={styles.input}
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  placeholder="e.g. Community lunch service, night shelter relief"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Additional Notes</label>
                <textarea
                  className={styles.textarea}
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Any delivery or timing constraints..."
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="secondary" type="button" onClick={() => setSelectedClaimListing(null)} disabled={submittingClaim}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submittingClaim}>
                  {submittingClaim ? 'Submitting Claim...' : 'Submit Claim Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
