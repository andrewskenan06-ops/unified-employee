'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PlayCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Volume2,
  Video,
  FileText,
  ChevronRight,
  Loader2,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BriefingVideoPlayer } from '@/components/workforce/briefing-video-player';

export default function BriefingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <BriefingsInner />
    </Suspense>
  );
}

function BriefingsInner() {
  const searchParams = useSearchParams();
  const clockOutContext = searchParams.get('context') === 'clock_out';

  const [briefings, setBriefings] = useState([]);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBriefingId, setActiveBriefingId] = useState(null);

  const load = useCallback(() => {
    const url = clockOutContext
      ? '/api/workforce/briefings?context=clock_out'
      : '/api/workforce/briefings';

    Promise.all([
      fetch(url).then((r) => (r.ok ? r.json() : { briefings: [] })),
      fetch('/api/workforce/branding').then((r) => (r.ok ? r.json() : null)),
    ]).then(([b, br]) => {
      setBriefings(b.briefings ?? []);
      setBranding(br);
      setLoading(false);
    });
  }, [clockOutContext]);

  useEffect(() => {
    load();
  }, [load]);

  function handleComplete() {
    setActiveBriefingId(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const required = briefings.filter((b) => b.is_required && !b.completed_at);
  const completed = briefings.filter((b) => b.completed_at);
  const incomplete = briefings.filter((b) => !b.completed_at);

  const activeBriefing = activeBriefingId
    ? briefings.find((b) => b.id === activeBriefingId) ?? null
    : null;

  return (
    <div className="space-y-5 pb-20 lg:pb-0 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Briefings</h1>

      {/* Required-before-clock-in banner */}
      {required.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {required.length} briefing{required.length === 1 ? '' : 's'}{' '}
              required before clock in
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complete the highlighted briefings below to unlock clocking in.
            </p>
          </div>
        </div>
      )}

      {/* Mission / values banner */}
      {branding?.mission && (
        <div
          className="rounded-2xl p-4 border"
          style={{
            backgroundColor: 'var(--brand-primary-soft, #eef2ff)',
            borderColor: 'var(--brand-primary-border, #c7d2fe)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--brand-primary, #4f46e5)' }}
          >
            {branding.name ?? 'Our mission'}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {branding.mission}
          </p>
          {branding.values && (
            <p className="text-xs text-slate-500 mt-2 italic">{branding.values}</p>
          )}
        </div>
      )}

      {/* Inline player */}
      {activeBriefing && (
        <BriefingPlayer
          briefing={activeBriefing}
          onDone={handleComplete}
          onClose={() => setActiveBriefingId(null)}
        />
      )}

      {/* Incomplete / required briefings */}
      {incomplete.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            To complete
          </h2>
          <div className="space-y-2">
            {incomplete.map((b) => (
              <BriefingRow
                key={b.id}
                briefing={b}
                isActive={activeBriefingId === b.id}
                onClick={() =>
                  setActiveBriefingId(
                    activeBriefingId === b.id ? null : b.id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed briefings */}
      {completed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completed
          </h2>
          <div className="space-y-2">
            {completed.map((b) => (
              <BriefingRow
                key={b.id}
                briefing={b}
                isActive={activeBriefingId === b.id}
                onClick={() =>
                  setActiveBriefingId(
                    activeBriefingId === b.id ? null : b.id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {briefings.length === 0 && (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200/70">
          <PlayCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No briefings assigned</p>
          <p className="text-sm mt-1">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- BriefingRow ---------- */

function contentTypeIcon(type) {
  if (type === 'video') return Video;
  if (type === 'audio') return Volume2;
  if (type === 'document') return FileText;
  return PlayCircle;
}

function BriefingRow({ briefing, isActive, onClick }) {
  const done = Boolean(briefing.completed_at);
  const Icon = contentTypeIcon(briefing.content_type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-3',
        done
          ? 'bg-emerald-50 border-emerald-200'
          : briefing.is_required
          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
          : 'bg-white border-slate-200 hover:bg-slate-50',
        isActive && !done && 'ring-2 ring-indigo-400 ring-offset-1'
      )}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {done ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : briefing.is_locked ? (
          <Lock className="w-5 h-5 text-slate-300" />
        ) : (
          <Icon
            className={cn(
              'w-5 h-5',
              briefing.is_required ? 'text-amber-600' : 'text-indigo-500'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-sm truncate',
            done ? 'text-emerald-900' : 'text-slate-900'
          )}
        >
          {briefing.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {briefing.duration_minutes && (
            <span className="flex items-center gap-0.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {briefing.duration_minutes}m
            </span>
          )}
          {briefing.is_required && !done && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
              Required
            </span>
          )}
          {done && briefing.completed_at && (
            <span className="text-xs text-emerald-600">
              Done{' '}
              {new Date(briefing.completed_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {!done && !briefing.is_locked && (
        <ChevronRight
          className={cn(
            'w-4 h-4 flex-shrink-0 transition-transform',
            isActive ? 'rotate-90 text-indigo-500' : 'text-slate-300'
          )}
        />
      )}
    </button>
  );
}

/* ---------- BriefingPlayer ---------- */

function BriefingPlayer({ briefing, onDone, onClose }) {
  const [phase, setPhase] = useState('watching'); // watching | interaction | submitting | done | error
  const [watchPct, setWatchPct] = useState(0);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checklistChecked, setChecklistChecked] = useState({});
  const [responseText, setResponseText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const startCalledRef = useRef(false);

  // Call 'start' action once on mount
  useEffect(() => {
    if (startCalledRef.current) return;
    startCalledRef.current = true;
    fetch(`/api/workforce/briefings/${briefing.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    }).catch(() => {});
  }, [briefing.id]);

  const interactionType = briefing.interaction_type; // 'acknowledge' | 'quiz' | 'checklist' | 'response' | null
  const hasVideo =
    briefing.content_type === 'video' &&
    (briefing.video_url || briefing.playback_id);
  const hasAudio =
    briefing.content_type === 'audio' && briefing.video_url;
  const hasMedia = hasVideo || hasAudio;

  // Determine if user can proceed past the watching phase
  const videoComplete = !hasMedia || watchPct >= 0.85;

  function handleTimeUpdate(current, duration) {
    if (duration > 0) setWatchPct(current / duration);
  }

  function handleVideoEnded() {
    setWatchPct(1);
  }

  function handleMediaStarted() {
    setStarted(true);
  }

  function proceedToInteraction() {
    if (interactionType) {
      setPhase('interaction');
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setPhase('submitting');
    setErrorMsg(null);
    try {
      const payload = { action: 'submit' };
      if (interactionType === 'quiz') {
        payload.quiz_answers = answers;
      } else if (interactionType === 'checklist') {
        payload.checklist_checked = checklistChecked;
      } else if (interactionType === 'response') {
        payload.response_text = responseText;
      }
      const res = await fetch(
        `/api/workforce/briefings/${briefing.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Submission failed');
        setPhase('error');
        return;
      }
      setPhase('done');
      setTimeout(() => onDone(), 1200);
    } catch {
      setErrorMsg('Network error — please try again.');
      setPhase('error');
    }
  }

  const quizQuestions = briefing.quiz_questions ?? [];
  const checklistItems = briefing.checklist_items ?? [];
  const allQuizAnswered =
    quizQuestions.length === 0 ||
    quizQuestions.every((q) => answers[q.id] != null);
  const allChecklistChecked =
    checklistItems.length === 0 ||
    checklistItems.every((item) => checklistChecked[item.id]);
  const responseReady = !responseText || responseText.trim().length >= 3;

  const canSubmitInteraction =
    interactionType === 'quiz'
      ? allQuizAnswered
      : interactionType === 'checklist'
      ? allChecklistChecked
      : interactionType === 'response'
      ? responseText.trim().length >= 3
      : true;

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-indigo-50">
        <p className="font-semibold text-slate-900 text-sm truncate">
          {briefing.title}
        </p>
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-700 ml-3 flex-shrink-0"
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Done state */}
        {phase === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-slate-900">Briefing complete!</p>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>{errorMsg}</p>
              <button
                onClick={() => setPhase(interactionType ? 'interaction' : 'watching')}
                className="mt-1 text-xs font-semibold text-red-700 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Submitting spinner */}
        {phase === 'submitting' && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Watching phase */}
        {(phase === 'watching' || phase === 'interaction') && (
          <>
            {/* Body text / document content */}
            {briefing.body && (
              <div className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed">
                <p>{briefing.body}</p>
              </div>
            )}

            {/* Video or audio */}
            {hasVideo && phase === 'watching' && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <BriefingVideoPlayer
                  videoUrl={briefing.video_url}
                  playbackId={briefing.playback_id}
                  className="w-full h-full"
                  autoPlay={false}
                  onEnded={handleVideoEnded}
                  onPlay={handleMediaStarted}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
            )}

            {hasAudio && phase === 'watching' && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                <audio
                  src={briefing.video_url}
                  controls
                  className="flex-1 h-10"
                  onPlay={handleMediaStarted}
                  onEnded={handleVideoEnded}
                  onTimeUpdate={(e) => {
                    const el = e.currentTarget;
                    if (el.duration > 0)
                      handleTimeUpdate(el.currentTime, el.duration);
                  }}
                />
              </div>
            )}

            {/* Watch progress bar */}
            {hasMedia && phase === 'watching' && watchPct > 0 && watchPct < 1 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round(watchPct * 100)}%` }}
                />
              </div>
            )}

            {/* Interaction: quiz */}
            {phase === 'interaction' && interactionType === 'quiz' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  Answer the questions below to complete this briefing.
                </p>
                {quizQuestions.map((q, qi) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-900">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-1">
                      {(q.options ?? []).map((opt, oi) => (
                        <label
                          key={oi}
                          className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                            answers[q.id] === oi
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id] === oi}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                            }
                            className="text-indigo-600"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interaction: checklist */}
            {phase === 'interaction' && interactionType === 'checklist' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  Check off each item to confirm you&apos;ve reviewed it.
                </p>
                <div className="space-y-2">
                  {checklistItems.map((item) => {
                    const checked = Boolean(checklistChecked[item.id]);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                          checked
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setChecklistChecked((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 w-4 h-4"
                        />
                        <span className="text-sm text-slate-800">
                          {item.text ?? item.label ?? item.item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interaction: response */}
            {phase === 'interaction' && interactionType === 'response' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  {briefing.response_prompt ??
                    'Write a brief response to confirm understanding.'}
                </p>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Your response…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                />
              </div>
            )}

            {/* Interaction: acknowledge */}
            {phase === 'interaction' && interactionType === 'acknowledge' && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                <p className="font-semibold mb-1">Acknowledgment required</p>
                <p>
                  By clicking &ldquo;Complete&rdquo; you confirm that you have
                  read and understood this briefing.
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer buttons */}
        {phase !== 'done' && phase !== 'submitting' && (
          <div className="flex justify-end pt-1">
            {phase === 'watching' ? (
              <button
                onClick={proceedToInteraction}
                disabled={!videoComplete}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40 flex items-center gap-1.5"
              >
                {interactionType ? (
                  <>
                    Continue <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Mark complete
                  </>
                )}
              </button>
            ) : phase === 'interaction' ? (
              <button
                onClick={handleSubmit}
                disabled={!canSubmitInteraction}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-40 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Complete
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
