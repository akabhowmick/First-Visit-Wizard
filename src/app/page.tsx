"use client";

import { useEffect, useMemo, useState } from "react";
import { AboutMeField, AddressFields, BirthdateField } from "../components/fields";
import Stepper from "../components/Stepper";
import type { ConfigPayload } from "../lib/types";
type UserData = {
  id: string;
  email: string;
  aboutMe?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  birthdate?: string | null;
  stepCompleted: number;
};

export default function OnboardingPage() {
  const [config, setConfig] = useState<ConfigPayload | null>(null);
  const [me, setMe] = useState<UserData | null>(null);
  const [current, setCurrent] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await fetch("/api/config").then((r) => r.json());
      setConfig(cfg);
      const meRes = await fetch("/api/users/me").then((r) => r.json());
      if (meRes.user) {
        setMe(meRes.user);
        setCurrent((meRes.user.stepCompleted ?? 1) as 1 | 2 | 3);
      }
    })();
  }, []);

  const step2Components = useMemo(() => config?.step2 ?? [], [config]);
  const step3Components = useMemo(() => config?.step3 ?? [], [config]);

  async function submitStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 1, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Failed");
      setBusy(false);
      return;
    }
    setCurrent(2);
    setBusy(false);
  }

  async function submitDynamicStep(step: 2 | 3, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, data: payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Failed");
      setBusy(false);
      return;
    }
    if (step === 2) setCurrent(3);
    if (step === 3) setCurrent(3); // stay on 3 after completion
    setBusy(false);
  }

  function renderComponents(list: string[]) {
    return (
      <div className="space-y-4">
        {list.includes("ABOUT_ME") && <AboutMeField defaultValue={me?.aboutMe ?? undefined} />}
        {list.includes("ADDRESS") && (
          <AddressFields
            street={me?.street ?? undefined}
            city={me?.city ?? undefined}
            state={me?.state ?? undefined}
            zip={me?.zip ?? undefined}
          />
        )}
        {list.includes("BIRTHDATE") && <BirthdateField defaultValue={me?.birthdate ?? undefined} />}
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <Stepper current={current} />
      {err && <p className="text-red-600 mb-4">{err}</p>}

      {/* STEP 1 */}
      {current === 1 && (
        <form onSubmit={submitStep1} className="space-y-4">
          <div className="space-y-2">
            <label className="font-medium">Email</label>
            <input name="email" type="email" required className="w-full border rounded p-2" />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Password</label>
            <input name="password" type="password" required className="w-full border rounded p-2" />
          </div>
          <button disabled={busy} className="bg-black text-white px-4 py-2 rounded">
            {busy ? "Saving..." : "Continue"}
          </button>
        </form>
      )}

      {/* STEP 2 */}
      {current === 2 && config && (
        <form onSubmit={(e) => submitDynamicStep(2, e)} className="space-y-4">
          {renderComponents(step2Components)}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrent(1)}
              className="px-3 py-2 border rounded"
            >
              Back
            </button>
            <button disabled={busy} className="bg-black text-white px-4 py-2 rounded">
              {busy ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3 */}
      {current === 3 && config && (
        <form onSubmit={(e) => submitDynamicStep(3, e)} className="space-y-4">
          {renderComponents(step3Components)}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrent(2)}
              className="px-3 py-2 border rounded"
            >
              Back
            </button>
            <button disabled={busy} className="bg-black text-white px-4 py-2 rounded">
              {busy ? "Saving..." : "Finish"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
