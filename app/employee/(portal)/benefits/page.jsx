'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Building2,
  DollarSign,
  Loader2,
  Shield,
  Eye,
  Plus,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DependentsSection } from '@/components/workforce/dependents-section';

const benefitIcons = {
  health: Heart,
  dental: Heart,
  vision: Eye,
  '401k': DollarSign,
  roth_401k: DollarSign,
  life: Shield,
  std: Shield,
  ltd: Shield,
  disability: Shield,
  hsa: DollarSign,
  fsa: DollarSign,
};

const benefitColors = {
  health: 'bg-rose-50 text-rose-700 border-rose-200',
  dental: 'bg-sky-50 text-sky-700 border-sky-200',
  vision: 'bg-purple-50 text-purple-700 border-purple-200',
  '401k': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  roth_401k: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  life: 'bg-amber-50 text-amber-700 border-amber-200',
  std: 'bg-blue-50 text-blue-700 border-blue-200',
  ltd: 'bg-blue-50 text-blue-700 border-blue-200',
  disability: 'bg-blue-50 text-blue-700 border-blue-200',
  hsa: 'bg-teal-50 text-teal-700 border-teal-200',
  fsa: 'bg-teal-50 text-teal-700 border-teal-200',
};

const COVERAGE_LABELS = {
  employee: 'Just me',
  employee_spouse: 'Me + spouse',
  employee_children: 'Me + children',
  family: 'Family',
};

export default function BenefitsPage() {
  const [legacy, setLegacy] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/workforce/benefits').then((r) =>
        r.ok ? r.json() : { benefits: [] }
      ),
      fetch('/api/workforce/benefit-enrollments').then((r) =>
        r.ok ? r.json() : { enrollments: [] }
      ),
    ]).then(([a, b]) => {
      setLegacy(a.benefits ?? []);
      setEnrollments(b.enrollments ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const active = enrollments.filter((e) => e.status === 'active');
  const pending = enrollments.filter((e) => e.status === 'pending');
  const legacyActive = legacy.filter((b) => b.status === 'active');

  const totalCompany =
    active.reduce((s, e) => s + Number(e.company_contribution), 0) +
    legacyActive.reduce((s, b) => s + Number(b.company_contribution), 0);
  const totalEmployee =
    active.reduce((s, e) => s + Number(e.employee_contribution), 0) +
    legacyActive.reduce((s, b) => s + Number(b.employee_contribution), 0);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900">Benefits</h1>
        <Link
          href="/employee/benefits/enroll"
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Enroll
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pending.length} enrollment{pending.length === 1 ? '' : 's'}{' '}
              pending review
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {pending.map((p) => p.plan_name).join(', ')} — your manager will
              approve shortly.
            </p>
          </div>
        </div>
      )}

      <DependentsSection />

      {(active.length > 0 || legacyActive.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
                Company pays
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              ${totalCompany.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-600">per pay period</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                You pay
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              ${totalEmployee.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500">per pay period</p>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your active enrollments
          </h2>
          <div className="space-y-2">
            {active.map((e) => {
              const Icon = benefitIcons[e.benefit_type] ?? Heart;
              const color =
                benefitColors[e.benefit_type] ??
                'bg-slate-50 text-slate-700 border-slate-200';
              return (
                <div key={e.id} className={cn('rounded-2xl border p-4', color)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                          {e.benefit_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-base">{e.plan_name}</p>
                      {e.carrier && (
                        <p className="text-xs opacity-70">{e.carrier}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        Coverage:{' '}
                        {COVERAGE_LABELS[e.coverage_level] ?? e.coverage_level}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] opacity-70 uppercase">
                        Per period
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        ${Number(e.employee_contribution).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {legacyActive.length > 0 && active.length === 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your benefits
          </h2>
          <div className="space-y-2">
            {legacyActive.map((b) => {
              const Icon = benefitIcons[b.benefit_type] ?? Heart;
              const color =
                benefitColors[b.benefit_type] ??
                'bg-slate-50 text-slate-700 border-slate-200';
              return (
                <div key={b.id} className={cn('rounded-2xl border p-4', color)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {b.benefit_type}
                    </span>
                  </div>
                  {b.plan_name && (
                    <p className="font-semibold">{b.plan_name}</p>
                  )}
                  {b.provider && (
                    <p className="text-xs opacity-70">{b.provider}</p>
                  )}
                  {b.coverage_level && (
                    <p className="text-xs opacity-70 mt-1">
                      Coverage: {b.coverage_level.replace('_', ' + ')}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between text-sm">
                    <div>
                      <p className="text-[10px] opacity-60">Company</p>
                      <p className="font-semibold tabular-nums">
                        ${Number(b.company_contribution).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] opacity-60">You</p>
                      <p className="font-semibold tabular-nums">
                        ${Number(b.employee_contribution).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {active.length === 0 && legacyActive.length === 0 && pending.length === 0 && (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200/70">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No benefits enrolled</p>
          <p className="text-sm mt-1 mb-4">
            Browse what your company offers and enroll today.
          </p>
          <Link
            href="/employee/benefits/enroll"
            className="inline-flex px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Start enrollment
          </Link>
        </div>
      )}
    </div>
  );
}
