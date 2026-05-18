'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Loader2, X, Trash2, Save, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELATIONSHIP_LABEL = {
  spouse: 'Spouse',
  domestic_partner: 'Domestic partner',
  child: 'Child',
  stepchild: 'Stepchild',
  foster_child: 'Foster child',
  other: 'Other',
};

const RELATIONSHIP_BADGE = {
  spouse: 'bg-rose-50 text-rose-700 border-rose-200',
  domestic_partner: 'bg-rose-50 text-rose-700 border-rose-200',
  child: 'bg-sky-50 text-sky-700 border-sky-200',
  stepchild: 'bg-sky-50 text-sky-700 border-sky-200',
  foster_child: 'bg-sky-50 text-sky-700 border-sky-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const EMPTY_FORM = {
  relationship: 'spouse',
  first_name: '',
  last_name: '',
  middle_name: '',
  date_of_birth: '',
  gender: '',
  ssn_last4: '',
  is_disabled: false,
  is_full_time_student: false,
};

export function DependentsSection() {
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/workforce/dependents');
      if (res.ok) {
        const data = await res.json();
        setDeps(data.dependents ?? []);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEdit(d) {
    setEditingId(d.id);
    setForm({
      relationship: d.relationship,
      first_name: d.first_name,
      last_name: d.last_name,
      middle_name: d.middle_name ?? '',
      date_of_birth: d.date_of_birth.slice(0, 10),
      gender: d.gender ?? '',
      ssn_last4: d.ssn_last4 ?? '',
      is_disabled: d.is_disabled,
      is_full_time_student: d.is_full_time_student,
    });
    setShowForm(true);
    setError(null);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth) {
      setError('First name, last name, and date of birth are required.');
      return;
    }
    if (form.ssn_last4 && !/^\d{4}$/.test(form.ssn_last4)) {
      setError('SSN last 4 must be 4 digits.');
      return;
    }
    setSaving(true);
    setError(null);

    const body = {
      relationship: form.relationship,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name.trim() || undefined,
      date_of_birth: form.date_of_birth,
      gender: form.gender || undefined,
      ssn_last4: form.ssn_last4 || undefined,
      is_disabled: form.is_disabled,
      is_full_time_student: form.is_full_time_student,
    };
    if (editingId) { body.action = 'update'; body.id = editingId; }

    const res = await fetch('/api/workforce/dependents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Failed to save');
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Remove this dependent?')) return;
    await fetch('/api/workforce/dependents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', id }),
    });
    load();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">My family</h2>
        </div>
        <button onClick={openCreate} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add dependent
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Spouses, domestic partners, and children. Used during benefits enrollment to determine coverage tiers.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : deps.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">No dependents on file.</div>
      ) : (
        <div className="space-y-2">
          {deps.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', RELATIONSHIP_BADGE[d.relationship] ?? 'bg-slate-100 text-slate-700 border-slate-200')}>
                  {RELATIONSHIP_LABEL[d.relationship] ?? d.relationship}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {d.first_name} {d.middle_name ? d.middle_name + ' ' : ''}{d.last_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    DOB {new Date(d.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {d.is_full_time_student && ' • Full-time student'}
                    {d.is_disabled && ' • Disabled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(d)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(d.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">{editingId ? 'Edit dependent' : 'Add dependent'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
                <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                  {Object.entries(RELATIONSHIP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First name</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last name</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                    <option value="">—</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="nonbinary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SSN (last 4)</label>
                  <input value={form.ssn_last4} onChange={(e) => setForm({ ...form, ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="••••" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_full_time_student} onChange={(e) => setForm({ ...form, is_full_time_student: e.target.checked })} className="rounded border-slate-300 text-indigo-600" />
                  <span className="text-sm text-slate-700">Full-time student (extends child eligibility)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_disabled} onChange={(e) => setForm({ ...form, is_disabled: e.target.checked })} className="rounded border-slate-300 text-indigo-600" />
                  <span className="text-sm text-slate-700">Disabled (no age limit for coverage)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
