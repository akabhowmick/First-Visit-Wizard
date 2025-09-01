"use client";

import { useEffect, useState } from "react";
import { type ConfigPayload, ALL_COMPONENTS } from "../../lib/types";

type Choice = "step2" | "step3";
type MapState = Record<string, Choice>;

const toMap = (cfg: ConfigPayload): MapState => {
  const m: MapState = {};
  for (const c of ALL_COMPONENTS) m[c] = cfg.step2.includes(c) ? "step2" : "step3";
  return m;
};

export default function AdminPage() {
  const [cfg, setCfg] = useState<ConfigPayload | null>(null);
  const [map, setMap] = useState<MapState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await fetch("/api/config").then((r) => r.json());
      setCfg(c);
      setMap(toMap(c));
    })();
  }, []);

  if (!cfg || !map) return <main className="max-w-2xl mx-auto p-6">Loading...</main>;

  function handleChange(comp: string, choice: Choice) {
    setMap({ ...map, [comp]: choice });
  }

  async function save() {
    setErr(null);
    setOk(null);
    // Rebuild arrays from map
    const step2: string[] = [];
    const step3: string[] = [];
    for (const c of ALL_COMPONENTS) (map![c] === "step2" ? step2 : step3).push(c);

    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step2, step3 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setOk("Saved!");
    setCfg(data);
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Admin — Configure Steps</h1>
      <p className="text-sm text-gray-600 mb-4">
        Each component must be on exactly one page; both steps must have at least one component.
      </p>
      {err && <p className="text-red-600">{err}</p>}
      {ok && <p className="text-green-600">{ok}</p>}

      <div className="space-y-4">
        {ALL_COMPONENTS.map((c) => (
          <div key={c} className="flex items-center justify-between border rounded p-3">
            <span className="font-medium">{c.replace("_", " ")}</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={c}
                  checked={map[c] === "step2"}
                  onChange={() => handleChange(c, "step2")}
                />
                <span>Step 2</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={c}
                  checked={map[c] === "step3"}
                  onChange={() => handleChange(c, "step3")}
                />
                <span>Step 3</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} className="mt-6 bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </main>
  );
}
