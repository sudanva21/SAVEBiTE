'use client';

// ==============================================
// SaveByte — IoT Sensor Telemetry & Cold-Chain Hub
// ==============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Radio,
  Wifi,
  Thermometer,
  Droplets,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Download,
  Clock,
  ShieldCheck,
  Cpu,
  Truck,
  Building2,
  Layers,
} from 'lucide-react';
import styles from './iot.module.css';

interface IoTSensor {
  id: string;
  name: string;
  facility: string;
  type: 'CHILLER' | 'REEFER_VAN' | 'PREP_BAY' | 'PANTRY';
  temperature: number;
  humidity: number;
  battery: number;
  signalStrength: number; // dBm
  lastPingSec: number;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL';
}

const INITIAL_SENSORS: IoTSensor[] = [
  {
    id: 'IOT-CH-101',
    name: 'Walk-in Chiller Unit Alpha',
    facility: 'The Grand Taj Kitchen (MG Road)',
    type: 'CHILLER',
    temperature: 3.8,
    humidity: 65,
    battery: 94,
    signalStrength: -62,
    lastPingSec: 4,
    status: 'ONLINE',
  },
  {
    id: 'IOT-VAN-402',
    name: 'Reefer Cargo Sensor #4',
    facility: 'Reefer Van KA-01-EB-4921 (Transit)',
    type: 'REEFER_VAN',
    temperature: 4.4,
    humidity: 72,
    battery: 81,
    signalStrength: -75,
    lastPingSec: 8,
    status: 'ONLINE',
  },
  {
    id: 'IOT-HUB-009',
    name: 'Cold-Dock Intermediate Buffer',
    facility: 'Indiranagar Urban Microhub',
    type: 'CHILLER',
    temperature: 4.1,
    humidity: 68,
    battery: 98,
    signalStrength: -58,
    lastPingSec: 2,
    status: 'ONLINE',
  },
  {
    id: 'IOT-BAY-204',
    name: 'Cooked Surplus Quarantine Bay',
    facility: 'Sneha Shelter Receiving Hub',
    type: 'PREP_BAY',
    temperature: 18.5,
    humidity: 55,
    battery: 88,
    signalStrength: -68,
    lastPingSec: 12,
    status: 'ONLINE',
  },
  {
    id: 'IOT-DRY-305',
    name: 'Dry Grain Ambient Silo',
    facility: 'Akshaya Community Kitchen',
    type: 'PANTRY',
    temperature: 23.2,
    humidity: 42,
    battery: 76,
    signalStrength: -80,
    lastPingSec: 15,
    status: 'ONLINE',
  },
];

export default function IoTTelemetryPage() {
  const [sensors, setSensors] = useState<IoTSensor[]>(INITIAL_SENSORS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Live timer tick for seconds ago
  useEffect(() => {
    const timer = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => ({
          ...s,
          lastPingSec: s.lastPingSec < 60 ? s.lastPingSec + 1 : 2,
          // Subtle temperature micro-jitter (+/- 0.1°C)
          temperature:
            s.status === 'CRITICAL'
              ? s.temperature
              : Number((s.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1)),
        }))
      );
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const handleSimulateExcursion = () => {
    setSensors((prev) =>
      prev.map((s) => {
        if (s.id === 'IOT-VAN-402') {
          return {
            ...s,
            temperature: 12.6,
            status: 'CRITICAL',
          };
        }
        return s;
      })
    );
    setAlertNotice('CRITICAL ALERT: Sensor IOT-VAN-402 breached upper cold-chain threshold (>8.0°C). AI reroute suggested.');
  };

  const handleResetExcursion = () => {
    setSensors(INITIAL_SENSORS);
    setAlertNotice(null);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Sensor ID,Sensor Name,Facility,Type,Temperature (°C),Humidity (%),Battery (%),Signal (dBm),Status\n' +
      sensors
        .map(
          (s) =>
            `"${s.id}","${s.name}","${s.facility}","${s.type}",${s.temperature},${s.humidity}%,${s.battery}%,${s.signalStrength}dBm,"${s.status}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SaveByte_IoT_Telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSensors =
    filterType === 'ALL' ? sensors : sensors.filter((s) => s.type === filterType);

  const totalOnline = sensors.filter((s) => s.status === 'ONLINE').length;
  const totalCritical = sensors.filter((s) => s.status === 'CRITICAL').length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <Badge variant="black">✦ IOT MESH TELEMETRY</Badge>
            <span className={styles.liveTag}>
              <span className={styles.pulseDot}>●</span> Gateway Connected: MQTT / LoRaWAN
            </span>
          </div>
          <h1 className={styles.title}>IoT Telemetry & Cold-Chain Network</h1>
          <p className={styles.subtitle}>
            Continuous wireless telemetry across stationary commercial walk-ins, mobile refrigerated rescue vans, and recipient prep hubs.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="default" onClick={handleSimulateExcursion}>
            <AlertTriangle size={15} style={{ marginRight: '0.4rem' }} /> Test Chiller Spike
          </Button>
          {totalCritical > 0 && (
            <Button variant="alt" onClick={handleResetExcursion}>
              <RefreshCw size={15} style={{ marginRight: '0.4rem' }} /> Reset Sensors
            </Button>
          )}
          <Button variant="alt" onClick={handleExportCSV}>
            <Download size={15} style={{ marginRight: '0.4rem' }} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Alert banner if excursion */}
      {alertNotice && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={20} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <strong>{alertNotice}</strong>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Microbial safety timer activated. Inspect batch telemetry on the{' '}
              <Link href="/digital-twin" style={{ textDecoration: 'underline', fontWeight: 700 }}>
                Digital Twin Sandbox
              </Link>{' '}
              or update transit corridor on{' '}
              <Link href="/routes" style={{ textDecoration: 'underline', fontWeight: 700 }}>
                Smart Routes
              </Link>
              .
            </div>
          </div>
          <button type="button" className={styles.closeAlertBtn} onClick={() => setAlertNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Sensor Stat Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>TOTAL BEACONS DEPLOYED</span>
            <Radio size={18} color="#121212" />
          </div>
          <div className={styles.kpiValue}>{sensors.length} Nodes</div>
          <div className={styles.kpiSub}>100% telemetry coverage across active operational corridors</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>NETWORK HEALTH</span>
            <Wifi size={18} color="#059669" />
          </div>
          <div className={styles.kpiValue} style={{ color: '#059669' }}>
            {totalOnline} / {sensors.length} Active
          </div>
          <div className={styles.kpiSub}>Sub-15 second ping cadence across all IoT nodes</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>AVERAGE CHILLER TEMP</span>
            <Thermometer size={18} color="#0284c7" />
          </div>
          <div className={styles.kpiValue}>4.1°C</div>
          <div className={styles.kpiSub}>Ideal cold-chain storage range: 2.0°C to 8.0°C</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>EXCURSION ALERTS</span>
            <AlertTriangle size={18} color={totalCritical > 0 ? '#dc2626' : '#666'} />
          </div>
          <div className={styles.kpiValue} style={{ color: totalCritical > 0 ? '#dc2626' : '#059669' }}>
            {totalCritical === 0 ? '0 Active' : `${totalCritical} Critical`}
          </div>
          <div className={styles.kpiSub}>Immediate automated alerts dispatched to van driver & recipient</div>
        </div>
      </div>

      {/* Sensor Table Card */}
      <div className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Live Sensor Telemetry Matrix</h2>
            <p className={styles.cardSubtitle}>
              Bi-directional sensor heartbeat with continuous temperature, humidity, and signal logging.
            </p>
          </div>

          <div className={styles.filterPills}>
            {['ALL', 'CHILLER', 'REEFER_VAN', 'PREP_BAY', 'PANTRY'].map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.filterBtn} ${filterType === t ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Sensor ID & Name</th>
                <th>Facility / Node</th>
                <th>Type</th>
                <th>Temp (°C)</th>
                <th>Humidity</th>
                <th>Battery</th>
                <th>Signal</th>
                <th>Last Ping</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSensors.map((sensor) => {
                const isTempWarm =
                  (sensor.type === 'CHILLER' || sensor.type === 'REEFER_VAN') &&
                  sensor.temperature > 8.0;

                return (
                  <tr key={sensor.id} className={isTempWarm ? styles.rowAlert : ''}>
                    <td>
                      <div>
                        <strong>{sensor.name}</strong>
                        <div className={styles.monoId}>{sensor.id}</div>
                      </div>
                    </td>
                    <td>{sensor.facility}</td>
                    <td>
                      <span className={styles.typeBadge}>{sensor.type.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span
                        className={styles.tempBadge}
                        style={{
                          backgroundColor: isTempWarm ? '#fee2e2' : '#f0fdf4',
                          color: isTempWarm ? '#dc2626' : '#166534',
                        }}
                      >
                        {sensor.temperature}°C {isTempWarm && '⚠'}
                      </span>
                    </td>
                    <td>{sensor.humidity}% RH</td>
                    <td>
                      <span className={styles.batteryCell}>
                        <Battery size={14} color="#059669" /> {sensor.battery}%
                      </span>
                    </td>
                    <td>{sensor.signalStrength} dBm</td>
                    <td>{sensor.lastPingSec}s ago</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          sensor.status === 'CRITICAL' ? styles.statusPillCritical : styles.statusPillOnline
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
