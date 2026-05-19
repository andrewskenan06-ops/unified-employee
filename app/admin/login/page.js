"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setSession, setTenantId } from "@/lib/auth";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG;

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep]     = useState(DEFAULT_SLUG ? "loading" : "slug");
  const [slug, setSlug]     = useState("");
  const [tenant, setTenant] = useState(null);
  const [slugError, setSlugError] = useState("");
  const [digits, setDigits] = useState([]);
  const [shake, setShake]   = useState(false);

  useEffect(() => {
    if (!DEFAULT_SLUG) return;
    fetch(`/api/tenants/${DEFAULT_SLUG.trim().toLowerCase()}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setTenantId(data.id);
          setTenant(data);
          setStep("pin");
        } else {
          setStep("slug");
        }
      })
      .catch(() => setStep("slug"));
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setDigits([]); }, 600);
  };

  async function handleSlugSubmit(e) {
    e.preventDefault();
    setSlugError("");
    const res  = await fetch(`/api/tenants/${slug.trim().toLowerCase()}`);
    const data = await res.json();
    if (!res.ok) { setSlugError(data.error || "Company not found"); return; }
    setTenantId(data.id);
    setTenant(data);
    setStep("pin");
  }

  const submitPin = useCallback(async (pin) => {
    const res  = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();

    if (!res.ok || data.user?.role !== "admin") {
      triggerShake();
      return;
    }

    setSession(data.user);
    sessionStorage.setItem("admin_verified", "1");
    router.push("/admin");
  }, [router]);

  function handleDigit(d) {
    if (shake) return;
    const next = [...digits, String(d)];
    setDigits(next);
    if (next.length === 4) submitPin(next.join(""));
  }

  useEffect(() => {
    if (step !== "pin") return;
    function onKey(e) {
      if (shake) return;
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "Backspace") setDigits(d => d.slice(0, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, shake, digits]);

  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"];

  if (step === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-xs space-y-8">

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <span className="text-primary text-lg font-black tracking-tighter">UE</span>
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold">
              {step === "slug" ? "Admin Access" : tenant?.name ?? "Admin Access"}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {step === "slug" ? "Enter your company slug to continue" : "Enter your admin PIN"}
            </p>
          </div>
        </div>

        {step === "slug" && (
          <form onSubmit={handleSlugSubmit} className="space-y-4">
            <div>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="company-slug"
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/30 text-center text-lg font-semibold focus:outline-none focus:border-accent transition-colors"
              />
              {slugError && (
                <p className="text-red-400 text-xs text-center mt-2 font-semibold">{slugError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!slug.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-2xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            <p className="text-center text-xs text-white/30">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-accent/70 hover:text-accent underline">Sign up</a>
            </p>
          </form>
        )}

        {step === "pin" && (
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
                  <button key={i}
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

            <button
              onClick={() => { setStep("slug"); setDigits([]); setTenant(null); }}
              className="w-full text-white/30 hover:text-white/60 text-xs font-medium transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
