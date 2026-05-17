'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete } from 'lucide-react';
import { useBranding, brandStyle } from '@/lib/workforce/use-branding';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

export default function EmployeeLoginPage() {
  const [digits, setDigits] = useState([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake]   = useState(false);
  const router = useRouter();
  const branding = useBranding();

  const PIN_LENGTH = 4;

  async function submitPin(pin) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        router.push('/employee');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid PIN');
        setShake(true);
        setDigits([]);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Connection error');
      setDigits([]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(k) {
    if (loading || shake) return;
    if (k === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    const next = [...digits, String(k)];
    setDigits(next);
    if (next.length === PIN_LENGTH) submitPin(next.join(''));
  }

  const portalName = branding.name || 'Employee Portal';
  const initial    = portalName.trim().charAt(0).toUpperCase();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-slate-50"
      style={brandStyle(branding)}
    >
      <div className="w-full max-w-xs space-y-8">

        {/* Logo / name */}
        <div className="flex flex-col items-center gap-3">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={portalName} className="h-10 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {initial}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-slate-900 text-xl font-bold">{portalName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Enter your PIN to sign in</p>
          </div>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border-2 transition-all duration-150"
              style={
                digits.length > i
                  ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
                  : { borderColor: '#cbd5e1' }
              }
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-500 -mt-4">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => {
            if (k === null) return <div key={i} />;
            return (
              <button
                key={i}
                onClick={() => handleKey(k)}
                disabled={loading}
                className="h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm disabled:opacity-40"
              >
                {k === 'del' ? <Delete className="w-5 h-5 mx-auto text-slate-400" /> : k}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
