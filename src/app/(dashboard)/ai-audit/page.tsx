'use client';

// ==============================================
// SaveByte — AI Operational Audit Report (Phase 5)
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Leaf,
  DollarSign,
  Printer,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { generateAIAuditReportAction } from '@/app/actions/aiActions';
import { AIAuditReport } from '@/types';
import styles from '@/app/(dashboard)/operations.module.css';

export default function AIAuditReportPage() {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [report, setReport] = useState<AIAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAudit = useCallback(async (days: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await generateAIAuditReportAction(days);
      if (res.success && res.data) {
        setReport(res.data as AIAuditReport);
      } else {
        setErrorMsg(res.error || 'Failed to generate operational audit');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with audit engine');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit(periodDays);
  }, [loadAudit, periodDays]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Link href="/dashboard/ai" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: '#4A5568', textDecoration: 'none' }}>
              <ChevronLeft size={16} /> Back to AI Command Center
            </Link>
          </div>
          <h1 className={styles.pageTitle}>
            <FileText size={32} color="var(--sb-black)" />
            AI Operational Audit Report
          </h1>
          <p className={styles.pageSubtitle}>
            Comprehensive operational evaluation of food production, surplus generation, recovery fulfillment, and verified waste root causes.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Period Selector Tabs */}
          <div style={{ display: 'flex', border: '2px solid var(--sb-black)', background: 'var(--sb-white)' }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriodDays(d)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: periodDays === d ? 'var(--sb-black)' : 'transparent',
                  color: periodDays === d ? 'var(--sb-white)' : 'var(--sb-black)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Last {d} Days
              </button>
            ))}
          </div>

          <Button variant="default" onClick={handlePrint} icon={<Printer size={16} />}>
            Print / Export
          </Button>

          <Button
            variant="default"
            onClick={() => loadAudit(periodDays)}
            disabled={loading}
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          >
            {loading ? 'Analyzing...' : 'Re-Run Audit'}
          </Button>
        </div>
      </div>

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
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Audit Meta Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: '#F7FAFC',
              border: '2px solid var(--sb-black)',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sb-black)' }}>
                AUDIT ENTITY: {report.organizationName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#718096' }}>
                Period: {report.periodLabel} • Generated: {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant={report.confidence >= 75 ? 'green' : 'yellow'}>
                Confidence: {report.confidence}%
              </Badge>
              <Badge variant="default">{report.dataReliability}</Badge>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2px solid var(--sb-black)',
              boxShadow: 'var(--shadow-tactile-sm)',
              padding: '1.75rem',
            }}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Executive Summary
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#2D3748', margin: '0 0 1.5rem' }}>
              {report.executiveSummary.summaryNarrative}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#F7FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096' }}>FOOD PROCESSED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--sb-black)', marginTop: '0.25rem' }}>
                  {report.executiveSummary.totalFoodProcessed} {report.executiveSummary.unit}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#F4FAF6', border: '1px solid #C6F6D5', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22543D' }}>FOOD RECOVERED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22543D', marginTop: '0.25rem' }}>
                  {report.executiveSummary.totalFoodRecovered} {report.executiveSummary.unit}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#FFF5F5', border: '1px solid #FED7D7', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#742A2A' }}>RECORDED WASTE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9B2C2C', marginTop: '0.25rem' }}>
                  {report.executiveSummary.totalRecordedWaste} {report.executiveSummary.unit}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#F7FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096' }}>RECOVERY RATE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2B6CB0', marginTop: '0.25rem' }}>
                  {report.executiveSummary.recoveryRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Demand vs Production & Inventory Risk */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Demand vs Production */}
            <div
              style={{
                background: 'var(--sb-white)',
                border: '2px solid var(--sb-black)',
                boxShadow: 'var(--shadow-tactile-sm)',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} />
                2. Demand vs. Production Calibration
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Average Daily Production:</span>
                  <span style={{ fontWeight: 800 }}>{report.demandVsProduction.averageDailyProduction} {report.executiveSummary.unit}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Average Daily Demand:</span>
                  <span style={{ fontWeight: 800 }}>{report.demandVsProduction.averageDailyDemand} {report.executiveSummary.unit}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Overproduction Shifts:</span>
                  <span style={{ fontWeight: 800, color: report.demandVsProduction.overproductionDaysCount > 0 ? '#C53030' : '#2D6A4F' }}>
                    {report.demandVsProduction.overproductionDaysCount} shifts ({report.demandVsProduction.comparableDaysAnalyzed} analyzed)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#718096' }}>Window Adherence Rate:</span>
                  <span style={{ fontWeight: 800, color: '#2D6A4F' }}>{report.expiryRisk.windowAdherenceRate}%</span>
                </div>
              </div>
            </div>

            {/* Inventory & Expiry Risk */}
            <div
              style={{
                background: 'var(--sb-white)',
                border: '2px solid var(--sb-black)',
                boxShadow: 'var(--shadow-tactile-sm)',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#DD6B20" />
                3. Inventory & Expiry Risk Profile
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Batches In Watch/Urgent Tiers:</span>
                  <span style={{ fontWeight: 800 }}>{report.inventoryRisk.batchesAtRisk} batches</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Active Volume At Urgency:</span>
                  <span style={{ fontWeight: 800, color: '#C05621' }}>{report.inventoryRisk.quantityAtRisk} kg</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EDF2F7' }}>
                  <span style={{ color: '#718096' }}>Critical Expiring Batches (&lt; 2h):</span>
                  <span style={{ fontWeight: 800, color: report.inventoryRisk.criticalExpiringBatches > 0 ? '#E53E3E' : '#2D6A4F' }}>
                    {report.inventoryRisk.criticalExpiringBatches}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#718096' }}>Avg. Hours To Recovery Handover:</span>
                  <span style={{ fontWeight: 800 }}>{report.recoveryPerformance.avgHoursToRecovery} hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Top Waste Categories */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2px solid var(--sb-black)',
              boxShadow: 'var(--shadow-tactile-sm)',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 900 }}>
              4. Top Food Waste Categories
            </h3>

            {report.topWasteCategories.length === 0 ? (
              <div style={{ color: '#718096', fontSize: '0.9375rem' }}>
                Zero food waste categories recorded in this audit period.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {report.topWasteCategories.map((c) => (
                  <div
                    key={c.category}
                    style={{
                      padding: '1rem',
                      border: '2px solid var(--sb-black)',
                      background: '#FAFAFA',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{c.category.replace(/_/g, ' ')}</span>
                      <Badge variant="orange">{c.percentageOfTotalWaste}% of waste</Badge>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.5rem 0', color: '#C53030' }}>
                      {c.quantityWasted} {c.unit}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: '#4A5568', lineHeight: 1.4 }}>
                      <strong>Primary Cause:</strong> {c.primaryCause}
                    </div>

                    {c.estimatedFinancialLoss && (
                      <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem', borderTop: '1px dashed #CBD5E0', paddingTop: '0.5rem' }}>
                        Est. Food Loss: ₹{c.estimatedFinancialLoss.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Grounded AI Findings & Operational Bottlenecks */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2px solid var(--sb-black)',
              boxShadow: 'var(--shadow-tactile-sm)',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#2D6A4F" />
              5. AI Grounded Diagnostics & Operational Bottlenecks
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {report.aiFindings.map((finding, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#F7FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.9375rem',
                  }}
                >
                  <span style={{ fontWeight: 800, color: 'var(--sb-black)' }}>{idx + 1}.</span>
                  <span style={{ color: '#2D3748' }}>{finding}</span>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800 }}>
              Operational Bottlenecks Detected:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4A5568', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              {report.operationalBottlenecks.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          {/* Section 6: AI Recommendations & Potential Impact */}
          <div
            style={{
              background: 'var(--sb-white)',
              border: '2px solid var(--sb-black)',
              boxShadow: 'var(--shadow-tactile-md)',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 900, color: '#2D6A4F' }}>
              6. Strategic Recommendations & Projected Impact
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {report.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: '#F4FAF6',
                    border: '1px solid #C6F6D5',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#22543D',
                  }}
                >
                  <CheckCircle2 size={18} color="#2D6A4F" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            {/* Impact Projection Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1.25rem',
                background: 'var(--sb-black)',
                color: 'var(--sb-white)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#CBD5E0' }}>
                  POTENTIAL FOOD SAVED
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem' }}>
                  ~{report.potentialImpact.potentialFoodSavedKg} kg
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#CBD5E0' }}>
                  CO₂e EMISSIONS AVOIDED
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem' }}>
                  ~{report.potentialImpact.co2eAvoidedKg} kg CO₂e
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#CBD5E0' }}>
                  RECOVERY RATE LIFT
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem', color: '#68D391' }}>
                  +{report.potentialImpact.recoveryRateImprovementPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
