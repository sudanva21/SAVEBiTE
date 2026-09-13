'use client';

// ==============================================
// SaveByte — AI Intelligence Command Center (Phase 5)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Flame,
  ArrowRight,
  Info,
  ChevronRight,
  Sliders,
  Sparkles,
  Layers,
  FileText,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getAIOverviewAction,
  getDemandForecastAction,
  getSurplusPredictionAction,
  getProductionRecommendationAction,
} from '@/app/actions/aiActions';
import { AIOverview, ProductionRecommendation, DemandForecast, SurplusPrediction } from '@/types';
import styles from '@/app/(dashboard)/operations.module.css';

const CATEGORIES = [
  { id: 'PREPARED_MEALS', label: 'Prepared Meals' },
  { id: 'GRAINS_RICE', label: 'Grains & Rice' },
  { id: 'BAKERY', label: 'Bakery & Bread' },
  { id: 'VEGETABLES', label: 'Vegetables & Produce' },
];

export default function AIIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AIOverview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive What-If Simulation State
  const [selectedCategory, setSelectedCategory] = useState('PREPARED_MEALS');
  const [simulatedProduction, setSimulatedProduction] = useState<number>(500);
  const [simulating, setSimulating] = useState(false);

  // Explainer Modal State
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<ProductionRecommendation | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAIOverviewAction();
      if (res.success && res.data) {
        setOverview(res.data);
        setCurrentRecommendation(res.data.topRecommendation);
        setSimulatedProduction(res.data.surplusPrediction.expectedProduction || 500);
      } else {
        setErrorMsg(res.error || 'Failed to load AI intelligence data');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to intelligence service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Category / Simulation Changes
  const handleSimulate = async (category: string, prodQty: number) => {
    if (!overview) return;
    setSimulating(true);
    try {
      const [forecastRes, surplusRes, recRes] = await Promise.all([
        getDemandForecastAction(category),
        getSurplusPredictionAction(category, prodQty),
        getProductionRecommendationAction(category, prodQty),
      ]);

      if (forecastRes.success && surplusRes.success && recRes.success) {
        setOverview({
          ...overview,
          demandForecast: forecastRes.data as DemandForecast,
          surplusPrediction: surplusRes.data as SurplusPrediction,
          topRecommendation: recRes.data as ProductionRecommendation,
        });
        setCurrentRecommendation(recRes.data as ProductionRecommendation);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation adjustment failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <BrainCircuit size={32} color="var(--sb-black)" />
            AI Intelligence: Audit + Prediction
          </h1>
          <p className={styles.pageSubtitle}>
            Real-time demand forecasting, surplus risk prediction, operational expiry urgency, and explainable kitchen recommendations grounded in SaveByte operational data.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/dashboard/ai-audit">
            <Button variant="secondary" icon={<FileText size={16} />}>
              View Audit Report
            </Button>
          </Link>
          <Button
            variant="default"
            onClick={loadData}
            disabled={loading}
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          >
            {loading ? 'Refreshing...' : 'Refresh AI'}
          </Button>
        </div>
      </div>

      {/* Provider Status Banner */}
      {overview && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: overview.providerStatus.isFallback ? '#FFFDF5' : '#F4FAF6',
            border: '2px solid var(--sb-black)',
            boxShadow: 'var(--shadow-tactile-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={20} color={overview.providerStatus.isFallback ? '#B7791F' : '#2D6A4F'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--sb-black)' }}>
                {overview.providerStatus.isFallback
                  ? 'Deterministic Analytical Baseline Active'
                  : `AI Enhanced — ${overview.providerStatus.providerName.toUpperCase()} (${overview.providerStatus.modelName})`}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#4A5568' }}>
                {overview.providerStatus.notice}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant={overview.providerStatus.isFallback ? 'yellow' : 'green'}>
              {overview.providerStatus.isFallback ? 'Analytical Mode' : 'AI Active'}
            </Badge>
            <Badge variant="cyan">Zero PII Transferred</Badge>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: '#FFF5F5',
            border: '2px solid #E53E3E',
            color: '#C53030',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Major KPI Cards */}
      {overview && (
        <div className={styles.statsGrid}>
          {/* 1. Demand Forecast */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>DEMAND FORECAST</span>
              <Badge variant="cyan">{overview.demandForecast.confidence}% Conf.</Badge>
            </div>
            <div className={styles.statValue}>
              {overview.demandForecast.predictedQuantity} {overview.demandForecast.unit}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <TrendingUp size={16} color="#2B6CB0" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2B6CB0' }}>
                {overview.demandForecast.trend}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.5rem' }}>
              {overview.demandForecast.dataLabel} ({overview.demandForecast.historicalDataPoints} operating days)
            </div>
          </div>

          {/* 2. Surplus Risk */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>SURPLUS RISK</span>
              <Badge
                variant={
                  overview.surplusPrediction.riskLevel === 'CRITICAL'
                    ? 'pink'
                    : overview.surplusPrediction.riskLevel === 'HIGH'
                    ? 'orange'
                    : overview.surplusPrediction.riskLevel === 'MEDIUM'
                    ? 'yellow'
                    : 'green'
                }
              >
                {overview.surplusPrediction.riskLevel} RISK
              </Badge>
            </div>
            <div className={styles.statValue}>
              {overview.surplusPrediction.predictedSurplus} {overview.surplusPrediction.unit}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#4A5568', marginTop: '0.5rem' }}>
              {overview.surplusPrediction.surplusPercentage}% over predicted demand
            </div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.5rem' }}>
              Planned: {overview.surplusPrediction.expectedProduction} {overview.surplusPrediction.unit}
            </div>
          </div>

          {/* 3. Expiry Urgency */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>EXPIRY URGENCY</span>
              <Badge variant={overview.urgentFoodCount > 0 ? 'pink' : 'green'}>
                {overview.urgentFoodCount} Urgent Batches
              </Badge>
            </div>
            <div className={styles.statValue}>
              {overview.criticalFoodKg} kg
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Clock size={16} color="#DD6B20" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#C05621' }}>
                Operational urgency &lt; 4h
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.5rem' }}>
              Operational tracking only (no food safety cert.)
            </div>
          </div>

          {/* 4. Recovery Opportunity */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>RECOVERY RATE</span>
              <Badge variant="green">{overview.quickWasteMetrics.recoveryRate}%</Badge>
            </div>
            <div className={styles.statValue}>
              {overview.recoveryPriorityList.length} Items
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#4A5568', marginTop: '0.5rem' }}>
              Top waste: {overview.quickWasteMetrics.topCategory.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.5rem' }}>
              {overview.quickWasteMetrics.wasteRate}% current recorded waste rate
            </div>
          </div>
        </div>
      )}

      {/* Production Recommendation Highlight Card */}
      {overview && (
        <div
          style={{
            background: 'var(--sb-white)',
            border: '2px solid var(--sb-black)',
            boxShadow: 'var(--shadow-tactile-md)',
            padding: '1.75rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'var(--sb-pale-yellow)',
                  border: '2px solid var(--sb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                }}
              >
                AI
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096' }}>
                  ACTIONABLE SHIFT RECOMMENDATION
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--sb-black)' }}>
                  {overview.topRecommendation.what}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Badge variant={overview.topRecommendation.confidenceTier === 'HIGH' ? 'green' : 'yellow'}>
                {overview.topRecommendation.howConfident}% Confidence
              </Badge>
              <Button
                variant="primary"
                onClick={() => setExplainerOpen(true)}
                icon={<HelpCircle size={16} />}
              >
                Why did AI recommend this?
              </Button>
            </div>
          </div>

          <div
            style={{
              margin: '1.25rem 0',
              padding: '1rem',
              background: '#F7FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              color: '#2D3748',
            }}
          >
            <strong>Core Rationale:</strong> {overview.topRecommendation.why}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: '#718096' }}>
            <span>
              <strong>Directive:</strong> {overview.topRecommendation.action}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={14} color="#2D6A4F" /> Human authorization required — kitchen supervisor makes final call.
            </span>
          </div>
        </div>
      )}

      {/* Category Simulation & What-If Sandbox */}
      {overview && (
        <div
          style={{
            background: 'var(--sb-white)',
            border: '2px solid var(--sb-black)',
            boxShadow: 'var(--shadow-tactile-sm)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} color="var(--sb-black)" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900 }}>
                Interactive Production Calibration Sandbox
              </h3>
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#718096' }}>
              Simulate kitchen production changes and evaluate predicted surplus impact
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Category Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                FOOD CATEGORY
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleSimulate(e.target.value, simulatedProduction);
                }}
                disabled={simulating}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '2px solid var(--sb-black)',
                  fontWeight: 600,
                  background: 'var(--sb-white)',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Planned Production Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                PLANNED PRODUCTION ({overview.demandForecast.unit})
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  value={simulatedProduction}
                  onChange={(e) => setSimulatedProduction(Number(e.target.value))}
                  disabled={simulating}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    border: '2px solid var(--sb-black)',
                    fontWeight: 700,
                  }}
                />
                <Button
                  variant="primary"
                  onClick={() => handleSimulate(selectedCategory, simulatedProduction)}
                  disabled={simulating}
                >
                  {simulating ? 'Calculating...' : 'Recalibrate'}
                </Button>
              </div>
            </div>

            {/* Simulated Delta Comparison */}
            <div
              style={{
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                padding: '0.75rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096' }}>
                SIMULATED SURPLUS DELTA
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 900, color: overview.surplusPrediction.predictedSurplus > 0 ? '#C53030' : '#2D6A4F' }}>
                {overview.surplusPrediction.predictedSurplus > 0
                  ? `+${overview.surplusPrediction.predictedSurplus} ${overview.surplusPrediction.unit} Expected Surplus`
                  : 'Zero Surplus Expected (High Efficiency)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Priority Queue */}
      {overview && (
        <div
          style={{
            background: 'var(--sb-white)',
            border: '2px solid var(--sb-black)',
            boxShadow: 'var(--shadow-tactile-sm)',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={20} color="#E53E3E" />
                Urgent Food Recovery Priority Queue
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#718096' }}>
                Autonomous explainable ranking of active food inventory requiring immediate operational attention.
              </p>
            </div>
            <Link href="/dashboard/matching">
              <Button variant="secondary" icon={<ArrowRight size={14} />}>
                Open Matching Engine
              </Button>
            </Link>
          </div>

          {/* Legal / Operational Urgency Disclaimer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#FFFDF5',
              border: '1px dashed #D69E2E',
              fontSize: '0.8125rem',
              color: '#744210',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Info size={16} color="#D69E2E" />
            <span>
              <strong>Operational Disclaimer:</strong> Urgency calculations are based on logged preparation timestamps and configured shelf-life windows. This ranking guides redistribution logistics and does not constitute microbiological food safety certification.
            </span>
          </div>

          {overview.recoveryPriorityList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
              <CheckCircle2 size={32} color="#2D6A4F" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700 }}>No urgent surplus requiring escalation.</div>
              <div style={{ fontSize: '0.8125rem' }}>All active inventory is within safe operational freshness thresholds.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {overview.recoveryPriorityList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    border: '2px solid var(--sb-black)',
                    background: item.urgency === 'CRITICAL' ? '#FFF5F5' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        background: item.priorityRank === 1 ? '#E53E3E' : item.priorityRank === 2 ? '#DD6B20' : '#4A5568',
                        color: 'white',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9375rem',
                      }}
                    >
                      #{item.priorityRank}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sb-black)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#4A5568' }}>
                        Category: {item.category.replace(/_/g, ' ')} • Priority Score: {item.priorityScore}/100
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge
                      variant={
                        item.urgency === 'CRITICAL'
                          ? 'pink'
                          : item.urgency === 'URGENT'
                          ? 'orange'
                          : 'yellow'
                      }
                    >
                      {item.urgency} ({item.hoursRemaining > 0 ? `${item.hoursRemaining}h left` : 'Window closing'})
                    </Badge>

                    <div style={{ fontSize: '0.8125rem', color: '#718096', maxWidth: '280px' }}>
                      {item.reasons.join(' • ')}
                    </div>

                    <Link href="/dashboard/matching">
                      <Button variant="default">
                        Match Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explainability Modal / Drawer */}
      {explainerOpen && currentRecommendation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--sb-white)',
              border: '3px solid var(--sb-black)',
              boxShadow: 'var(--shadow-tactile-lg)',
              maxWidth: '640px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setExplainerOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BrainCircuit size={24} color="#2D6A4F" />
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                Explainable AI Recommendation
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              {/* 1. WHAT */}
              <div style={{ padding: '0.875rem', background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase' }}>
                  1. WHAT IS THE RECOMMENDATION?
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--sb-black)', marginTop: '0.25rem' }}>
                  {currentRecommendation.what}
                </div>
              </div>

              {/* 2. WHY */}
              <div style={{ padding: '0.875rem', background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase' }}>
                  2. WHY DID THE AI CONCLUDE THIS?
                </div>
                <div style={{ fontSize: '0.9375rem', color: '#2D3748', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  {currentRecommendation.why}
                </div>
              </div>

              {/* 3. BASED ON WHAT */}
              <div style={{ padding: '0.875rem', background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase' }}>
                  3. BASED ON WHAT DATA?
                </div>
                <div style={{ fontSize: '0.9375rem', color: '#2D3748', marginTop: '0.25rem' }}>
                  {currentRecommendation.basedOnWhat}
                </div>
              </div>

              {/* 4. HOW CONFIDENT */}
              <div style={{ padding: '0.875rem', background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase' }}>
                  4. HOW CONFIDENT IS THE SYSTEM?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <Badge variant={currentRecommendation.confidenceTier === 'HIGH' ? 'green' : 'yellow'}>
                    {currentRecommendation.howConfident}% Confidence ({currentRecommendation.confidenceTier})
                  </Badge>
                  <span style={{ fontSize: '0.8125rem', color: '#718096' }}>
                    Calculated from statistical variance across recorded operating shifts.
                  </span>
                </div>
              </div>

              {/* 5. ACTION */}
              <div style={{ padding: '0.875rem', background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase' }}>
                  5. WHAT SHOULD KITCHEN STAFF DO?
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#2D6A4F', marginTop: '0.25rem' }}>
                  {currentRecommendation.action}
                </div>
              </div>

              {/* 6. LIMITATIONS */}
              <div style={{ padding: '0.875rem', background: '#FFFDF5', border: '1px dashed #D69E2E' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#744210', textTransform: 'uppercase' }}>
                  6. KNOWN BOUNDARIES & LIMITATIONS
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#744210', marginTop: '0.25rem' }}>
                  {currentRecommendation.limitations}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
              <Button variant="primary" onClick={() => setExplainerOpen(false)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
