'use client';

import { useState, useEffect } from 'react';

const DEFAULT_PRIMARY = '#023f62';
const DEFAULT_ACCENT  = '#00ce7c';

export function useBranding() {
  const [branding, setBranding] = useState({
    company_name: '',
    logo_url: null,
    primary: DEFAULT_PRIMARY,
    accent:  DEFAULT_ACCENT,
  });

  useEffect(() => {
    fetch('/api/admin/branding')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setBranding({
          company_name: data.company_name || 'Unified Employee',
          logo_url:     data.logo_url     || null,
          primary:      data.primary_color || DEFAULT_PRIMARY,
          accent:       data.accent_color  || DEFAULT_ACCENT,
        });
      })
      .catch(() => {});
  }, []);

  return branding;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function brandStyle(branding) {
  const primary = branding.primary || DEFAULT_PRIMARY;
  const accent  = branding.accent  || DEFAULT_ACCENT;
  const [pr, pg, pb] = hexToRgb(primary);
  const [ar, ag, ab] = hexToRgb(accent);
  return {
    // Employee portal vars
    '--brand-primary':      primary,
    '--brand-primary-soft': `rgba(${pr},${pg},${pb},0.1)`,
    '--brand-accent':       accent,
    '--brand-accent-soft':  `rgba(${ar},${ag},${ab},0.1)`,
    // Admin / clock terminal — override Tailwind theme vars so bg-primary/bg-accent cascade
    '--color-primary': primary,
    '--color-accent':  accent,
  };
}
