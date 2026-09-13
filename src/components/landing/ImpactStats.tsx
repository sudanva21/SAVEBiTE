import React from 'react';
import { IMPACT_STATS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import * as LucideIcons from 'lucide-react';
import styles from './ImpactStats.module.css';

const STAT_COLORS = [
  'is--cyan',
  'is--pink',
  'is--yellow',
  'is--periwinkle',
];

function DynamicIcon({ name, size = 26 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export function ImpactStats() {
  return (
    <section className={styles.section} id="impact">
      <div className="u-container">
        {/* Section Header */}
        <div className={styles.header}>
          <Badge variant="black">✦ MEASURABLE SUSTAINABILITY</Badge>
          <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            Tangible Impact, Byte by Byte.
          </h2>
          <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-wine)' }}>
            Real-time verified metrics across thousands of daily operations.
          </HandwrittenNote>
        </div>

        {/* 4 Chunky Pastel Metric Cards */}
        <div className={styles.grid}>
          {IMPACT_STATS.map((stat, idx) => {
            const colorClass = STAT_COLORS[idx % STAT_COLORS.length];
            const rotations = [-1.5, 1, -1, 1.5];
            return (
              <div
                key={stat.label}
                className={`${styles.card} ${colorClass}`}
                style={{ transform: `rotate(${rotations[idx]}deg)` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconBox}>
                    <DynamicIcon name={stat.icon} />
                  </div>
                  <span className={styles.statDot}>●</span>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>

                <div className={styles.cardFooter}>
                  <span>Audited via SAVEBiET ESG</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
