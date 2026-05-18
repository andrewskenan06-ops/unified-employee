'use client';

import { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateSafe } from '@/lib/dates';

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  });
}

export function DailyApprovalCard({ entry, onResolved }) {
  const [mode, setMode] = useState('idle');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isDisputed = !!entry.disputed_at && !entry.dispute_resolved_at;

  async function send(action) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/workforce/daily-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entry_id: entry.id,
          reason: action === 'dispute' ? reason.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed');
        return;
      }
      onResolved?.();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5',
      isDisputed ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', isDisputed ? 'bg-orange-100' : 'bg-blue-100')}>
          {isDisputed
            ? <AlertTriangle className="w-5 h-5 text-orange-600" />
            : <Clock className="w-5 h-5 text-blue-600" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {isDisputed ? "Disputed — waiting on manager" : "Approve yesterday's time"}
          </p>
          <p className="text-xs text-gray-600">
            {formatDateSafe(entry.entry_date, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-baseline justify-between gap-3 mb-2 pb-2 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-900 tabular-nums">
            {fmtTime(entry.clock_in_time)} <span className="text-gray-400 font-normal">→</span> {fmtTime(entry.clock_out_time)}
          </span>
          <span className="text-lg font-bold text-gray-900 tabular-nums whitespace-nowrap">
            {Number(entry.total_hours).toFixed(2)}h
          </span>
        </div>
        <div className="flex items-baseline justify-between text-xs text-gray-500">
          <span>Regular</span>
          <span className="tabular-nums">{Number(entry.regular_hours).toFixed(2)}h</span>
        </div>
        {Number(entry.overtime_hours) > 0 && (
          <div className="flex items-baseline justify-between mt-1 text-xs text-amber-700">
            <span>Overtime</span>
            <span className="tabular-nums">{Number(entry.overtime_hours).toFixed(2)}h</span>
          </div>
        )}
        {Number(entry.break_hours) > 0 && (
          <div className="flex items-baseline justify-between mt-1 text-xs text-gray-500">
            <span>Lunch</span>
            <span className="tabular-nums">{Number(entry.break_hours).toFixed(2)}h</span>
          </div>
        )}
      </div>

      {isDisputed ? (
        <div className="text-sm">
          <p className="text-orange-800 font-medium mb-1">Your reason:</p>
          <p className="text-orange-700 italic">"{entry.dispute_reason}"</p>
          <p className="text-xs text-orange-600 mt-2">Your manager will review and either fix the hours or get in touch.</p>
        </div>
      ) : mode === 'idle' ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => send('approve')}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Looks right — approve
          </button>
          <button
            onClick={() => setMode('disputing')}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            There's a problem
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's wrong? (e.g., I worked until 6pm, not 5pm)"
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => send('dispute')}
              disabled={submitting || reason.trim().length < 3}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Submit'}
            </button>
            <button
              onClick={() => { setMode('idle'); setReason(''); setError(null); }}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
