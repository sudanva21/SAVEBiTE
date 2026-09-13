'use client';

// ==============================================
// SaveByte — Digital Twin Simulation Engine
// Predictive Logistics, Cold-Chain & Stress Sandbox
// ==============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Cpu,
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Navigation,
  Thermometer,
  Truck,
  Building2,
  CloudRain,
  Zap,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import styles from './digital-twin.module.css';

interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  stressFactor: string;
  delayModifier: number;
  decayRateModifier: number;
  deliverySuccessRate: number;
  activeNodes: number;
  recommendedAction: string;
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: 'baseline',
    name: 'Standard Operations (Baseline)',
    badge: 'NOMINAL',
    description: 'Optimal Bangalore metro traffic, nominal ambient weather (24°C), balanced donor supply.',
    stressFactor: '1.0x (Normal)',
    delayModifier: 0,
    decayRateModifier: 1.0,
    deliverySuccessRate: 98,
    activeNodes: 14,
    recommendedAction: 'Autonomous dispatching active. No manual intervention required.',
  },
  {
    id: 'monsoon',
    name: 'Monsoon Flash Surge & Waterlogging',
    badge: 'WEATHER ALERT',
    description: 'Major arterial flood risk along Outer Ring Road & Koramangala. Road transit speeds drop 42%.',
    stressFactor: '1.8x (Severe)',
    delayModifier: 24,
    decayRateModifier: 1.4,
    deliverySuccessRate: 88,
    activeNodes: 11,
    recommendedAction: 'Activate dynamic micro-hub intermediate cross-docking; switch 3 delivery vans to elevated bypass corridor.',
  },
  {
    id: 'cold_chain_warning',
    name: 'Cold-Chain Chiller Excursion (KA-01-EB-4921)',
    badge: 'CRITICAL HAZARD',
    description: 'Refrigerated van reefer unit drops efficiency; container temp climbs from 4.2°C to 11.8°C.',
    stressFactor: '2.5x (Hazard)',
    delayModifier: 0,
    decayRateModifier: 2.8,
    deliverySuccessRate: 79,
    activeNodes: 9,
    recommendedAction: 'Emergency shelf-life compression from 4h to 75min. Auto-diverting batch to closest recipient (Annapoorna Kitchen).',
  },
  {
    id: 'banquet_spike',
    name: 'Late-Night Banquet Spike (280 kg Prepared Food)',
    badge: 'CAPACITY STRESS',
    description: 'Five-star hotel releases 280 kg surplus biryani & dal at 10:45 PM. Recipient capacity exceeds single shelter.',
    stressFactor: '2.2x (Spike)',
    delayModifier: 8,
    decayRateModifier: 1.1,
    deliverySuccessRate: 95,
    activeNodes: 16,
    recommendedAction: 'Execute multi-tier micro-batch splitting across Sneha Shelter, Akshaya Kitchen, and Hope Children Home.',
  },
];

interface NodeStatus {
  id: string;
  name: string;
  type: 'DONOR' | 'LOGISTICS' | 'RECIPIENT' | 'HUB';
  currentTemp?: string;
  load: string;
  latency: string;
  status: 'OPTIMAL' | 'WARNING' | 'REROUTED';
}

const NODES_DATA: NodeStatus[] = [
  { id: 'N-01', name: 'The Grand Taj Kitchen (MG Road)', type: 'DONOR', load: '85 kg ready', latency: '4 min', status: 'OPTIMAL' },
  { id: 'N-02', name: 'Reefer Van #4 (KA-01-EB-4921)', type: 'LOGISTICS', currentTemp: '4.2°C', load: '65% cap', latency: '12 min', status: 'OPTIMAL' },
  { id: 'N-03', name: 'Indiranagar Cold-Dock Microhub', type: 'HUB', currentTemp: '3.8°C', load: '40% cap', latency: '2 min', status: 'OPTIMAL' },
  { id: 'N-04', name: 'Sneha Shelter Home (Ulsoor)', type: 'RECIPIENT', load: '120 meals cap', latency: '8 min', status: 'OPTIMAL' },
  { id: 'N-05', name: 'Annapoorna Food Relief (Shivajinagar)', type: 'RECIPIENT', load: '250 meals cap', latency: '14 min', status: 'OPTIMAL' },
];

export default function DigitalTwinPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('baseline');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(1);
  const [liveLog, setLiveLog] = useState<string[]>([
    '[09:15:02] Digital Twin physics engine synchronized with Bangalore City mesh.',
    '[09:15:10] Real-time sensor feed connected: 5 nodes, 2 logistics units.',
    '[09:15:18] Predictive telemetry verified within nominal safety bounds.',
  ]);

  const currentScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimStep(0);
    const newLogs = [
      `[T+00s] Initializing scenario injection: ${currentScenario.name}`,
      `[T+02s] Computing spatial decay vectors: Stress Factor ${currentScenario.stressFactor}`,
      `[T+04s] Re-evaluating 14 road segments and vehicle chiller thermodynamic models...`,
      `[T+06s] AI Recommendation Generated: "${currentScenario.recommendedAction}"`,
      `[T+08s] Simulation cycle converged. Delivery probability calculated at ${currentScenario.deliverySuccessRate}%.`,
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < newLogs.length) {
        const logLine = newLogs[index];
        setLiveLog((prev) => [logLine, ...prev.slice(0, 8)]);
        index++;
        setSimStep(index);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 450);
  };

  const handleExportSim = () => {
    const json = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        scenario: currentScenario,
        nodes: NODES_DATA,
        metrics: {
          successRate: `${currentScenario.deliverySuccessRate}%`,
          stressFactor: currentScenario.stressFactor,
          delayAddedMin: currentScenario.delayModifier,
        },
        aiMitigationPolicy: currentScenario.recommendedAction,
      },
      null,
      2
    );

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital_twin_sim_${selectedScenarioId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <Badge variant="black">✦ PREDICTIVE LOGISTICS TWIN</Badge>
            <span className={styles.liveTag}>
              <span className={styles.pulseDot}>●</span> Active Synchronization (1.2 Hz)
            </span>
          </div>
          <h1 className={styles.title}>SAVEBiET Digital Twin Sandbox</h1>
          <p className={styles.subtitle}>
            Continuous in-silico simulation of cold-chain thermodynamics, food microbial shelf-life decay, and route disruption scenarios.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="default" onClick={handleRunSimulation} disabled={isSimulating}>
            {isSimulating ? (
              <>
                <RotateCcw size={16} className={styles.spin} style={{ marginRight: '0.4rem' }} />
                Simulating Step {simStep}/5...
              </>
            ) : (
              <>
                <Play size={16} style={{ marginRight: '0.4rem' }} /> Run Scenario Twin
              </>
            )}
          </Button>

          <Button variant="alt" onClick={handleExportSim}>
            <Download size={16} style={{ marginRight: '0.4rem' }} /> Export Model
          </Button>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className={styles.scenarioBar}>
        <span className={styles.scenarioBarLabel}>SCENARIO INJECTION:</span>
        <div className={styles.scenarioPills}>
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              className={`${styles.scenarioPill} ${selectedScenarioId === sc.id ? styles.scenarioPillActive : ''}`}
              onClick={() => setSelectedScenarioId(sc.id)}
            >
              <span className={styles.pillBadge}>{sc.badge}</span>
              <span className={styles.pillText}>{sc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Impact KPI Strip */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>PROJECTED FULFILLMENT</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div className={styles.kpiValue} style={{ color: currentScenario.deliverySuccessRate < 85 ? '#dc2626' : '#059669' }}>
            {currentScenario.deliverySuccessRate}%
          </div>
          <div className={styles.kpiSub}>Predicted meal salvage rate under scenario conditions</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>TRANSIT LATENCY DELAY</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div className={styles.kpiValue}>
            {currentScenario.delayModifier > 0 ? `+${currentScenario.delayModifier} min` : '0 min'}
          </div>
          <div className={styles.kpiSub}>Estimated traffic delay beyond baseline benchmark</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>MICROBIAL DECAY RATE</span>
            <Thermometer size={18} color="#6366f1" />
          </div>
          <div className={styles.kpiValue}>{currentScenario.decayRateModifier}x</div>
          <div className={styles.kpiSub}>Thermal acceleration coefficient for perishable inventory</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>ACTIVE TWIN NODES</span>
            <Cpu size={18} color="#121212" />
          </div>
          <div className={styles.kpiValue}>{currentScenario.activeNodes} / 16</div>
          <div className={styles.kpiSub}>Donors, micro-hubs, and receiving institutions modeled</div>
        </div>
      </div>

      {/* Two Column Layout: Node Status & AI Policy Engine */}
      <div className={styles.splitGrid}>
        {/* Left: Node Topology Status */}
        <div className={styles.contentCard}>
          <div className={styles.cardTop}>
            <div>
              <h2 className={styles.cardTitle}>Digital Twin Node Mesh</h2>
              <p className={styles.cardSubtitle}>
                State vector metrics synchronized from physical IoT nodes and geo-coordinates.
              </p>
            </div>
            <Badge variant="yellow">5 REAL-TIME NODES</Badge>
          </div>

          <div className={styles.nodeList}>
            {NODES_DATA.map((node) => {
              const isAffected =
                (selectedScenarioId === 'cold_chain_warning' && node.id === 'N-02') ||
                (selectedScenarioId === 'monsoon' && node.id === 'N-04');

              return (
                <div
                  key={node.id}
                  className={`${styles.nodeItem} ${isAffected ? styles.nodeItemAlert : ''}`}
                >
                  <div className={styles.nodeIcon}>
                    {node.type === 'DONOR' ? (
                      <Building2 size={20} />
                    ) : node.type === 'LOGISTICS' ? (
                      <Truck size={20} />
                    ) : node.type === 'HUB' ? (
                      <Layers size={20} />
                    ) : (
                      <Navigation size={20} />
                    )}
                  </div>
                  <div className={styles.nodeInfo}>
                    <div className={styles.nodeHeaderRow}>
                      <span className={styles.nodeName}>{node.name}</span>
                      <span className={styles.nodeBadge}>{node.type}</span>
                    </div>
                    <div className={styles.nodeMeta}>
                      <span>{node.load}</span>
                      {node.currentTemp && (
                        <span style={{ color: isAffected ? '#dc2626' : '#059669', fontWeight: 800 }}>
                          • {isAffected ? '11.8°C ⚠' : node.currentTemp}
                        </span>
                      )}
                      <span>• Est. Latency: {node.latency}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`${styles.statusPill} ${
                        isAffected ? styles.statusPillWarning : styles.statusPillOptimal
                      }`}
                    >
                      {isAffected ? 'EXCURSION' : 'SYNCED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Mitigation & Live Simulation Telemetry Stream */}
        <div className={styles.contentCard}>
          <div className={styles.cardTop}>
            <div>
              <h2 className={styles.cardTitle}>AI Mitigation & Prescriptive Control</h2>
              <p className={styles.cardSubtitle}>Autonomous policy recommendations based on scenario stress tests.</p>
            </div>
            <Badge variant="black">AI ACTIVE</Badge>
          </div>

          {/* Prescriptive Policy Box */}
          <div className={styles.recommendationBox}>
            <div className={styles.recHeader}>
              <Sparkles size={18} color="#d97706" />
              <strong>Recommended Tactical Dispatch Policy</strong>
            </div>
            <p className={styles.recBody}>{currentScenario.recommendedAction}</p>
            <div className={styles.recActions}>
              <Link href="/routes">
                <Button variant="default" style={{ fontSize: '0.85rem' }}>
                  Deploy Reroute to Live Vehicles <ArrowRight size={14} style={{ marginLeft: '0.35rem' }} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Telemetry Log */}
          <div className={styles.terminalBox}>
            <div className={styles.terminalHeader}>
              <Activity size={14} color="#10b981" />
              <span>DIGITAL TWIN SIMULATION TELEMETRY STREAM</span>
            </div>
            <div className={styles.terminalBody}>
              {liveLog.map((line, idx) => (
                <div key={idx} className={styles.logLine}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
