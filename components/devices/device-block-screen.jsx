'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const ADMIN_MESSAGE = {
  not_paired: "This device isn't authorized to run as a clock terminal.",
  wrong_role: 'This device is paired, but not as a clock terminal.',
  inactive:   'This device has been deactivated. Reactivate it from /admin/devices.',
};

const GENERIC_MESSAGE = "This device isn't ready for use yet. Please ask a manager to set it up.";

export function DeviceBlockScreen({ uuid, reason, requiredRole }) {
  const [auth, setAuth] = useState({ phase: 'loading' });

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const role = data?.role;
        setAuth({ phase: role === 'owner' || role === 'admin' ? 'admin' : 'not_admin' });
      })
      .catch(() => setAuth({ phase: 'not_admin' }));
  }, []);

  if (auth.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
        Checking device…
      </div>
    );
  }

  if (auth.phase === 'not_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="max-w-sm w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-5 text-center">
          <div className="w-16 h-16 mx-auto bg-red-500/15 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold">Not available</h1>
          <p className="text-sm text-gray-300">{GENERIC_MESSAGE}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-5">
        <div className="w-16 h-16 mx-auto bg-red-500/15 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-sm text-gray-300">{ADMIN_MESSAGE[reason]}</p>
        </div>

        {reason === 'not_paired' ? (
          <FirstPairForm uuid={uuid} requiredRole={requiredRole} />
        ) : (
          <div className="text-xs text-gray-400 text-center">
            Resolve this from <span className="font-mono">/admin/devices</span>.
          </div>
        )}

        <div className="text-left bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-xs space-y-1">
          <div className="text-gray-400">This device&apos;s ID</div>
          <div className="font-mono text-gray-100 break-all">{uuid || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function FirstPairForm({ uuid, requiredRole }) {
  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!label.trim() || !uuid) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, label: label.trim(), location: location.trim() || null, role: requiredRole }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Pair failed');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pair failed');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-gray-700 pt-4">
      <div className="text-sm text-gray-200 font-medium">
        Pair this device as a <span className="font-mono text-blue-300">{requiredRole}</span>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Label *</label>
        <input type="text" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Front counter tablet" className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Location (optional)</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cummin yard, lobby" className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <button type="submit" disabled={busy || !label.trim()} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium">
        {busy ? 'Pairing…' : 'Pair this device'}
      </button>
      <p className="text-[11px] text-gray-500 text-center">Admin sign-in required to pair or re-pair a device.</p>
    </form>
  );
}

export function DeviceLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
      Checking device…
    </div>
  );
}
