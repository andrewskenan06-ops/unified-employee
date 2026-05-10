"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/auth";

export default function StaffLoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState([]);
  const [shake, setShake]   = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setDigits([]); }, 600);
  };

  const submitPin = useCallback(async (pin) => {
    const res  = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) { triggerShake(); return; }

    const { user } = data;
    setSession(user);
    router.push(user.role === "admin" ? "/admin" : "/dashboard");
  }, [router]);

  function handleDigit(d) {
    if (shake) return;
    const next = [...digits, String(d)];
    setDigits(next);
    if (next.length === 4) submitPin(next.join(""));
  }

  useEffect(() => {
    function onKey(e) {
      if (shake) return;
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "Backspace") setDigits(d => d.slice(0, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shake, digits]);

  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-xs space-y-8">

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <span className="text-primary text-lg font-black tracking-tighter">UE</span>
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold">Unified Employee</h1>
            <p className="text-white/50 text-sm mt-1">Enter your PIN to access dashboard</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`flex justify-center gap-4 ${shake ? "animate-[shake_0.5s_ease]" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
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

      </div>
    </div>
  );
}
