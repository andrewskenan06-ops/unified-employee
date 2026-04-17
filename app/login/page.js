"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginByPin, getDefaultRoles } from "@/lib/auth";

const GEOFENCE = { lat: 40.8610, lng: -73.8837, radiusFt: 1000 };
const LS_KEY       = "ue_time_records";
const LS_ROLES_KEY = "ue_employee_roles";

const YARD_CHECKLIST = {
  in:  [
    { message: "Remember 3 points of contact at all times.", type: "acknowledge", button: "Okay, Got It" },
    { message: "Do you have a charged and ready-to-go walkie talkie with you?", type: "confirm", button: "Yes" },
  ],
  out: [
    { message: "Is the machine clean from all garbage?", type: "confirm", button: "Yes" },
    { message: "Did you put up the walkie talkie and is it being charged?", type: "confirm", button: "Yes" },
  ],
};

const OFFICE_CHECKLIST = {
  in:  [
    { message: "Check the missed calls list.", type: "acknowledge", button: "Okay" },
    { message: "Remember to smile and make customers feel at home.", type: "acknowledge", button: "Okay" },
  ],
  out: [
    { message: "Did you count the register?", type: "confirm", button: "Yes" },
    { message: "Make sure the building is locked and the alarm is on.", type: "acknowledge", button: "Okay" },
  ],
};

function haversineDistanceFt(lat1, lon1, lat2, lon2) {
  const R = 20902231;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function saveRecords(r) { localStorage.setItem(LS_KEY, JSON.stringify(r)); }

function getJobRole(userId) {
  try {
    let roles = JSON.parse(localStorage.getItem(LS_ROLES_KEY) || "{}");
    if (Object.keys(roles).length === 0) {
      roles = getDefaultRoles();
      localStorage.setItem(LS_ROLES_KEY, JSON.stringify(roles));
    }
    return roles[userId] || null;
  } catch { return null; }
}

function ChecklistModal({ slides, direction, onComplete, onCancel }) {
  const [slide, setSlide] = useState(0);
  const current = slides[slide];
  const isLast  = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-accent transition-all duration-300" style={{ width: `${((slide + 1) / slides.length) * 100}%` }} />
        </div>
        <div className="p-8 space-y-6">
          <span className="text-xs font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full">
            {direction === "in" ? "Clocking In" : "Clocking Out"} · {slide + 1} of {slides.length}
          </span>
          <p className="text-lg font-bold text-primary leading-snug">{current.message}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => isLast ? onComplete() : setSlide(s => s + 1)}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3.5 rounded-xl text-sm transition-colors"
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

export default function PinPage() {
  const router = useRouter();
  const [digits, setDigits]       = useState([]);
  const [shake, setShake]         = useState(false);
  const [stage, setStage]         = useState("pin"); // pin | locating | checklist | success
  const [user, setUser]           = useState(null);
  const [direction, setDirection] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [result, setResult]       = useState(null); // { flagged, dist, time }

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setDigits([]); }, 600);
  };

  const executeClock = useCallback(async (resolvedUser, dir, active) => {
    setStage("locating");
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const dist    = Math.round(haversineDistanceFt(lat, lng, GEOFENCE.lat, GEOFENCE.lng));
      const flagged = dist > GEOFENCE.radiusFt;
      const time    = new Date().toISOString();
      const punch   = { time, lat, lng, distanceFt: dist, flagged };

      const current = loadRecords();
      let next;
      if (dir === "in") {
        next = [
          { id: crypto.randomUUID(), employeeId: resolvedUser.id, employeeName: resolvedUser.name, date: time, clockIn: punch, clockOut: null, status: "active", flagged },
          ...current,
        ];
      } else {
        next = current.map((r) =>
          r.id === active.id
            ? { ...r, clockOut: punch, status: "complete", flagged: r.flagged || flagged }
            : r
        );
      }
      saveRecords(next);
      setResult({ flagged, dist, time, dir });
      setStage("success");
    } catch {
      setResult({ error: true, dir });
      setStage("success");
    }
  }, []);

  const submitPin = useCallback((pin) => {
    const matched = loginByPin(pin);
    if (!matched) { triggerShake(); return; }

    // Admin goes straight to dashboard — no clock action
    if (matched.role === "admin") { router.push("/dashboard"); return; }

    const records = loadRecords();
    const active  = records.find((r) => r.employeeId === matched.id && r.status === "active") || null;
    const dir     = active ? "out" : "in";

    setUser(matched);
    setDirection(dir);
    setActiveRecord(active);

    const jobRole = getJobRole(matched.id);
    const slides  = jobRole === "Yard Worker"   ? YARD_CHECKLIST[dir]
                  : jobRole === "Office Worker" ? OFFICE_CHECKLIST[dir]
                  : null;

    if (slides) {
      setChecklist(slides);
      setStage("checklist");
    } else {
      executeClock(matched, dir, active);
    }
  }, [router, executeClock]);

  function handleDigit(d) {
    if (stage !== "pin" || shake) return;
    const next = [...digits, String(d)];
    setDigits(next);
    if (next.length === 4) submitPin(next.join(""));
  }

  function handleContinue() {
    router.push("/dashboard");
  }

  const KEYS = [1,2,3,4,5,6,7,8,9,null,0,"⌫"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">

      {/* Checklist modal */}
      {stage === "checklist" && checklist && (
        <ChecklistModal
          slides={checklist}
          direction={direction}
          onComplete={() => { setChecklist(null); executeClock(user, direction, activeRecord); }}
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
            <h1 className="text-white text-xl font-bold">Unified Employee</h1>
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
            {/* Dot display */}
            <div className={`flex justify-center gap-4 transition-all ${shake ? "animate-[shake_0.5s_ease]" : ""}`}>
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  digits.length > i ? "bg-accent border-accent" : "border-white/30"
                }`} />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {KEYS.map((k, i) => {
                if (k === null) return <div key={i} />;
                return (
                  <button
                    key={i}
                    onClick={() => k === "⌫" ? setDigits(d => d.slice(0,-1)) : handleDigit(k)}
                    className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 ${
                      k === "⌫"
                        ? "bg-white/10 text-white/60 hover:bg-white/20"
                        : "bg-white/10 hover:bg-white/20 text-white"
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
            {result.error ? (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg width="22" height="22" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <p className="text-white font-bold">Location unavailable</p>
                <p className="text-white/50 text-xs">Punch saved — enable location for full accuracy</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${result.flagged ? "bg-red-500/20" : "bg-accent/20"}`}>
                  {result.flagged ? (
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
                  {user?.name?.split(" ")[0]},{" "}
                  {result.dir === "in" ? "you're clocked in" : "you're clocked out"}
                </p>
                <p className="text-white/50 text-sm tabular-nums">
                  {new Date(result.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {result.flagged && (
                  <p className="text-red-400 text-xs font-semibold">
                    ⚠ {result.dist}ft from site — flagged for review
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
