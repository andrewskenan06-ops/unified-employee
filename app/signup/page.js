"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminPin: "", confirmPin: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => {
      const value = field === "slug"
        ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
        : e.target.value;
      setForm(f => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.adminPin !== form.confirmPin) { setError("PINs don't match"); return; }
    if (form.adminPin.length < 4)           { setError("PIN must be at least 4 digits"); return; }
    if (!/^\d+$/.test(form.adminPin))       { setError("PIN must be digits only"); return; }
    if (!form.slug.trim())                  { setError("Slug is required"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      form.name.trim(),
          slug:      form.slug.trim(),
          adminName: form.adminName.trim(),
          adminPin:  form.adminPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); return; }
      router.push(`/admin/login?welcome=1`);
    } catch {
      setError("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <span className="text-primary text-lg font-black tracking-tighter">UE</span>
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold">Create your account</h1>
            <p className="text-white/50 text-sm mt-1">Set up Unified Employee for your company</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Acme Corp"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Company Slug</label>
              <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
                <span className="text-white/30 text-sm mr-1">app/</span>
                <input
                  value={form.slug}
                  onChange={set("slug")}
                  placeholder="acme-corp"
                  required
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
                />
              </div>
              <p className="text-white/30 text-xs mt-1">Used to log in — lowercase letters, numbers, hyphens only</p>
            </div>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Your Name</label>
              <input
                value={form.adminName}
                onChange={set("adminName")}
                placeholder="Jane Smith"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Admin PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                value={form.adminPin}
                onChange={set("adminPin")}
                placeholder="4+ digit PIN"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent transition-colors tracking-widest"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                value={form.confirmPin}
                onChange={set("confirmPin")}
                placeholder="Re-enter PIN"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent transition-colors tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-2xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-xs text-white/30">
            Already have an account?{" "}
            <a href="/admin/login" className="text-accent/70 hover:text-accent underline">Sign in</a>
          </p>
        </form>

      </div>
    </div>
  );
}
