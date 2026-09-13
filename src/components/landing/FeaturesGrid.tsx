'use client';

import React, { useState } from 'react';
import { FEATURES } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import * as LucideIcons from 'lucide-react';
import styles from './FeaturesGrid.module.css';

const CATEGORIES = [
  'All Features',
  'AI & Forecasting',
  'Redistribution & Social',
  'Logistics & IoT',
  'Digital Twin & ESG',
] as const;

type Category = typeof CATEGORIES[number];

const FEATURE_CATEGORIES: Record<string, Category> = {
  'AI Demand Forecasting': 'AI & Forecasting',
  'Smart Production Planning': 'AI & Forecasting',
  'Surplus Prediction & Detection': 'AI & Forecasting',
  'Food Quality & Expiry Intelligence': 'AI & Forecasting',
  'AI Recipient & Request Matching': 'Redistribution & Social',
  'Buy for Me': 'Redistribution & Social',
  'Sponsor a Meal': 'Redistribution & Social',
  'Food Requests Engine': 'Redistribution & Social',
  'Industrial Food Recovery': 'Logistics & IoT',
  'Smart Logistics & Route Optimization': 'Logistics & IoT',
  'IoT Telemetry Sensors': 'Logistics & IoT',
  'SAVEBiET Digital Twin': 'Digital Twin & ESG',
  'Processing Unit Intelligence': 'Digital Twin & ESG',
  'Sustainability & ESG Analytics': 'Digital Twin & ESG',
  'AI Copilot': 'AI & Forecasting',
};

const PASTEL_COLORS = [
  'is--cyan',
  'is--pink',
  'is--yellow',
  'is--periwinkle',
  'is--orange',
];

function DynamicIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (!Icon) {
    const Fallback = LucideIcons.Sparkles;
    return <Fallback size={size} />;
  }
  return <Icon size={size} />;
}

export function FeaturesGrid() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Features');

  const filteredFeatures = FEATURES.filter((f) => {
    if (selectedCategory === 'All Features') return true;
    return FEATURE_CATEGORIES[f.title] === selectedCategory;
  });

  return (
    <section className={styles.section} id="features">
      <div className="u-container">
        {/* Section Header */}
        <div className={styles.header}>
          <Badge variant="black">✦ COMPLETE 15-PILLAR ARCHITECTURE</Badge>
          <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            Built for Systemic Scale.
          </h2>
          <HandwrittenNote rotate={1.5} size="big" style={{ color: 'var(--sb-violet)' }}>
            Every capability engineered for zero food loss.
          </HandwrittenNote>
        </div>

        {/* Category Filter Pills */}
        <div className={styles.categoryFilters}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.filterBtn} ${selectedCategory === cat ? styles.activeFilter : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 15 Feature Cards Grid */}
        <div className={styles.grid}>
          {filteredFeatures.map((feature, idx) => {
            const colorClass = PASTEL_COLORS[idx % PASTEL_COLORS.length];
            const cat = FEATURE_CATEGORIES[feature.title] || 'Intelligence';
            return (
              <div
                key={feature.title}
                className={`${styles.card} ${colorClass}`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconBox}>
                    <DynamicIcon name={feature.icon} size={22} />
                  </div>
                  <Badge variant="black">{cat.toUpperCase()}</Badge>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <p className={styles.cardDesc}>{feature.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.footerTag}>SAVEBiET Engine</span>
                  <span className={styles.footerArrow}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
