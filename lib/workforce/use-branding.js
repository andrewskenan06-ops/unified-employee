'use client';

import { useState, useEffect } from 'react';

const DEFAULT_PRIMARY = '#4f46e5';

export function useBranding() {
  const [branding, setBranding] = useState({ name: '', logo_url: null, primary: DEFAULT_PRIMARY });

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((settings) => {
        if (!settings) return;
        setBranding((b) => ({
          ...b,
          name: settings.company_name || b.name,
          logo_url: settings.logo_url || null,
          primary: settings.brand_color || DEFAULT_PRIMARY,
        }));
      })
      .catch(() => {});
  }, []);

  return branding;
}

export function brandStyle(branding) {
  const primary = branding.primary || DEFAULT_PRIMARY;
  const r = parseInt(primary.slice(1, 3), 16);
  const g = parseInt(primary.slice(3, 5), 16);
  const b = parseInt(primary.slice(5, 7), 16);
  return {
    '--brand-primary': primary,
    '--brand-primary-soft': `rgba(${r}, ${g}, ${b}, 0.1)`,
  };
}
