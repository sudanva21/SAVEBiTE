'use client';

import React, { useEffect, useState } from 'react';

export function LoadingExperience() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('savebiet_loaded')) {
        setShouldRender(false);
        return;
      }
    } catch {
      // Safe fallback
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('savebiet_loaded', 'true');
        }
      } catch {}
      setTimeout(() => setShouldRender(false), 500);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-overlay ${isLoaded ? 'is--loaded' : ''}`}
      onClick={() => setShouldRender(false)}
      style={{ cursor: 'pointer' }}
    >
      <div className="transition__logo-mark">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <span style={{ fontSize: '3.5em' }}>✦</span>
          <h1 className="transition__title">SAVEBiET</h1>
        </div>
        <div className="transition__badge">AI Food Lifecycle & Redistribution</div>
        <div className="transition__progress">
          <div className="transition__progress-bar" />
        </div>
      </div>
    </div>
  );
}
