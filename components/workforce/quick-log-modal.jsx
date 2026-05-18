'use client';

import { useState } from 'react';
import { ThumbsUp, AlertTriangle, X, Loader2, Award, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const KIND_CONFIG = {
  praise:       { label: 'Praise',             color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  concern:      { label: 'Concern',            color: 'bg-amber-50 border-amber-300 text-amber-700' },
  coaching:     { label: 'Coaching',           color: 'bg-blue-50 border-blue-300 text-blue-700' },
  disciplinary: { label: 'Disciplinary action', color: 'bg-red-50 border-red-300 text-red-700' },
};

const PRAISE_PRESETS = [
  { value: 'reliability', label: 'Reliable / on time',  message: 'Showed up on time and got the job done. Thank you!' },
  { value: 'safety',      label: 'Safety-first',        message: 'Took the safety-first approach. Appreciate it.' },
  { value: 'teamwork',    label: 'Helped a teammate',   message: 'Stepped up to help a teammate today.' },
  { value: 'quality',     label: 'Quality work',        message: 'Quality of work was top-notch.' },
  { value: 'attitude',    label: 'Great attitude',      message: 'Brought great energy to the team today.' },
];

const CONCERN_PRESETS = [
  { category: 'attitude',      title: 'Attitude / behavior issue' },
  { category: 'quality',       title: 'Quality of work concern' },
  { category: 'safety',        title: 'Safety concern' },
  { category: 'communication', title: 'Communication issue' },
  { category: 'attendance',    title: 'Attendance concern' },
];

export function QuickLogModal({ open, onClose, employeeId, employeeName, onLogged }) {
  const [kind, setKind] = useState(null);
  const [praiseValue, setPraiseValue] = useState('reliability');
  const [message, setMessage] = useState('');
  const [concernCategory, setConcernCategory] = useState('attitude');
  const [concernTitle, setConcernTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  function reset() {
    setKind(null); setPraiseValue('reliability'); setMessage('');
    setConcernCategory('attitude'); setConcernTitle(''); setError(null);
  }

  function close() { reset(); onClose(); }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      if (kind === 'praise') {
        const preset = PRAISE_PRESETS.find((p) => p.value === praiseValue);
        const finalMessage = message.trim() || preset?.message || 'Nice work!';
        const res = await fetch('/api/workforce/recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_employee_id: employeeId, title: preset?.label ?? 'Recognition', message: finalMessage, value: praiseValue, is_public: true }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed');
      } else {
        const preset = CONCERN_PRESETS.find((p) => p.category === concernCategory);
        const finalTitle = concernTitle.trim() || preset?.title || 'Concern';
        const finalMessage = message.trim();
        if (!finalMessage) { setError('Description required'); setSubmitting(false); return; }
        const res = await fetch('/api/workforce/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_id: employeeId, case_type: kind === 'concern' ? 'concern' : kind, severity: kind === 'disciplinary' ? 'high' : kind === 'coaching' ? 'med' : 'low', category: concernCategory, title: finalTitle, description: finalMessage, visible_to_employee: true }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed');
      }
      onLogged?.();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Log behavior</h3>
            <p className="text-xs text-gray-500 mt-0.5">{employeeName}</p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        {!kind ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600 mb-3">What are you logging?</p>
            {[
              { k: 'praise', Icon: ThumbsUp, color: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100', textColor: 'text-emerald-600', titleColor: 'text-emerald-800', descColor: 'text-emerald-700', title: 'Praise / kudos', desc: 'Recognize good work — visible to the team.' },
              { k: 'concern', Icon: MessageSquare, color: 'border-amber-200 bg-amber-50 hover:bg-amber-100', textColor: 'text-amber-600', titleColor: 'text-amber-800', descColor: 'text-amber-700', title: 'Concern', desc: 'Note a small issue. Logged but not formal.' },
              { k: 'coaching', Icon: Award, color: 'border-blue-200 bg-blue-50 hover:bg-blue-100', textColor: 'text-blue-600', titleColor: 'text-blue-800', descColor: 'text-blue-700', title: 'Coaching', desc: 'Plan a sit-down conversation. Tracked + due date.' },
              { k: 'disciplinary', Icon: AlertTriangle, color: 'border-red-200 bg-red-50 hover:bg-red-100', textColor: 'text-red-600', titleColor: 'text-red-800', descColor: 'text-red-700', title: 'Disciplinary action', desc: 'Formal write-up. Goes in the file.' },
            ].map(({ k, Icon, color, textColor, titleColor, descColor, title, desc }) => (
              <button key={k} onClick={() => setKind(k)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${color}`}>
                <Icon className={`w-6 h-6 ${textColor}`} />
                <div>
                  <p className={`font-semibold ${titleColor}`}>{title}</p>
                  <p className={`text-xs ${descColor}`}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : kind === 'praise' ? (
          <div className="p-5 space-y-3">
            <button onClick={() => setKind(null)} className="text-xs text-gray-500 hover:text-gray-700">&larr; Back</button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select value={praiseValue} onChange={(e) => setPraiseValue(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                {PRAISE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-gray-400 text-xs">(optional)</span></label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={PRAISE_PRESETS.find((p) => p.value === praiseValue)?.message} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={close} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={submit} disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Send praise
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <button onClick={() => setKind(null)} className="text-xs text-gray-500 hover:text-gray-700">&larr; Back</button>
            <div className={cn('rounded-lg border p-2 text-xs', KIND_CONFIG[kind].color)}>
              Logging as: <strong>{KIND_CONFIG[kind].label}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={concernCategory} onChange={(e) => setConcernCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                {CONCERN_PRESETS.map((p) => <option key={p.category} value={p.category}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-gray-400 text-xs">(optional)</span></label>
              <input value={concernTitle} onChange={(e) => setConcernTitle(e.target.value)} placeholder={CONCERN_PRESETS.find((p) => p.category === concernCategory)?.title} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What happened? <span className="text-red-500">*</span></label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe the incident, including dates, context, and any direct quotes." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={close} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={submit} disabled={submitting} className={cn('px-5 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 disabled:opacity-50', kind === 'disciplinary' ? 'bg-red-600 hover:bg-red-700' : kind === 'coaching' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700')}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Log {KIND_CONFIG[kind].label.toLowerCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
