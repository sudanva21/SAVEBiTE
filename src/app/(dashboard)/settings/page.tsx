'use client';

// ==============================================
// SaveByte — Settings & Platform Configuration (Phase 2)
// ==============================================

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Key, Cpu, Download, Copy, Check, Lock, Building2 } from 'lucide-react';
import { IdentityContext } from '@/types';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [contextData, setContextData] = useState<IdentityContext | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => setContextData(data))
      .catch(() => {});
  }, []);

  const activeOrg = contextData?.activeOrganization;
  const isIndividual = contextData?.isIndividual ?? false;

  const copyApiKey = () => {
    navigator.clipboard.writeText('sb_live_99214_ae88f01b3921ec5');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Badge variant="black">✦ PLATFORM SETTINGS</Badge>
          <h1 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            Account & Platform Configuration
          </h1>
          <HandwrittenNote rotate={-1.5} size="medium" style={{ color: 'var(--sb-magenta)' }}>
            Configured for {isIndividual ? 'Personal User' : activeOrg?.name || 'Primary Workspace'}.
          </HandwrittenNote>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Active Organization Context Settings [AVAILABLE NOW] */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.iconBox}>
              <Building2 size={20} />
            </div>
            <Badge variant="black">ACTIVE CONTEXT</Badge>
          </div>
          <h2 className="u-heading-s">Organization Workspace</h2>
          <p className={styles.cardDesc}>
            Current active identity: <strong>{isIndividual ? 'Personal Individual Mode' : activeOrg?.name || 'Loading...'}</strong>
          </p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: '#444' }}>
            <p><strong>Organization Type:</strong> {isIndividual ? 'Individual' : activeOrg?.type || 'N/A'}</p>
            <p style={{ marginTop: '0.25rem' }}><strong>Facilities Registered:</strong> {activeOrg?.facilities?.length || 0} active</p>
          </div>
        </div>

        {/* API Keys Card [AVAILABLE NOW] */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.iconBox}>
              <Key size={20} />
            </div>
            <Badge variant="black">DEVELOPER API</Badge>
          </div>
          <h2 className="u-heading-s">SAVEBiET API Keys</h2>
          <p className={styles.cardDesc}>
            Use this token to authenticate POS kitchen terminals, ERP connectors, and dispatch webhooks.
          </p>
          <div className={styles.keyBox}>
            <code className={styles.keyCode}>sb_live_99214_ae88f01b3921ec5</code>
            <button type="button" className={styles.copyBtn} onClick={copyApiKey}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Future IoT Fleet Card [COMING IN FUTURE PHASES] */}
        <div className={styles.card} style={{ opacity: 0.85, background: '#fafafa' }}>
          <div className={styles.cardTop}>
            <div className={styles.iconBox}>
              <Cpu size={20} />
            </div>
            <Badge variant="black">PHASE 6 — COMING SOON</Badge>
          </div>
          <h2 className="u-heading-s">Hardware IoT Sensor Fleets</h2>
          <p className={styles.cardDesc}>
            Direct BLE & LoRaWAN hardware sensor node telemetry integration is scheduled for Phase 6.
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#777' }}>
            <Lock size={16} />
            <span>Hardware telemetry engine will be activated in Phase 6.</span>
          </div>
        </div>

        {/* Future ESG Reporting Card [COMING IN FUTURE PHASES] */}
        <div className={styles.card} style={{ opacity: 0.85, background: '#fafafa' }}>
          <div className={styles.cardTop}>
            <div className={styles.iconBox}>
              <Download size={20} />
            </div>
            <Badge variant="black">PHASE 11 — COMING SOON</Badge>
          </div>
          <h2 className="u-heading-s">Audit-Ready ESG Exports</h2>
          <p className={styles.cardDesc}>
            Automated Scope 3 GHG avoidance certification and CSR compliance ledger generation is scheduled for Phase 11.
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#777' }}>
            <Lock size={16} />
            <span>ESG calculation algorithms will be activated in Phase 11.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
