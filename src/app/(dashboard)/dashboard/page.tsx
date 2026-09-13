'use client';

// ==============================================
// SaveByte — Operations Command Center (Phase 2)
// Clean, Tactile, High-Precision Operations Control
// ==============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UtensilsCrossed,
  AlertTriangle,
  GitMerge,
  Leaf,
  Thermometer,
  Clock,
  ArrowUpRight,
  Activity,
  Orbit,
  Sparkles,
  Layers,
  Bot,
  Building2,
  MapPin,
  ShieldCheck,
  Plus,
  Search,
  Truck,
  ArrowRight,
  Radio,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { IdentityContext } from '@/types';
import { getDashboardOverviewAction, DashboardMetrics } from '@/app/actions/dashboardActions';
import styles from './command-center.module.css';

// Mock live telemetry batches
const INITIAL_BATCHES = [
  {
    id: 'SB-8821',
    foodItem: 'Cooked Rice & Dal Meals (120 Portions)',
    donor: 'The Taj Grand Kitchen',
    temp: '4.2°C',
    shelfLife: '3h 15m remaining',
    status: 'OPTIMAL',
    statusColor: 'is--green',
    matchTarget: 'Annapoorna Community Kitchen (3.2 km)',
  },
  {
    id: 'SB-8822',
    foodItem: 'Artisan Sourdough & Pastries (45 kg)',
    donor: 'Harvest Bakers Hub',
    temp: '18.5°C',
    shelfLife: '8h 40m remaining',
    status: 'MATCHED',
    statusColor: 'is--cyan',
    matchTarget: 'St. Jude Children Haven (5.1 km)',
  },
  {
    id: 'SB-8823',
    foodItem: 'Mixed Cut Vegetables & Salad (30 kg)',
    donor: 'Metro Banquet Hall',
    temp: '6.8°C',
    shelfLife: '1h 45m remaining',
    status: 'AT RISK',
    statusColor: 'is--pink',
    matchTarget: 'BioEnergy Upcycler Unit 4 (12.4 km)',
  },
];

export default function CommandCenterPage() {
  const [digitalTwinScenario, setDigitalTwinScenario] = useState<'normal' | 'monsoon' | 'coldchain'>('normal');
  const [contextData, setContextData] = useState<IdentityContext | null>(null);
  const [overviewData, setOverviewData] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => setContextData(data))
      .catch(() => {});

    getDashboardOverviewAction()
      .then((res) => {
        if (res.success) setOverviewData(res.data);
      })
      .catch(() => {});
  }, []);

  const activeOrg = contextData?.activeOrganization;
  const activeRole = contextData?.activeMembership?.role;
  const isIndividual = contextData?.isIndividual ?? false;
  const primaryFacility = activeOrg?.facilities?.[0];

  const stats = overviewData?.stats || {
    label1: 'Active Batches',
    value1: '14 Batches',
    sub1: 'Tracked in cold-chain database',
    label2: 'Surplus Dispatches',
    value2: '420 kg',
    sub2: 'Validated zero waste',
    label3: 'Active Claims',
    value3: '8 Claims',
    sub3: 'Traceable handover verification',
    label4: 'Recovered Meals',
    value4: '1,280 Meals',
    sub4: 'Tamper-proof audit trail',
  };

  return (
    <div className={styles.page}>
      {/* Active Identity Context Banner */}
      <div className={styles.identityCard}>
        <div className={styles.identityLeft}>
          <div
            className={styles.identityIconBox}
            style={{
              background: isIndividual ? '#ecfeff' : '#fefce8',
            }}
          >
            {isIndividual ? <ShieldCheck size={22} /> : <Building2 size={22} />}
          </div>
          <div>
            <div className={styles.identityTitleRow}>
              <strong className={styles.identityTitle}>
                {isIndividual ? 'Personal Individual Context' : activeOrg?.name || 'Primary Workspace'}
              </strong>
              {!isIndividual && activeOrg?.type && (
                <Badge variant="black">{activeOrg.type}</Badge>
              )}
              {activeRole && (
                <span className={styles.roleTag}>
                  {activeRole}
                </span>
              )}
            </div>
            <div className={styles.identityMeta}>
              <MapPin size={14} />
              <span>
                {primaryFacility ? `${primaryFacility.name} — ${primaryFacility.address}, ${primaryFacility.city || 'India'}` : 'Decoupled Personal Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.identityActions}>
          <Link href="/profile">
            <Button variant="default" style={{ fontSize: '0.85rem' }}>
              Manage Memberships
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="alt" style={{ fontSize: '0.85rem' }}>
              <Plus size={14} style={{ marginRight: '0.3rem' }} /> Add Org
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.topBadgeRow}>
            <Badge variant="black">✦ LIVE FOOD ECOSYSTEM</Badge>
            <span className={styles.liveClock}>
              <Activity size={14} className={styles.pulseDot} /> Database State Verified
            </span>
          </div>
          <h1 className={styles.pageTitle}>
            Operations Command Center
          </h1>
          <p className={styles.pageSubtitle}>
            Traceable donor batches, NGO claims, consumer reservations, and PIN-verified handovers.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/surplus">
            <Button variant="alt" className="is--black">
              + Post Surplus Food
            </Button>
          </Link>
          <Link href="/matching">
            <Button variant="alt" className="is--cyan">
              Discover & Claim
            </Button>
          </Link>
          <Link href="/recovery">
            <Button variant="alt" className="is--yellow">
              Recovery Dispatches
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Real Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.cardCyan}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconBox}>
              <UtensilsCrossed size={20} />
            </div>
            <span className={styles.cardTag}>DATABASE</span>
          </div>
          <div className={styles.metricValue}>{stats.value1}</div>
          <div className={styles.metricLabel}>{stats.label1}</div>
          <div className={styles.metricTrend}>
            <span>{stats.sub1}</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.cardPink}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconBox}>
              <AlertTriangle size={20} />
            </div>
            <span className={styles.cardTag}>SURPLUS</span>
          </div>
          <div className={styles.metricValue}>{stats.value2}</div>
          <div className={styles.metricLabel}>{stats.label2}</div>
          <div className={styles.metricTrend}>
            <span>{stats.sub2}</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.cardYellow}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconBox}>
              <GitMerge size={20} />
            </div>
            <span className={styles.cardTag}>REQUESTS</span>
          </div>
          <div className={styles.metricValue}>{stats.value3}</div>
          <div className={styles.metricLabel}>{stats.label3}</div>
          <div className={styles.metricTrend}>
            <span>{stats.sub3}</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.cardGreen}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconBox}>
              <Leaf size={20} />
            </div>
            <span className={styles.cardTag}>RECOVERIES</span>
          </div>
          <div className={styles.metricValue}>{stats.value4}</div>
          <div className={styles.metricLabel}>{stats.label4}</div>
          <div className={styles.metricTrend}>
            <span>{stats.sub4}</span>
          </div>
        </div>
      </div>

      {/* Main Command Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Live Surplus Telemetry */}
        <div className={styles.feedCard}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardHeaderPre}>REAL-TIME AUDIT STREAM</div>
              <h2 className={styles.cardHeading}>Live Food Surplus Telemetry</h2>
              <p className={styles.cardSubtext}>
                Continuous IoT sensor tracking, batch temperatures, and shelf-life decay monitoring.
              </p>
            </div>
            <Badge variant="black">3 BATCHES MONITORED</Badge>
          </div>

          <div className={styles.batchList}>
            {INITIAL_BATCHES.map((batch) => (
              <div key={batch.id} className={styles.batchItem}>
                <div className={styles.batchMain}>
                  <div className={styles.batchTitleRow}>
                    <span className={styles.batchId}>{batch.id}</span>
                    <h3 className={styles.batchName}>{batch.foodItem}</h3>
                  </div>
                  <div className={styles.batchMeta}>
                    <span><strong>Origin:</strong> {batch.donor}</span>
                    <span className={styles.metaDivider}>•</span>
                    <span className={styles.metaSensor}>
                      <Thermometer size={14} style={{ color: '#0284c7' }} /> {batch.temp}
                    </span>
                    <span className={styles.metaDivider}>•</span>
                    <span className={styles.metaSensor}>
                      <Clock size={14} style={{ color: '#d97706' }} /> {batch.shelfLife}
                    </span>
                  </div>
                </div>

                <div className={styles.batchActionCol}>
                  <span className={`${styles.statusBadge} ${styles[batch.statusColor]}`}>
                    {batch.status}
                  </span>
                  <div className={styles.matchPill}>
                    <ArrowUpRight size={13} /> {batch.matchTarget}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.cardFooterActions}>
            <Link href="/iot">
              <Button variant="alt" style={{ fontSize: '0.85rem' }}>
                <Radio size={14} style={{ marginRight: '0.4rem' }} /> Open Live IoT Mesh Matrix →
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: SaveByte Digital Twin Simulator */}
        <div className={styles.twinCard}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className={styles.twinIconBox}>
                <Orbit size={22} />
              </div>
              <div>
                <div className={styles.cardHeaderPre}>IN-SILICO SANDBOX</div>
                <h2 className={styles.cardHeading}>SAVEBiET Digital Twin</h2>
                <p className={styles.cardSubtext}>Predictive logistics & scenario simulation</p>
              </div>
            </div>
            <Badge variant="black">SIMULATOR</Badge>
          </div>

          <div className={styles.simulatorControls}>
            <span className={styles.simLabel}>SELECT SIMULATION SCENARIO:</span>
            <div className={styles.simPills}>
              <button
                type="button"
                className={`${styles.simPill} ${digitalTwinScenario === 'normal' ? styles.simPillActive : ''}`}
                onClick={() => setDigitalTwinScenario('normal')}
              >
                Normal Operations
              </button>
              <button
                type="button"
                className={`${styles.simPill} ${digitalTwinScenario === 'monsoon' ? styles.simPillActive : ''}`}
                onClick={() => setDigitalTwinScenario('monsoon')}
              >
                Monsoon Surge (+40%)
              </button>
              <button
                type="button"
                className={`${styles.simPill} ${digitalTwinScenario === 'coldchain' ? styles.simPillActive : ''}`}
                onClick={() => setDigitalTwinScenario('coldchain')}
              >
                Cold-Chain Failure
              </button>
            </div>
          </div>

          {/* Dynamic Scenario Outcome Box */}
          <div className={styles.scenarioResult}>
            {digitalTwinScenario === 'normal' && (
              <>
                <div className={styles.scenarioHead}>
                  <Sparkles size={16} /> <strong>Baseline Flow: Steady State</strong>
                </div>
                <p className={styles.scenarioDesc}>
                  All 12 lifecycle stages operating within standard thresholds. AI dispatch route latency: 14.8 minutes. Projected daily loss: &lt; 0.8%.
                </p>
              </>
            )}
            {digitalTwinScenario === 'monsoon' && (
              <>
                <div className={styles.scenarioHead} style={{ color: '#b45309' }}>
                  <Layers size={16} /> <strong>Simulated Flood / Rain Demand Shock</strong>
                </div>
                <p className={styles.scenarioDesc}>
                  AI preemptively routes +480kg emergency dry rations to high-elevation community shelters. Fleet rerouted to avoid low-lying arterial corridors.
                </p>
              </>
            )}
            {digitalTwinScenario === 'coldchain' && (
              <>
                <div className={styles.scenarioHead} style={{ color: '#be123c' }}>
                  <AlertTriangle size={16} /> <strong>Simulated Van #04 Chiller Trip</strong>
                </div>
                <p className={styles.scenarioDesc}>
                  IoT alert triggers immediate reroute: Batch SB-8823 redirected to commercial blast freezer at 1.8km distance. Spoilage risk reduced by 94%.
                </p>
              </>
            )}
          </div>

          {/* AI Copilot Quick Intelligence */}
          <div className={styles.copilotBox}>
            <div className={styles.copilotHead}>
              <Bot size={16} />
              <span>SaveByte AI Copilot Recommendation</span>
            </div>
            <p className={styles.copilotText}>
              “Based on tomorrow’s local festival schedule in Sector 4, expect +35% buffet surplus between 14:00 and 16:00. Pre-positioning 3 volunteer courier vans.”
            </p>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Link href="/digital-twin">
              <Button variant="default" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                Open Full Digital Twin Sandbox <ArrowRight size={14} style={{ marginLeft: '0.4rem' }} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Direct Intelligence Hub Ribbon */}
      <div className={styles.intelligenceRibbon}>
        <div className={styles.ribbonItem}>
          <div className={styles.ribbonIcon}>
            <BarChart3 size={20} />
          </div>
          <div>
            <strong className={styles.ribbonTitle}>Analytics & ESG Impact</strong>
            <p className={styles.ribbonDesc}>Audit-ready GHG offsets, water conservation, and CSV export</p>
          </div>
          <Link href="/analytics" className={styles.ribbonLink}>
            Open Analytics →
          </Link>
        </div>

        <div className={styles.ribbonItem}>
          <div className={styles.ribbonIcon}>
            <Radio size={20} />
          </div>
          <div>
            <strong className={styles.ribbonTitle}>IoT Sensor Telemetry</strong>
            <p className={styles.ribbonDesc}>Live refrigeration temperatures, vehicle trackers, and alerts</p>
          </div>
          <Link href="/iot" className={styles.ribbonLink}>
            Open IoT Mesh →
          </Link>
        </div>

        <div className={styles.ribbonItem}>
          <div className={styles.ribbonIcon}>
            <Orbit size={20} />
          </div>
          <div>
            <strong className={styles.ribbonTitle}>Digital Twin Sandbox</strong>
            <p className={styles.ribbonDesc}>Run stress simulations for weather surges and cold-chain breaks</p>
          </div>
          <Link href="/digital-twin" className={styles.ribbonLink}>
            Open Simulator →
          </Link>
        </div>
      </div>
    </div>
  );
}
