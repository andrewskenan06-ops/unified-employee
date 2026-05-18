'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Check,
  AlertCircle,
  Users,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BENEFIT_LABELS = {
  health: 'Health insurance',
  dental: 'Dental',
  vision: 'Vision',
  '401k': '401(k)',
  roth_401k: 'Roth 401(k)',
  life: 'Life insurance',
  std: 'Short-term disability',
  ltd: 'Long-term disability',
  hsa: 'HSA',
  fsa: 'FSA',
  other: 'Other',
};

const COVERAGE_LABELS = {
  employee: 'Just me',
  employee_spouse: 'Me + spouse',
  employee_children: 'Me + children',
  family: 'Family',
};

const MIN_DEPS = {
  employee: 0,
  employee_spouse: 1,
  employee_children: 1,
  family: 2,
};

export default function EnrollPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <EnrollWizardInner />
    </Suspense>
  );
}

function EnrollWizardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialType = params.get('type') ?? null;

  const [step, setStep] = useState(initialType ? 1 : 0);
  const [plans, setPlans] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [activeBenefitTypes, setActiveBenefitTypes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [benefitType, setBenefitType] = useState(initialType);
  const [planId, setPlanId] = useState(null);
  const [tierId, setTierId] = useState(null);
  const [selectedDeps, setSelectedDeps] = useState(new Set());
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/workforce/benefit-plans?active=true').then((r) =>
        r.ok ? r.json() : { plans: [] }
      ),
      fetch('/api/workforce/dependents').then((r) =>
        r.ok ? r.json() : { dependents: [] }
      ),
      fetch('/api/workforce/benefit-enrollments').then((r) =>
        r.ok ? r.json() : { enrollments: [] }
      ),
    ]).then(([p, d, e]) => {
      setPlans(p.plans ?? []);
      setDependents(d.dependents ?? []);
      const active = new Set();
      for (const enr of e.enrollments ?? []) {
        if (enr.benefit_type) active.add(enr.benefit_type);
      }
      setActiveBenefitTypes(active);
      setLoading(false);
    });
  }, []);

  const plan = useMemo(
    () => plans.find((p) => p.id === planId) ?? null,
    [plans, planId]
  );
  const tier = useMemo(
    () => plan?.tiers.find((t) => t.id === tierId) ?? null,
    [plan, tierId]
  );

  const plansByType = useMemo(() => {
    const out = {};
    for (const p of plans) {
      if (!out[p.benefit_type]) out[p.benefit_type] = [];
      out[p.benefit_type].push(p);
    }
    return out;
  }, [plans]);

  useEffect(() => {
    if (initialType && plans.length > 0) {
      setBenefitType(initialType);
      setStep(1);
    }
  }, [plans.length]);

  function next() {
    setStep((s) => Math.min(s + 1, 4));
    setError(null);
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
    setError(null);
  }

  const minDeps = tier ? (MIN_DEPS[tier.coverage_level] ?? 0) : 0;
  const maxDeps = tier?.coverage_level === 'employee' ? 0 : 99;

  function canProceedFromStep() {
    if (step === 0) return benefitType !== null;
    if (step === 1) return planId !== null;
    if (step === 2) return tierId !== null;
    if (step === 3) {
      if (!tier) return false;
      const n = selectedDeps.size;
      return n >= minDeps && n <= maxDeps;
    }
    if (step === 4) return signature.trim().length >= 3;
    return false;
  }

  async function submit() {
    if (!plan || !tier || !signature.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/workforce/benefit-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          plan_id: plan.id,
          tier_id: tier.id,
          dependent_ids: [...selectedDeps],
          signature_text: signature.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed');
        setSubmitting(false);
        return;
      }
      router.push('/employee/benefits?submitted=1');
    } catch {
      setError('Network error');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/employee/benefits"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to benefits
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" /> Enroll in benefits
        </h1>
        <Stepper current={step} />
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
        {/* Step 0 — benefit type */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">
              What would you like to enroll in?
            </h2>
            <p className="text-sm text-slate-500">
              Pick a benefit type to see the plans your company offers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {Object.entries(plansByType).map(([type, list]) => {
                const already = activeBenefitTypes.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={already || list.length === 0}
                    onClick={() => {
                      setBenefitType(type);
                      setPlanId(null);
                      setTierId(null);
                      setSelectedDeps(new Set());
                      next();
                    }}
                    className={cn(
                      'text-left p-4 rounded-xl border transition-all',
                      already
                        ? 'opacity-50 cursor-not-allowed bg-slate-50'
                        : benefitType === type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <p className="font-semibold text-slate-900">
                      {BENEFIT_LABELS[type] ?? type}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {already
                        ? 'Already enrolled'
                        : `${list.length} plan${list.length === 1 ? '' : 's'} available`}
                    </p>
                  </button>
                );
              })}
            </div>
            {Object.keys(plansByType).length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">
                No benefit plans are currently offered.
              </div>
            )}
          </div>
        )}

        {/* Step 1 — choose plan */}
        {step === 1 && benefitType && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">
              Choose a{' '}
              {(BENEFIT_LABELS[benefitType] ?? benefitType).toLowerCase()} plan
            </h2>
            <div className="grid gap-2 mt-2">
              {(plansByType[benefitType] ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlanId(p.id);
                    setTierId(null);
                  }}
                  className={cn(
                    'text-left p-4 rounded-xl border transition-all',
                    planId === p.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.carrier}
                        {p.network_type ? ` • ${p.network_type}` : ''}
                      </p>
                      {p.deductible_individual && (
                        <p className="text-xs text-slate-600 mt-1.5">
                          Deductible: ${p.deductible_individual} ind /{' '}
                          {p.deductible_family ?? '—'} fam
                        </p>
                      )}
                    </div>
                    {p.summary_url && (
                      <a
                        href={p.summary_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" /> SBC
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — choose tier / coverage level */}
        {step === 2 && plan && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">
              Who do you want to cover?
            </h2>
            <p className="text-sm text-slate-500">Per pay period costs:</p>
            <div className="grid gap-2 mt-2">
              {plan.tiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTierId(t.id);
                    setSelectedDeps(new Set());
                  }}
                  className={cn(
                    'text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3',
                    tierId === t.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {COVERAGE_LABELS[t.coverage_level] ?? t.coverage_level}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Total ${Number(t.total_premium).toFixed(2)} / period —
                      company pays ${Number(t.company_contribution).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    ${Number(t.employee_contribution).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — dependents */}
        {step === 3 && tier && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              {tier.coverage_level === 'employee'
                ? 'No dependents needed'
                : 'Who are you covering?'}
            </h2>
            {tier.coverage_level === 'employee' ? (
              <p className="text-sm text-slate-500">
                This tier covers just you. Click Next to review.
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Pick {minDeps === 1 ? '1 or more' : `${minDeps}+`} dependent(s)
                  for this coverage tier.
                  {dependents.length === 0 && (
                    <>
                      {' '}You haven&apos;t added any yet —{' '}
                      <Link
                        href="/employee/benefits"
                        className="text-indigo-600 hover:underline"
                      >
                        add them on the benefits page
                      </Link>
                      .
                    </>
                  )}
                </p>
                <div className="space-y-2 mt-2">
                  {dependents.map((d) => {
                    const checked = selectedDeps.has(d.id);
                    return (
                      <label
                        key={d.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                          checked
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(selectedDeps);
                            if (e.target.checked) next.add(d.id);
                            else next.delete(d.id);
                            setSelectedDeps(next);
                          }}
                          className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {d.first_name} {d.last_name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {d.relationship.replace('_', ' ')} • DOB{' '}
                            {new Date(d.date_of_birth).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4 — review & sign */}
        {step === 4 && plan && tier && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Review and sign</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <Row label="Plan" value={plan.name} />
              <Row label="Carrier" value={plan.carrier ?? '—'} />
              <Row
                label="Coverage"
                value={
                  COVERAGE_LABELS[tier.coverage_level] ?? tier.coverage_level
                }
              />
              {selectedDeps.size > 0 && (
                <Row
                  label="Dependents"
                  value={dependents
                    .filter((d) => selectedDeps.has(d.id))
                    .map((d) => `${d.first_name} ${d.last_name}`)
                    .join(', ')}
                />
              )}
              <Row label="Pay period" value={tier.pay_period} />
              <div className="border-t border-slate-200 pt-2 mt-2">
                <Row
                  label="Total premium"
                  value={`$${Number(tier.total_premium).toFixed(2)}`}
                />
                <Row
                  label="Company pays"
                  value={`$${Number(tier.company_contribution).toFixed(2)}`}
                />
                <Row
                  label="You pay"
                  value={`$${Number(tier.employee_contribution).toFixed(2)}`}
                  bold
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type your full name to sign
              </label>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="First Last"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                By signing, you authorize the per-paycheck deduction shown
                above.
              </p>
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex justify-between items-center pt-5 mt-5 border-t border-slate-100">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canProceedFromStep()}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || !canProceedFromStep()}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}{' '}
              Submit enrollment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }) {
  const labels = ['Type', 'Plan', 'Tier', 'Dependents', 'Sign'];
  return (
    <div className="flex items-center gap-1.5 mt-3 overflow-x-auto">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors',
              i < current
                ? 'bg-indigo-600 text-white'
                : i === current
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              'text-xs',
              i <= current ? 'text-slate-900 font-medium' : 'text-slate-400'
            )}
          >
            {l}
          </span>
          {i < labels.length - 1 && (
            <div className="w-4 h-px bg-slate-200 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-center text-sm py-0.5">
      <span className="text-slate-600">{label}</span>
      <span className={cn('text-slate-900 tabular-nums', bold && 'font-bold text-base')}>
        {value}
      </span>
    </div>
  );
}
