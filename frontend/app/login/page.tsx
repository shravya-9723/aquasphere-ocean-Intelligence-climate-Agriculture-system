"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import dynamic from "next/dynamic";

import { postJson } from "@/lib/api";
import type { Profile } from "@/lib/types";


const ClimateScene = dynamic(() => import("@/components/climate-scene"), {
  ssr: false,
});

async function syncLocalProfile(mode: "login" | "register", email: string, password: string, fullName: string, organization: string) {
  if (mode === "register") {
    try {
      return await postJson<Profile>("/auth/register", { email, password, full_name: fullName, organization });
    } catch {
      return postJson<Profile>("/auth/login", { email, password });
    }
  }

  try {
    return await postJson<Profile>("/auth/login", { email, password });
  } catch {
    return postJson<Profile>("/auth/register", {
      email,
      password,
      full_name: email.split("@")[0] || "AquaSphere User",
      organization,
    });
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 7000) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Backend profile sync timed out.")), timeoutMs);
    }),
  ]);
}

function fallbackProfile(email: string, fullName?: string): Profile {
  return {
    id: 0,
    email,
    full_name: fullName || email.split("@")[0] || "AquaSphere User",
    organization: "AquaSphere Lab",
    favorite_region: "India",
    theme: "aurora",
  };
}


export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("AquaSphere Lab");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus("Signing in...");
    try {
      setStatus("Syncing profile...");
      let profile: Profile;
      try {
        profile = await withTimeout(syncLocalProfile(mode, email, password, fullName, organization));
      } catch {
        profile = fallbackProfile(email, fullName);
      }
      localStorage.setItem("aquasphere-profile", JSON.stringify(profile));
      router.push("/map" as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ClimateScene />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="glass-panel grid w-full max-w-5xl gap-8 rounded-[36px] p-6 shadow-glow lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <section className="hero-grid rounded-[30px] border border-cyan-100/10 p-6">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-100/55">AquaSphere Access</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
              AquaSphere: Ocean-Climate-Agriculture Intelligence System
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/72">
              Login can use Firebase Auth when configured, while AquaSphere keeps profile, saved insights, and chat memory in the local backend.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <PromoCard title="World Map Hub" text="Jump into a normal world map with regional ocean and trade signals." />
              <PromoCard title="AI Memory" text="Save generative answers, insights, and your preferred climate region." />
              <PromoCard title="Cross-domain Trends" text="Explore ocean temperature, crop yield, and trade pressure together." />
              <PromoCard title="Aurora UI" text="Keep the same neon glassmorphism style across every page." />
            </div>
          </section>

          <section className="glass-panel rounded-[30px] p-6 shadow-glow">
            <div className="mb-5 flex items-center gap-2">
              <button
                className={`rounded-full px-4 py-2 text-sm ${mode === "login" ? "sea-button font-semibold" : "sea-button-secondary"}`}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm ${mode === "register" ? "sea-button font-semibold" : "sea-button-secondary"}`}
                onClick={() => setMode("register")}
                type="button"
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <>
                  <Field label="Full name" value={fullName} onChange={setFullName} />
                  <Field label="Organization" value={organization} onChange={setOrganization} />
                </>
              ) : null}
              <Field label="Email" type="email" value={email} onChange={setEmail} />
              <PasswordField
                label="Password"
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
                showPassword={showPassword}
                value={password}
              />

              {error ? (
                <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4 text-sm text-orange-100">
                  {error}
                </div>
              ) : null}
              {status ? (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                  {status}
                </div>
              ) : null}

              <button className="sea-button w-full rounded-full px-5 py-3 text-sm font-semibold" disabled={busy} type="submit">
                {busy ? "Please wait..." : mode === "login" ? "Enter AquaSphere" : "Create profile"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}


function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-cyan-50/72">{label}</span>
      <input
        className="w-full rounded-[20px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3 text-white outline-none focus:border-cyan-300/35"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}


function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-cyan-50/72">{label}</span>
      <div className="flex items-center gap-2 rounded-[20px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3">
        <input
          className="w-full bg-transparent text-white outline-none"
          onChange={(event) => onChange(event.target.value)}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <button
          className="rounded-full border border-cyan-100/10 bg-white/5 px-3 py-1 text-xs text-cyan-50/75"
          onClick={onToggle}
          type="button"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}


function PromoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="metric-card rounded-[22px] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-cyan-50/70">{text}</p>
    </div>
  );
}
