'use client';

// ==============================================
// SaveByte — Surplus Food Management (Donor Operations)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Radar,
  Plus,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import {
  listMySurplusAction,
  createSurplusListingAction,
  updateSurplusStatusAction,
} from '@/app/actions/surplusActions';
import { listBatchesAction } from '@/app/actions/foodActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function SurplusManagementPage() {
  const [surplusListings, setSurplusListings] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [recipientType, setRecipientType] = useState('ALL');
  const [availableUntil, setAvailableUntil] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupWindow, setPickupWindow] = useState('14:00 - 18:00');
  const [storageCondition, setStorageCondition] = useState('AMBIENT');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [surplusRes, batchesRes] = await Promise.all([
        listMySurplusAction(),
        listBatchesAction({ status: 'ACTIVE' }),
      ]);

      if (surplusRes.success) setSurplusListings(surplusRes.listings || []);
      if (batchesRes.success) {
        const activeBatches = (batchesRes.batches || []).filter(b => b.currentQuantity > 0);
        setBatches(activeBatches);
        if (activeBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(activeBatches[0].id);
          setUnit(activeBatches[0].unit);
          setTitle(`${(activeBatches[0] as any).foodItem?.name || 'Surplus Food'} Allocation`);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load surplus listings');
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const batch = batches.find(b => b.id === selectedBatchId);
      if (!batch) throw new Error('Please select a valid food batch');

      const fd = new FormData();
      fd.append('batchId', batch.id);
      fd.append('foodItemId', batch.foodItemId);
      fd.append('facilityId', batch.facilityId);
      fd.append('title', title);
      fd.append('quantity', quantity);
      fd.append('unit', unit);
      fd.append('eligibleRecipientType', recipientType);
      fd.append('availableUntil', availableUntil);
      fd.append('pickupAddress', pickupAddress || batch.facility?.address || 'Donor Kitchen Facility');
      fd.append('pickupWindow', pickupWindow);
      fd.append('storageCondition', storageCondition);
      fd.append('description', description);

      const res = await createSurplusListingAction(fd);
      if (res.success) {
        setShowPostModal(false);
        setQuantity('');
        setDescription('');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post surplus listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSurplus = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this surplus listing? Unreserved quantities will be returned to batch stock.')) {
      return;
    }
    try {
      await updateSurplusStatusAction(id, 'CANCELLED', 'Cancelled by donor');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel surplus');
    }
  };

  const totalAvailableSurplus = surplusListings
    .filter(l => l.status === 'PUBLISHED')
    .reduce((acc, l) => acc + (l.availableQuantity || 0), 0);

  const activePostingsCount = surplusListings.filter(l => l.status === 'PUBLISHED').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Radar size={32} /> Donor Surplus Postings
          </h1>
          <p className={styles.pageSubtitle}>
            Publish excess inventory for recovery, define pickup windows, and prevent food waste at the source.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => setShowPostModal(true)} disabled={batches.length === 0}>
            <Plus size={16} /> Post Surplus Food
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Available Surplus</span>
            <div className={styles.statIconBox}><Package size={20} /></div>
          </div>
          <div className={styles.statValue}>{totalAvailableSurplus.toLocaleString()} kg</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Published Listings</span>
            <div className={styles.statIconBox}><Radar size={20} /></div>
          </div>
          <div className={styles.statValue}>{activePostingsCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Listings</span>
            <div className={styles.statIconBox}><CheckCircle2 size={20} /></div>
          </div>
          <div className={styles.statValue}>{surplusListings.length}</div>
        </div>
      </div>

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

      {/* Listings Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Posted Surplus Inventory</h3>
          <Button variant="ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>

        {surplusListings.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Radar size={32} /></div>
            <h4 className={styles.emptyTitle}>No surplus food posted yet</h4>
            <p className={styles.emptyDesc}>
              When your kitchen has excess portions or inventory nearing shelf-life, post them here for immediate recovery.
            </p>
            {batches.length > 0 ? (
              <Button variant="primary" onClick={() => setShowPostModal(true)}>
                <Plus size={16} /> Post Surplus Now
              </Button>
            ) : (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>
                (Tip: First record an operational batch under Food Catalog & Batches)
              </p>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Listing Title</th>
                <th className={styles.th}>Food Item</th>
                <th className={styles.th}>Available / Total</th>
                <th className={styles.th}>Eligible Recipients</th>
                <th className={styles.th}>Pickup Window</th>
                <th className={styles.th}>Available Until</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surplusListings.map((l) => (
                <tr key={l.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{l.title}</strong>
                    {l.description && <div style={{ fontSize: '0.8rem', color: '#666' }}>{l.description}</div>}
                  </td>
                  <td className={styles.td}>
                    {l.foodItem?.name}
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{l.foodItem?.category}</div>
                  </td>
                  <td className={styles.td}>
                    <strong style={{ fontSize: '1.1rem', color: l.availableQuantity > 0 ? '#166534' : '#666' }}>
                      {l.availableQuantity}
                    </strong> / {l.totalQuantity} {l.unit}
                  </td>
                  <td className={styles.td}>
                    <Badge variant={l.eligibleRecipientType === 'NGO_ONLY' ? 'purple' : l.eligibleRecipientType === 'INDIVIDUAL_ONLY' ? 'yellow' : 'blue'}>
                      {l.eligibleRecipientType}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: '0.85rem' }}>{l.pickupWindow || 'Standard Hours'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#777' }}>{l.pickupAddress}</div>
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <Clock size={14} /> {new Date(l.availableUntil).toLocaleString()}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={l.status === 'PUBLISHED' ? 'green' : l.status === 'RESERVED' ? 'yellow' : l.status === 'RECOVERED' ? 'cyan' : 'pink'}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    {l.status === 'PUBLISHED' && (
                      <Button variant="ghost" onClick={() => handleCancelSurplus(l.id)}>
                        <Ban size={14} /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Post Surplus Food */}
      {showPostModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Post Surplus Food</h3>
              <button type="button" onClick={() => setShowPostModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handlePostSurplus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Production Batch</label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    const b = batches.find(item => item.id === e.target.value);
                    if (b) {
                      setUnit(b.unit);
                      setTitle(`${b.foodItem?.name || 'Surplus Food'} Recovery Batch`);
                      setPickupAddress(b.facility?.address || '');
                    }
                  }}
                  className={styles.select}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {b.foodItem?.name} ({b.currentQuantity} {b.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Listing Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Surplus Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 30"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit</label>
                  <input type="text" value={unit} readOnly className={styles.input} style={{ background: '#f5f5f5' }} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Eligible Recipients</label>
                  <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)} className={styles.select}>
                    <option value="ALL">All (NGOs & Individual Users)</option>
                    <option value="NGO_ONLY">NGOs & Relief Shelters Only</option>
                    <option value="INDIVIDUAL_ONLY">Individual Consumers Only</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Available Until</label>
                  <input
                    type="datetime-local"
                    required
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pickup Window</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14:00 - 17:30"
                    value={pickupWindow}
                    onChange={(e) => setPickupWindow(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Storage Condition</label>
                  <select value={storageCondition} onChange={(e) => setStorageCondition(e.target.value)} className={styles.select}>
                    <option value="AMBIENT">Ambient Room Temperature</option>
                    <option value="COLD_STORAGE">Cold Storage (2°C - 8°C)</option>
                    <option value="HEATED">Heated / Warm Container</option>
                    <option value="FROZEN">Frozen</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Pickup Address</label>
                <input
                  type="text"
                  placeholder="Facility pickup dock or entrance"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Notes & Packaging Info</label>
                <textarea
                  placeholder="e.g. Packed in stainless steel containers, bring return crates"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setShowPostModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Surplus'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
