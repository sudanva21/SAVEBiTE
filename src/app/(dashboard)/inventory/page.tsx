'use client';

// ==============================================
// SaveByte — Food Catalog & Operational Inventory (Phase 3)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UtensilsCrossed,
  Package,
  Plus,
  Layers,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  listFoodItemsAction,
  listBatchesAction,
  createFoodItemAction,
  createFoodBatchAction,
  adjustInventoryAction,
} from '@/app/actions/foodActions';
import styles from '@/app/(dashboard)/operations.module.css';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'batches'>('batches');
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Food Item Form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('PREPARED_MEALS');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemDesc, setItemDesc] = useState('');
  const [itemStorage, setItemStorage] = useState('AMBIENT');
  const [itemDiet, setItemDiet] = useState('VEG');

  // New Batch Form
  const [batchFoodItemId, setBatchFoodItemId] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [batchUnit, setBatchUnit] = useState('kg');
  const [batchStorage, setBatchStorage] = useState('ROOM_TEMP');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchNotes, setBatchNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, batchesRes] = await Promise.all([
        listFoodItemsAction(),
        listBatchesAction(),
      ]);

      if (itemsRes.success) setFoodItems(itemsRes.items || []);
      if (batchesRes.success) setBatches(batchesRes.batches || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', itemName);
      fd.append('category', itemCategory);
      fd.append('unit', itemUnit);
      fd.append('description', itemDesc);
      fd.append('storageRequirement', itemStorage);
      fd.append('dietaryFlags', itemDiet);

      const res = await createFoodItemAction(fd);
      if (res.success) {
        setShowItemModal(false);
        setItemName('');
        setItemDesc('');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create food item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('foodItemId', batchFoodItemId);
      fd.append('initialQuantity', batchQty);
      fd.append('unit', batchUnit);
      fd.append('storageCondition', batchStorage);
      fd.append('expiresAt', batchExpiry);
      fd.append('notes', batchNotes);

      const res = await createFoodBatchAction(fd);
      if (res.success) {
        setShowBatchModal(false);
        setBatchQty('');
        setBatchExpiry('');
        setBatchNotes('');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create production batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('batchId', adjustBatch.id);
      fd.append('quantityDelta', adjustQty);
      fd.append('reason', adjustReason);

      const res = await adjustInventoryAction(fd);
      if (res.success) {
        setAdjustBatch(null);
        setAdjustQty('');
        setAdjustReason('');
        await loadData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStockKg = batches.reduce((acc, b) => acc + (b.currentQuantity || 0), 0);
  const activeBatchesCount = batches.filter(b => b.status === 'ACTIVE').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <UtensilsCrossed size={32} /> Food Catalog & Inventory
          </h1>
          <p className={styles.pageSubtitle}>
            Traceable production batches, standard recipes, and operational ledger with non-negative constraints.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setShowItemModal(true)}>
            <Plus size={16} /> New Catalog Item
          </Button>
          <Button variant="primary" onClick={() => {
            if (foodItems.length > 0 && !batchFoodItemId) {
              setBatchFoodItemId(foodItems[0].id);
              setBatchUnit(foodItems[0].unit);
            }
            setShowBatchModal(true);
          }}>
            <Package size={16} /> Record Batch
          </Button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Stock</span>
            <div className={styles.statIconBox}><Package size={20} /></div>
          </div>
          <div className={styles.statValue}>{totalStockKg.toLocaleString()} kg</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Batches</span>
            <div className={styles.statIconBox}><Layers size={20} /></div>
          </div>
          <div className={styles.statValue}>{activeBatchesCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Catalog Items</span>
            <div className={styles.statIconBox}><UtensilsCrossed size={20} /></div>
          </div>
          <div className={styles.statValue}>{foodItems.length}</div>
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

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'batches' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          <Layers size={18} /> Production Batches ({batches.length})
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'catalog' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <UtensilsCrossed size={18} /> Catalog Recipes ({foodItems.length})
        </button>
      </div>

      {/* Tab 1: Production Batches */}
      {activeTab === 'batches' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Operational Batches</h3>
            <Button variant="ghost" onClick={loadData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>

          {batches.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Package size={32} /></div>
              <h4 className={styles.emptyTitle}>No batches recorded yet</h4>
              <p className={styles.emptyDesc}>
                Log your kitchen or facility preparation batch to begin tracking stock and publishing surplus.
              </p>
              <Button variant="primary" onClick={() => setShowBatchModal(true)}>
                <Plus size={16} /> Record First Batch
              </Button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Batch Number</th>
                  <th className={styles.th}>Food Item</th>
                  <th className={styles.th}>Available / Initial</th>
                  <th className={styles.th}>Storage</th>
                  <th className={styles.th}>Expires At</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const isExpired = new Date(b.expiresAt).getTime() <= Date.now();
                  return (
                    <tr key={b.id} className={styles.tr}>
                      <td className={styles.td}>
                        <strong>{b.batchNumber}</strong>
                        {b.notes && <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.notes}</div>}
                      </td>
                      <td className={styles.td}>
                        {b.foodItem?.name || 'Item'}
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.foodItem?.category}</div>
                      </td>
                      <td className={styles.td}>
                        <strong style={{ fontSize: '1.1rem', color: b.currentQuantity > 0 ? '#166534' : '#991b1b' }}>
                          {b.currentQuantity}
                        </strong> / {b.initialQuantity} {b.unit}
                      </td>
                      <td className={styles.td}>
                        <Badge variant="blue">{b.storageCondition}</Badge>
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isExpired ? '#ef4444' : '#333' }}>
                          <Clock size={14} />
                          {new Date(b.expiresAt).toLocaleString()}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Badge variant={b.status === 'ACTIVE' ? 'green' : b.status === 'SURPLUS_POSTED' ? 'cyan' : 'yellow'}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setAdjustBatch(b);
                            setAdjustQty('');
                            setAdjustReason('');
                          }}
                        >
                          <SlidersHorizontal size={14} /> Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Catalog Items */}
      {activeTab === 'catalog' && (
        <div className={styles.cardsGrid}>
          {foodItems.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{item.name}</h3>
                  <div className={styles.cardSub}>
                    <Badge variant="purple">{item.category}</Badge>
                    {item.dietaryFlags && <Badge variant="green">{item.dietaryFlags}</Badge>}
                  </div>
                </div>
                <Badge variant={item.isActive ? 'green' : 'yellow'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className={styles.cardBody}>
                {item.description && <p style={{ margin: 0 }}>{item.description}</p>}
                <div className={styles.cardMetaRow}>
                  <span>Measurement Unit</span>
                  <strong>{item.unit}</strong>
                </div>
                <div className={styles.cardMetaRow}>
                  <span>Storage Requirement</span>
                  <strong>{item.storageRequirement || 'Ambient'}</strong>
                </div>
              </div>
            </div>
          ))}

          <div
            className={styles.card}
            style={{
              borderStyle: 'dashed',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
            }}
            onClick={() => setShowItemModal(true)}
          >
            <div style={{ textAlign: 'center' }}>
              <Plus size={32} style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <strong>Add New Catalog Item</strong>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Food Item */}
      {showItemModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>New Catalog Food Item</h3>
              <button type="button" onClick={() => setShowItemModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateFoodItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Basmati Rice & Dal"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className={styles.select}>
                    <option value="PREPARED_MEALS">Prepared Meals</option>
                    <option value="GRAINS_RICE">Grains & Rice</option>
                    <option value="VEGETABLES">Vegetables</option>
                    <option value="FRUITS">Fruits</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="DAIRY">Dairy</option>
                    <option value="PACKAGED_FOOD">Packaged Food</option>
                    <option value="BEVERAGES">Beverages</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, portions, meals, packets"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Storage</label>
                  <select value={itemStorage} onChange={(e) => setItemStorage(e.target.value)} className={styles.select}>
                    <option value="AMBIENT">Ambient / Room Temp</option>
                    <option value="REFRIGERATED">Refrigerated (2°C - 8°C)</option>
                    <option value="FROZEN">Frozen (-18°C)</option>
                    <option value="WARM">Heated / Warm (60°C+)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Dietary Flags</label>
                  <input
                    type="text"
                    placeholder="VEG, VEGAN, HALAL, JAIN"
                    value={itemDiet}
                    onChange={(e) => setItemDiet(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  placeholder="Ingredients, allergen notices, or preparation details"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setShowItemModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Create Food Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Production Batch */}
      {showBatchModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Production Batch</h3>
              <button type="button" onClick={() => setShowBatchModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Food Item</label>
                <select
                  required
                  value={batchFoodItemId}
                  onChange={(e) => {
                    setBatchFoodItemId(e.target.value);
                    const sel = foodItems.find(i => i.id === e.target.value);
                    if (sel) setBatchUnit(sel.unit);
                  }}
                  className={styles.select}
                >
                  <option value="">-- Choose Food Item --</option>
                  {foodItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 100"
                    value={batchQty}
                    onChange={(e) => setBatchQty(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit</label>
                  <input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Storage Condition</label>
                  <select value={batchStorage} onChange={(e) => setBatchStorage(e.target.value)} className={styles.select}>
                    <option value="ROOM_TEMP">Room Temperature</option>
                    <option value="COLD_STORAGE">Cold Storage</option>
                    <option value="FROZEN">Frozen</option>
                    <option value="HEATED">Heated</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Expires At</label>
                  <input
                    type="datetime-local"
                    required
                    value={batchExpiry}
                    onChange={(e) => setBatchExpiry(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Batch Notes</label>
                <textarea
                  placeholder="Notes about prep time, shift, or packaging"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setShowBatchModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Record Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Inventory */}
      {adjustBatch && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Adjust Stock: {adjustBatch.batchNumber}</h3>
              <button type="button" onClick={() => setAdjustBatch(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAdjustInventory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555' }}>
                Current Stock: <strong>{adjustBatch.currentQuantity} {adjustBatch.unit}</strong>
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Quantity Change (+ to add, - to reduce)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. -10 or 25"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Internal cafeteria consumption, spoilage, or recount"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setAdjustBatch(null)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save Stock Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
