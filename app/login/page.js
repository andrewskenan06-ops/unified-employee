"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setSession, setTenantId } from "@/lib/auth";

function extractYouTubeId(url) {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

function VideoSlide({ url, onEnded }) {
  const ytId = extractYouTubeId(url);

  useEffect(() => {
    if (!ytId) return;
    function onMessage(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "infoDelivery" && data.info?.playerState === 0) onEnded();
      } catch {}
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [ytId, onEnded]);

  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0`}
        className="w-full aspect-video rounded-xl"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );
  }
  return <video src={url} controls className="w-full rounded-xl" onEnded={onEnded} />;
}



function haversineDistanceFt(lat1, lon1, lat2, lon2) {
  const R = 20902231;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ChecklistModal({ slides, direction, onComplete, onCancel }) {
  const [slide, setSlide]           = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const current = slides[slide];
  const isLast  = slide === slides.length - 1;
  const isVideo = current.type === "video";
  const canProceed = !isVideo || videoWatched;

  function advance() {
    setVideoWatched(false);
    isLast ? onComplete() : setSlide(s => s + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm px-4">
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${isVideo ? "w-full max-w-2xl" : "w-full max-w-sm"}`}>
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-accent transition-all duration-300" style={{ width: `${((slide + 1) / slides.length) * 100}%` }} />
        </div>
        <div className="p-8 space-y-6">
          <span className="text-xs font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full">
            {direction === "in" ? "Clocking In" : "Clocking Out"} · {slide + 1} of {slides.length}
          </span>
          <p className="text-lg font-bold text-primary leading-snug">{current.message}</p>

          {isVideo && (
            <div className="space-y-2">
              <VideoSlide url={current.video_url} onEnded={() => setVideoWatched(true)} />
              {!videoWatched && (
                <p className="text-xs text-center text-gray-400">Watch the full video to continue</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={advance}
              disabled={!canProceed}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {current.button}
            </button>
            {current.type === "confirm" && (
              <button
                onClick={onCancel}
                className="w-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 hover:border-red-100 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                No — cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function resetKiosk(setDigits, setStage, setUser, setDirection, setActiveRecordId, setChecklist, setResult) {
  setDigits([]);
  setStage("pin");
  setUser(null);
  setDirection(null);
  setActiveRecordId(null);
  setChecklist(null);
  setResult(null);
}

export default function PinPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [digits, setDigits]             = useState([]);
  const [shake, setShake]               = useState(false);
  const [stage, setStage]               = useState("pin"); // pin | locating | checklist | success
  const [user, setUser]                 = useState(null);
  const [direction, setDirection]       = useState(null);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [checklist, setChecklist]       = useState(null);
  const [result, setResult]             = useState(null);
  const [questions, setQuestions]       = useState([]);
  const [companyName, setCompanyName]   = useState("Unified Employee");
  const [tenantReady, setTenantReady]   = useState(false);
  const [cfg,       setCfg]             = useState({ geofence_lat: 33.7488, geofence_lng: -84.3234, geofence_radius_ft: 1000, pin_length: 4, kiosk_reset_seconds: 3 });

  useEffect(() => {
    const slug = searchParams.get("t");
    if (!slug) { setTenantReady(true); return; }
    fetch(`/api/tenants/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setTenantId(data.id);
          setCompanyName(data.name);
        }
        setTenantReady(true);
      })
      .catch(() => setTenantReady(true));
  }, [searchParams]);

  useEffect(() => {
    if (!tenantReady) return;
    fetch("/api/checklist").then(r => r.json()).then(setQuestions);
    fetch("/api/settings").then(r => r.json()).then(s => setCfg(prev => ({ ...prev, ...s })));
  }, [tenantReady]);
  const reset = () => resetKiosk(setDigits, setStage, setUser, setDirection, setActiveRecordId, setChecklist, setResult);

  useEffect(() => {
    if (stage !== "success") return;
    const t = setTimeout(reset, (cfg.kiosk_reset_seconds ?? 3) * 1000);
    return () => clearTimeout(t);
  }, [stage, cfg.kiosk_reset_seconds]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setDigits([]); }, 600);
  };

  const executeClock = useCallback(async (resolvedUser, dir, recordId) => {
    setStage("locating");

    if (resolvedUser.allowMobileAnywhere) {
      const time  = new Date().toISOString();
      const punch = { time, lat: null, lng: null, distanceFt: null, flagged: false };
      if (dir === "in") {
        await fetch("/api/time-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: resolvedUser.id, clockIn: punch }) });
      } else {
        await fetch(`/api/time-records/${recordId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clockOut: punch }) });
      }
      setResult({ flagged: false, distanceFt: null, time, dir });
      setStage("success");
      return;
    }

    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const distanceFt = Math.round(haversineDistanceFt(lat, lng, cfg.geofence_lat, cfg.geofence_lng));
      const flagged    = resolvedUser.requireGeofence === false ? false : distanceFt > cfg.geofence_radius_ft;
      const time       = new Date().toISOString();
      const punch      = { time, lat, lng, distanceFt, flagged };

      if (dir === "in") {
        await fetch("/api/time-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: resolvedUser.id, clockIn: punch }),
        });
      } else {
        await fetch(`/api/time-records/${recordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clockOut: punch }),
        });
      }

      setResult({ flagged, distanceFt, time, dir });
    } catch {
      setResult({ error: true, dir });
    }
    setStage("success");
  }, [cfg]);

  const submitPin = useCallback(async (pin) => {
    const res  = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();

    if (!res.ok) { triggerShake(); return; }

    const { user: matched, activeRecordId: recordId } = data;

    // Admin — go to admin dashboard
    if (matched.role === "admin") {
      setSession(matched);
      router.push("/admin");
      return;
    }

    setSession(matched);
    setUser(matched);

    const dir = recordId ? "out" : "in";
    setDirection(dir);
    setActiveRecordId(recordId);

    const slides = questions
      .filter(q => q.job_role === matched.jobRole && q.direction === dir)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(q => ({ message: q.message, type: q.type, button: q.button_text, video_url: q.video_url }));
    if (slides.length > 0) {
      setChecklist(slides);
      setStage("checklist");
    } else {
      executeClock(matched, dir, recordId);
    }
  }, [router, executeClock]);

  function handleDigit(d) {
    if (stage !== "pin" || shake) return;
    const next = [...digits, String(d)];
    setDigits(next);
    if (next.length === (cfg.pin_length ?? 4)) submitPin(next.join(""));
  }

  useEffect(() => {
    function onKey(e) {
      if (stage !== "pin" || shake) return;
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "Backspace") setDigits(d => d.slice(0, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, shake, digits]);

  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">

      {stage === "checklist" && checklist && (
        <ChecklistModal
          slides={checklist}
          direction={direction}
          onComplete={() => { setChecklist(null); executeClock(user, direction, activeRecordId); }}
          onCancel={() => { setChecklist(null); setDigits([]); setStage("pin"); }}
        />
      )}

      <div className="w-full max-w-xs space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <span className="text-primary text-lg font-black tracking-tighter">UE</span>
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold">{companyName}</h1>
            <p className="text-white/50 text-sm mt-1">
              {stage === "pin"      && "Enter your PIN"}
              {stage === "locating" && "Verifying location…"}
              {stage === "success"  && (result?.error ? "Location unavailable" : result?.dir === "in" ? "Clocked in" : "Clocked out")}
            </p>
          </div>
        </div>

        {/* PIN entry */}
        {(stage === "pin" || stage === "checklist") && (
          <div className="space-y-6">
            <div className={`flex justify-center gap-4 ${shake ? "animate-[shake_0.5s_ease]" : ""}`}>
              {Array.from({ length: cfg.pin_length ?? 4 }, (_, i) => i).map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  digits.length > i ? "bg-accent border-accent" : "border-white/30"
                }`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {KEYS.map((k, i) => {
                if (k === null) return <div key={i} />;
                return (
                  <button
                    key={i}
                    onClick={() => k === "⌫" ? setDigits(d => d.slice(0, -1)) : handleDigit(k)}
                    className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 ${
                      k === "⌫" ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Locating spinner */}
        {stage === "locating" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
            <p className="text-white/50 text-sm">Getting your location…</p>
          </div>
        )}

        {/* Success card */}
        {stage === "success" && result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                result.error ? "bg-yellow-500/20" : result.flagged ? "bg-red-500/20" : "bg-accent/20"
              }`}>
                {result.error ? (
                  <svg width="22" height="22" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ) : result.flagged ? (
                  <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" fill="none" stroke="#00ce7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                )}
              </div>
              <p className="text-white font-bold text-lg">
                {result.error
                  ? "Location unavailable"
                  : `${user?.name?.split(" ")[0]}, you're clocked ${result.dir}`}
              </p>
              {!result.error && (
                <p className="text-white/50 text-sm tabular-nums">
                  {new Date(result.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {result.flagged && (
                <p className="text-red-400 text-xs font-semibold">
                  ⚠ {result.distanceFt}ft from site — flagged for review
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
