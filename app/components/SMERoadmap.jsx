"use client";

/**
 * SMERoadmap.jsx
 * Minimal, secure frontend. All Claude calls go through /api/roadmap.
 * No API keys in client. No localStorage. No tracking.
 */

import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  "F&B / Café / Restaurant",
  "Retail Fashion / Apparel",
  "Hardware / Home Supplies",
  "Beauty / Wellness / Salon",
  "Education / Tuition Centre",
  "Professional Services",
  "Logistics / Delivery",
  "Other",
];
const HEADCOUNTS = ["Solo / 1–2 pax", "Small team (3–10)", "Medium (11–30)"];
const BUDGETS = ["< S$500/mo", "S$500–1,000/mo", "S$1,000–2,000/mo", "S$2,000+/mo"];
const TECH_LEVELS = ["Low (still learning)", "Medium (comfortable)", "High (tech-savvy)"];
const PAIN_POINTS = [
  "Too much admin / paperwork",
  "No online presence",
  "No customer data",
  "Cash flow visibility",
  "Staff scheduling chaos",
  "Inventory stockouts",
  "Low repeat customers",
];

const Q_COLORS = { Q1: "#00E5D8", Q2: "#7C3AED", Q3: "#F59E0B", Q4: "#10B981" };

const AGENT_STEPS = [
  "Mapping your sector…",
  "Analysing skill gaps…",
  "Building roadmap…",
  "Matching training…",
];

// ─── Tiny UI primitives ───────────────────────────────────────────────────────

const s = {
  wrap: { minHeight: "100vh", background: "#07070f", fontFamily: "system-ui, sans-serif", display: "flex", justifyContent: "center", padding: "40px 20px" },
  card: { width: "100%", maxWidth: 540, background: "#0d0d1a", border: "1px solid #ffffff14", borderRadius: 14, padding: "28px 24px", alignSelf: "flex-start" },
  label: { color: "#666", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  q: { color: "#fff", fontSize: 19, fontWeight: 700, marginBottom: 16, lineHeight: 1.3 },
  btn: (active) => ({ width: "100%", background: active ? "#00E5D822" : "#ffffff08", border: `1.5px solid ${active ? "#00E5D8" : "#ffffff18"}`, color: active ? "#00E5D8" : "#bbb", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "inherit", marginBottom: 6 }),
  next: (ok) => ({ background: ok ? "#00E5D8" : "#ffffff18", color: ok ? "#07070f" : "#555", border: "none", borderRadius: 8, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: ok ? "pointer" : "default", fontFamily: "inherit" }),
  back: { background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 },
  tag: (c) => ({ background: `${c}22`, border: `1px solid ${c}44`, color: c, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "inline-block" }),
  bar: { display: "flex", gap: 5, marginBottom: 28 },
  pip: (on) => ({ flex: 1, height: 2, borderRadius: 1, background: on ? "#00E5D8" : "#ffffff14" }),
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
};

// ─── Quarter card ─────────────────────────────────────────────────────────────

function QCard({ q, data }) {
  const [open, setOpen] = useState(false);
  const c = Q_COLORS[q];
  return (
    <div style={{ border: `1px solid ${c}33`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ background: `${c}0d`, padding: "13px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: c, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{q} — {data.title}</div>
          <div style={{ color: "#888", fontSize: 13 }}>{data.summary}</div>
        </div>
        <span style={{ color: c, marginLeft: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "14px 16px", background: "#0a0a0f", borderTop: `1px solid ${c}1a` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[["Cost", data.cost], ["PSG", data.psg], ["Timeline", data.timeline], ["ROI", data.roi]].map(([k, v]) => (
              <div key={k} style={{ background: "#ffffff08", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ color: "#555", fontSize: 10, marginBottom: 3 }}>{k}</div>
                <div style={{ color: "#ddd", fontSize: 12, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...s.label, color: c, marginBottom: 6 }}>Tools</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {data.tools?.map(t => <span key={t} style={s.tag(c)}>{t}</span>)}
            </div>
          </div>
          <div style={{ marginBottom: data.checklist ? 10 : 0 }}>
            <div style={{ ...s.label, color: c, marginBottom: 4 }}>Milestone</div>
            <div style={{ color: "#aaa", fontSize: 13 }}>{data.milestone}</div>
          </div>
          {data.checklist && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...s.label, color: c, marginBottom: 6 }}>Week 1 checklist</div>
              {data.checklist.map((item, i) => (
                <div key={i} style={{ color: "#aaa", fontSize: 13, marginBottom: 5, display: "flex", gap: 8 }}>
                  <span style={{ color: c }}>→</span>{item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Training row ─────────────────────────────────────────────────────────────

function TrainingCard({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ border: "1px solid #ffffff14", borderRadius: 10, padding: "14px 16px", marginTop: 10 }}>
      <div style={{ ...s.label, marginBottom: 10 }}>SkillsFuture training</div>
      {items.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
          <span style={s.tag(Q_COLORS[r.quarter] || "#00E5D8")}>{r.quarter}</span>
          <div>
            <div style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{r.course}</div>
            <div style={{ color: "#666", fontSize: 12 }}>{r.provider} · {r.funding}</div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{r.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SMERoadmap() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ sector: "", headcount: "", budget: "", techLevel: "", painPoints: [] });
  const [agentStep, setAgentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (v) => setForm(p => ({
    ...p,
    painPoints: p.painPoints.includes(v) ? p.painPoints.filter(x => x !== v) : [...p.painPoints, v]
  }));

  const canNext = () => {
    if (step === 1) return !!form.sector;
    if (step === 2) return !!form.headcount && !!form.budget;
    if (step === 3) return !!form.techLevel;
    if (step === 4) return form.painPoints.length > 0;
    return true;
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    setAgentStep(0);

    // Simulate agent step progression (each ~3–4s apart)
    const ticker = setInterval(() => {
      setAgentStep(s => Math.min(s + 1, AGENT_STEPS.length - 1));
    }, 3500);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
      setStep(6);
    } catch (e) {
      setError(e.message || "Generation failed. Try again.");
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setForm({ sector: "", headcount: "", budget: "", techLevel: "", painPoints: [] });
    setResult(null);
    setError("");
  };

  // ── Loading screen ──
  if (loading) return (
    <div style={s.wrap}>
      <div style={{ ...s.card, textAlign: "center", padding: "60px 24px" }}>
        <div style={{ color: "#00E5D8", fontSize: 28, marginBottom: 20, animation: "spin 1.5s linear infinite" }}>◌</div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
          {AGENT_STEPS[agentStep]}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {AGENT_STEPS.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= agentStep ? "#00E5D8" : "#ffffff18" }} />
          ))}
        </div>
        <div style={{ color: "#444", fontSize: 12, marginTop: 16 }}>
          Agent {agentStep + 1} of {AGENT_STEPS.length}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Result screen ──
  if (step === 6 && result) {
    const { roadmap, skills_gap, training, sector_context, cache_date } = result;
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={{ marginBottom: 20 }}>
            <span style={s.tag("#00E5D8")}>One Empire</span>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "10px 0 4px" }}>Your 12-Month Roadmap</h2>
            <div style={{ color: "#555", fontSize: 12 }}>
              {sector_context?.sf_sector} · PSG data as of {cache_date}
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[["Investment", roadmap.totalCost], ["PSG saves", roadmap.psgSavings], ["Net cost", roadmap.netCost]].map(([k, v]) => (
              <div key={k} style={{ background: "#00E5D80d", border: "1px solid #00E5D822", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                <div style={{ color: "#555", fontSize: 10, marginBottom: 4 }}>{k}</div>
                <div style={{ color: "#00E5D8", fontWeight: 800, fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Skills gap note */}
          {skills_gap?.summary && (
            <div style={{ background: "#7C3AED0d", border: "1px solid #7C3AED33", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#aaa", fontSize: 13 }}>
              <span style={{ color: "#7C3AED", fontWeight: 700 }}>Skills gap: </span>{skills_gap.summary}
            </div>
          )}

          {/* Quarter cards */}
          {["Q1", "Q2", "Q3", "Q4"].map(q => roadmap[q] && <QCard key={q} q={q} data={roadmap[q]} />)}

          {/* Pain point note */}
          {roadmap.painPointNote && (
            <div style={{ background: "#ffffff08", borderRadius: 8, padding: "10px 14px", marginTop: 6, color: "#888", fontSize: 13 }}>
              {roadmap.painPointNote}
            </div>
          )}

          {/* Training */}
          <TrainingCard items={training} />

          <div style={{ borderTop: "1px solid #ffffff0a", marginTop: 20, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#444", fontSize: 11 }}>one-empire.com</div>
            <button style={s.back} onClick={reset}>← New roadmap</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Intake steps ──
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Progress */}
        <div style={s.bar}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} style={s.pip(i <= step)} />)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={s.tag("#00E5D8")}>SME Roadmap</span>
          <span style={{ color: "#444", fontSize: 12 }}>{step} / 5</span>
        </div>

        {/* Step 1 */}
        {step === 1 && <>
          <div style={s.label}>Your business</div>
          <div style={s.q}>What type of business are you running?</div>
          {SECTORS.map(o => <button key={o} style={s.btn(form.sector === o)} onClick={() => set("sector", o)}>{o}</button>)}
        </>}

        {/* Step 2 */}
        {step === 2 && <>
          <div style={s.label}>Team & budget</div>
          <div style={s.q}>How big is your team?</div>
          {HEADCOUNTS.map(o => <button key={o} style={s.btn(form.headcount === o)} onClick={() => set("headcount", o)}>{o}</button>)}
          <div style={{ ...s.label, marginTop: 16 }}>Monthly tech budget</div>
          {BUDGETS.map(o => <button key={o} style={s.btn(form.budget === o)} onClick={() => set("budget", o)}>{o}</button>)}
        </>}

        {/* Step 3 */}
        {step === 3 && <>
          <div style={s.label}>Tech readiness</div>
          <div style={s.q}>How comfortable is your team with new technology?</div>
          {TECH_LEVELS.map(o => <button key={o} style={s.btn(form.techLevel === o)} onClick={() => set("techLevel", o)}>{o}</button>)}
        </>}

        {/* Step 4 */}
        {step === 4 && <>
          <div style={s.label}>Select all that apply</div>
          <div style={s.q}>What's hurting your business most?</div>
          {PAIN_POINTS.map(o => (
            <button key={o} style={s.btn(form.painPoints.includes(o))} onClick={() => toggle(o)}>
              <span style={{ display: "inline-block", width: 12, height: 12, border: `1.5px solid ${form.painPoints.includes(o) ? "#00E5D8" : "#444"}`, borderRadius: 2, marginRight: 8, background: form.painPoints.includes(o) ? "#00E5D8" : "transparent", verticalAlign: "middle", position: "relative", top: -1 }} />
              {o}
            </button>
          ))}
        </>}

        {/* Step 5 — review */}
        {step === 5 && <>
          <div style={s.label}>Review</div>
          <div style={s.q}>Ready to generate your roadmap?</div>
          <div style={{ background: "#ffffff08", borderRadius: 8, padding: "14px", marginBottom: 16 }}>
            {[["Sector", form.sector], ["Team", form.headcount], ["Budget", form.budget], ["Tech level", form.techLevel], ["Pain points", form.painPoints.join(", ")]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "#555" }}>{k}</span>
                <span style={{ color: "#ccc", textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ color: "#555", fontSize: 11, marginBottom: 14 }}>
            4 AI agents · SkillsFuture aligned · PSG grants included
          </div>
          {error && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button style={{ ...s.next(true), width: "100%", padding: "13px" }} onClick={generate}>
            Generate roadmap →
          </button>
        </>}

        {/* Navigation */}
        {step < 5 && (
          <div style={s.row}>
            {step > 1
              ? <button style={s.back} onClick={() => setStep(s => s - 1)}>← Back</button>
              : <span />}
            <button style={s.next(canNext())} onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}>
              Next →
            </button>
          </div>
        )}
        {step === 5 && (
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <button style={s.back} onClick={() => setStep(4)}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
