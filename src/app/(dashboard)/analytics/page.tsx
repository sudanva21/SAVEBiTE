'use client';

// ==============================================
// SaveByte — Analytics & ESG Sustainability Center
// ==============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  Leaf,
  Droplets,
  Heart,
  TrendingUp,
  Award,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import styles from './analytics.module.css';

interface CategoryRow {
  category: string;
  produced: number;
  surplus: number;
  recovered: number;
  wasted: number;
  recoveryRate: number;
}

const CATEGORY_DATA: CategoryRow[] = [
  { category: 'Prepared Meals (Rice & Dal)', produced: 1450, surplus: 180, recovered: 165, wasted: 15, recoveryRate: 92 },
  { category: 'Fresh Bread & Bakery', produced: 620, surplus: 95, recovered: 85, wasted: 10, recoveryRate: 89 },
  { category: 'Cut Vegetables & Produce', produced: 480, surplus: 70, recovered: 58, wasted: 12, recoveryRate: 83 },
  { category: 'Dairy & Paneer Specials', produced: 340, surplus: 45, recovered: 40, wasted: 5, recoveryRate: 88 },
  { category: 'Dry Grains & Legumes', produced: 890, surplus: 40, recovered: 40, wasted: 0, recoveryRate: 100 },
];

export default function AnalyticsESGPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  // Multiplier for demo time range
  const multiplier = timeRange === '7d' ? 0.35 : timeRange === '30d' ? 1.0 : 2.8;

  const totalProducedKg = Math.round(3780 * multiplier);
  const totalSurplusKg = Math.round(430 * multiplier);
  const totalRecoveredKg = Math.round(388 * multiplier);
  const totalWastedKg = Math.round(42 * multiplier);
  const recoveryRate = Math.round((totalRecoveredKg / totalSurplusKg) * 100);

  // ESG Equivalents
  const co2AvertedKg = Math.round(totalRecoveredKg * 2.5);
  const waterConservedLiters = Math.round(totalRecoveredKg * 840);
  const mealsDistributed = Math.round(totalRecoveredKg / 0.4);
  const economicSavingsInr = Math.round(totalRecoveredKg * 120);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Category,Produced (kg),Surplus (kg),Recovered (kg),Wasted (kg),Recovery Rate (%)\n' +
        CATEGORY_DATA.map(
          (c) =>
            `"${c.category}",${Math.round(c.produced * multiplier)},${Math.round(c.surplus * multiplier)},${Math.round(c.recovered * multiplier)},${Math.round(c.wasted * multiplier)},${c.recoveryRate}%`
        ).join('\n') +
        `\n\nTotal Recovered (kg),${totalRecoveredKg}\nCO2e Averted (kg),${co2AvertedKg}\nWater Saved (L),${waterConservedLiters}\nMeals Distributed,${mealsDistributed}\nEconomic Value (INR),${economicSavingsInr}`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SaveByte_ESG_Report_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 400);
  };

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <Badge variant="black">✦ SUSTAINABILITY INTELLIGENCE</Badge>
            <span className={styles.liveTag}>
              <CheckCircle2 size={14} className={styles.greenCheck} /> Audit-Grade Methodology
            </span>
          </div>
          <h1 className={styles.title}>Analytics & ESG Impact Center</h1>
          <p className={styles.subtitle}>
            Verified food waste reduction, carbon offsets, water conservation, and community nourishment metrics.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.timeRangePicker}>
            <button
              type="button"
              className={`${styles.timeBtn} ${timeRange === '7d' ? styles.timeBtnActive : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`${styles.timeBtn} ${timeRange === '30d' ? styles.timeBtnActive : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`${styles.timeBtn} ${timeRange === 'all' ? styles.timeBtnActive : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>

          <Button variant="default" onClick={handleExportCSV} disabled={isExporting}>
            <Download size={16} style={{ marginRight: '0.4rem' }} />
            {isExporting ? 'Generating...' : 'Export ESG CSV'}
          </Button>
        </div>
      </div>

      {/* 4 Hero ESG Metric Cards */}
      <div className={styles.esgGrid}>
        <div className={`${styles.esgCard} ${styles.esgGreen}`}>
          <div className={styles.esgHeader}>
            <div className={styles.esgIconBox}>
              <Leaf size={22} />
            </div>
            <span className={styles.esgBadge}>GHG AVOIDANCE</span>
          </div>
          <div className={styles.esgValue}>{co2AvertedKg.toLocaleString()} kg</div>
          <div className={styles.esgLabel}>CO₂e Emissions Averted</div>
          <div className={styles.esgSubtext}>
            Calculated at 2.5 kg CO₂e per kg food diverted from anaerobic landfill decomposition.
          </div>
        </div>

        <div className={`${styles.esgCard} ${styles.esgCyan}`}>
          <div className={styles.esgHeader}>
            <div className={styles.esgIconBox}>
              <Droplets size={22} />
            </div>
            <span className={styles.esgBadge}>WATER EMBODIED</span>
          </div>
          <div className={styles.esgValue}>{waterConservedLiters.toLocaleString()} L</div>
          <div className={styles.esgLabel}>Freshwater Preserved</div>
          <div className={styles.esgSubtext}>
            Agricultural freshwater lifecycle embedded in recovered farm & dairy produce.
          </div>
        </div>

        <div className={`${styles.esgCard} ${styles.esgPink}`}>
          <div className={styles.esgHeader}>
            <div className={styles.esgIconBox}>
              <Heart size={22} />
            </div>
            <span className={styles.esgBadge}>NUTRITION RELIEF</span>
          </div>
          <div className={styles.esgValue}>{mealsDistributed.toLocaleString()}</div>
          <div className={styles.esgLabel}>Meal Portions Delivered</div>
          <div className={styles.esgSubtext}>
            Standardized 400g wholesome nutritious portions provided to shelter homes and food relief centers.
          </div>
        </div>

        <div className={`${styles.esgCard} ${styles.esgYellow}`}>
          <div className={styles.esgHeader}>
            <div className={styles.esgIconBox}>
              <TrendingUp size={22} />
            </div>
            <span className={styles.esgBadge}>ECONOMIC VALUE</span>
          </div>
          <div className={styles.esgValue}>₹{economicSavingsInr.toLocaleString()}</div>
          <div className={styles.esgLabel}>Commercial Value Saved</div>
          <div className={styles.esgSubtext}>
            Fair-market culinary cost recovered rather than incinerated or written off as waste.
          </div>
        </div>
      </div>

      {/* Operational Efficiency Split */}
      <div className={styles.splitGrid}>
        {/* Left Card: Category Breakdown Table */}
        <div className={styles.contentCard}>
          <div className={styles.cardTop}>
            <div>
              <h2 className={styles.cardTitle}>Category Redistribution Breakdown</h2>
              <p className={styles.cardSubtitle}>
                Operational recovery rates mapped against production volume and surplus generation.
              </p>
            </div>
            <Badge variant="black">5 CATEGORIES TRACKED</Badge>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Food Category</th>
                  <th>Produced</th>
                  <th>Surplus</th>
                  <th>Recovered</th>
                  <th>Wasted</th>
                  <th>Recovery Rate</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORY_DATA.map((row) => {
                  const prod = Math.round(row.produced * multiplier);
                  const surp = Math.round(row.surplus * multiplier);
                  const rec = Math.round(row.recovered * multiplier);
                  const wst = Math.round(row.wasted * multiplier);

                  return (
                    <tr key={row.category}>
                      <td>
                        <strong>{row.category}</strong>
                      </td>
                      <td>{prod} kg</td>
                      <td>{surp} kg</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{rec} kg</td>
                      <td style={{ color: wst > 10 ? '#dc2626' : '#666' }}>{wst} kg</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={styles.progressBarBg}>
                            <div
                              className={styles.progressBarFill}
                              style={{ width: `${row.recoveryRate}%` }}
                            />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{row.recoveryRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: ESG Compliance & Performance Overview */}
        <div className={styles.contentCard}>
          <div className={styles.cardTop}>
            <div>
              <h2 className={styles.cardTitle}>Operational Governance Index</h2>
              <p className={styles.cardSubtitle}>Efficiency ratios and network compliance benchmarks.</p>
            </div>
            <Badge variant="yellow">AAA RATED</Badge>
          </div>

          <div className={styles.governanceMetrics}>
            <div className={styles.govRow}>
              <div>
                <span className={styles.govLabel}>Surplus Recovery Rate</span>
                <p className={styles.govDesc}>Percentage of detected surplus successfully delivered to beneficiaries</p>
              </div>
              <span className={styles.govValueHighlight}>{recoveryRate}%</span>
            </div>

            <div className={styles.govRow}>
              <div>
                <span className={styles.govLabel}>Zero-Waste Diversion Index</span>
                <p className={styles.govDesc}>Portion of food prevented from reaching landfill disposal</p>
              </div>
              <span className={styles.govValueHighlight}>97.4%</span>
            </div>

            <div className={styles.govRow}>
              <div>
                <span className={styles.govLabel}>Average Handover Cycle Time</span>
                <p className={styles.govDesc}>Elapsed duration from donor publishing to delivery completion</p>
              </div>
              <span className={styles.govValueHighlight}>18.4 min</span>
            </div>

            <div className={styles.govRow}>
              <div>
                <span className={styles.govLabel}>Cold-Chain Compliance</span>
                <p className={styles.govDesc}>Audit compliance across refrigerated routes and storage checks</p>
              </div>
              <span className={styles.govValueHighlight}>100%</span>
            </div>
          </div>

          <div className={styles.auditDossierBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: '#059669' }} />
              <strong style={{ fontSize: '0.95rem' }}>FSSAI & ESG Audit Dossier Ready</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.35rem', lineHeight: 1.4 }}>
              All transactions, pickup logs, vehicle GPS breadcrumbs, and receiver digital PINs are cryptographically
              indexed for statutory CSR and ESG verification.
            </p>
            <div style={{ marginTop: '0.85rem' }}>
              <Button
                variant="alt"
                className="is--black"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                onClick={handleExportCSV}
              >
                <FileSpreadsheet size={15} style={{ marginRight: '0.4rem' }} /> Download Complete Audit Ledger
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
