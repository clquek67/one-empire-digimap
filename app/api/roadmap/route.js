/**
 * /app/api/roadmap/route.js
 * v2.0 — 5-grant aware, SEA-ready pipeline
 *
 * Security:
 * - API key server-side only
 * - Input sanitised before prompt injection
 * - Rate limited: 10 req/IP/min
 * - No user data stored
 * - CORS locked to same origin
 */

import { NextResponse } from "next/server";
import psgCache from "@/data/psg-cache.json";

// --- Rate limiting ---
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  rateMap.set(ip, { ...entry, count: entry.count + 1 });
  return false;
}

// --- Input sanitiser ---
function sanitise(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"'`\\]/g, "").trim().slice(0, maxLen);
}

// --- Claude call helper ---
async function callClaude(systemPrompt, userContent) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// --- JSON parse helper ---
function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// --- Agent system prompts ---

const AGENT1_SYSTEM = `You are a Singapore SME sector classifier.
Map the business to a SkillsFuture sector and identify 3 relevant job roles.
Respond ONLY in valid JSON. No preamble. No markdown. Be concise.`;

const AGENT2_SYSTEM = `You are a digital skills gap analyst for Singapore SMEs.
Identify the top 3 digital skill gaps only. Be brief.
Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT3_SYSTEM = `You are a Singapore SME digital transformation advisor.
Generate ONE quarter plan. Recommend the most relevant SG government grant for this quarter.
Grants available: PSG (digital tools, 50%), EDG (capabilities/branding, 50%), MRA (overseas expansion, 50%), SFEC (staff training, 90%), CTO-a-S (tech advisory, 70%).
Be concise. Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT4_SYSTEM = `You are a SkillsFuture training advisor for Singapore SMEs.
Recommend 2 training courses maximum. Be brief.
Respond ONLY in valid JSON. No preamble. No markdown.`;

// --- Quarter context ---
const QUARTER_CONTEXT = {
  Q1: { focus: "FOUNDATION", hint: "cloud accounting, digital payments, basic comms. Best grant: PSG or CTO-a-S" },
  Q2: { focus: "ONLINE PRESENCE", hint: "Google Business, e-commerce, basic website. Best grant: PSG" },
  Q3: { focus: "AUTOMATION", hint: "inventory, CRM, invoicing. Best grant: PSG or EDG" },
  Q4: { focus: "GROWTH", hint: "digital marketing, analytics, loyalty, possible SEA expansion. Best grant: EDG or MRA" },
};

// --- Main handler ---
export async function POST(req) {
  // CORS
  const origin = req.headers.get("origin") || "";
  const allowed = process.env.NEXT_PUBLIC_APP_URL || "";
  if (allowed && origin !== allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Parse + sanitise
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const inputs = {
    sector: sanitise(body.sector),
    headcount: sanitise(body.headcount),
    budget: sanitise(body.budget),
    techLevel: sanitise(body.techLevel),
    painPoints: Array.isArray(body.painPoints)
      ? body.painPoints.map(p => sanitise(p)).slice(0, 7)
      : [],
  };

  if (!inputs.sector || !inputs.headcount || !inputs.budget) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Lean PSG tool list — names + pricing only
    const leanTools = Object.fromEntries(
      Object.entries(psgCache.solutions).map(([k, v]) => [
        k,
        {
          category: v.category,
          psg_eligible: v.psg_eligible,
          tools: v.solutions.map(s => `${s.name} (${s.pricing})`).slice(0, 3),
        }
      ])
    );

    // Lean grant summary for Agent 3
    const leanGrants = Object.fromEntries(
      Object.entries(psgCache.grants).map(([k, v]) => [
        k,
        { support_rate: v.support_rate, best_for: v.best_for }
      ])
    );

    // Agent 1 — Sector mapper
    const a1Raw = await callClaude(
      AGENT1_SYSTEM,
      `Business: "${inputs.sector}" | Team: "${inputs.headcount}"
Return JSON: { "sf_sector": string, "job_roles": [string, string, string], "digital_maturity": "low|medium|high" }`
    );
    const a1 = parseJSON(a1Raw);

    // Agent 2 — Skills gap
    const a2Raw = await callClaude(
      AGENT2_SYSTEM,
      `Sector: "${a1.sf_sector}" | Team: "${inputs.headcount}" | Tech: "${inputs.techLevel}"
Pain points: ${inputs.painPoints.join(", ")}
Return JSON: { "gaps": [{ "skill": string, "priority": "high|medium" }], "summary": string }
Maximum 3 gaps.`
    );
    const a2 = parseJSON(a2Raw);

    // Agent 3 — One quarter per call (4 calls, token-efficient)
    const quarters = {};
    for (const [q, ctx] of Object.entries(QUARTER_CONTEXT)) {
      const isQ1 = q === "Q1";
      const raw = await callClaude(
        AGENT3_SYSTEM,
        `${q} focus: ${ctx.focus} (${ctx.hint})
Sector: "${a1.sf_sector}" | Budget: "${inputs.budget}" | Tech: "${inputs.techLevel}"
Tools available: ${JSON.stringify(leanTools)}
Grants available: ${JSON.stringify(leanGrants)}
Return JSON:
{
  "title": "${ctx.focus}",
  "cost": string,
  "grant": string,
  "grant_benefit": string,
  "tools": [string, string, string],
  "milestone": string${isQ1 ? ',\n  "checklist": [string, string, string]' : ''}
}${isQ1 ? "" : "\nSet checklist to null."}`
      );
      quarters[q] = parseJSON(raw);
      if (!isQ1) quarters[q].checklist = null;
    }

    // Agent 4 — Training
    const a4Raw = await callClaude(
      AGENT4_SYSTEM,
      `Skill gaps: ${a2.gaps.map(g => g.skill).join(", ")}
Quarters: Q1=${quarters.Q1?.title}, Q2=${quarters.Q2?.title}
Courses: ${JSON.stringify(psgCache.skillsfuture_courses)}
SFEC grant: ${psgCache.grants.SFEC.support_rate} subsidy available.
Return JSON: { "recommendations": [{ "quarter": "Q1|Q2|Q3|Q4", "course": string, "provider": string, "funding": string, "reason": string }] }
Maximum 2 recommendations.`
    );
    const a4 = parseJSON(a4Raw);

    // Cost estimate based on budget range
    const budgetMap = {
      "< S$500/mo": { total: "~S$4,000/yr", net: "~S$2,000/yr after PSG" },
      "S$500–1,000/mo": { total: "~S$8,000/yr", net: "~S$4,000/yr after PSG" },
      "S$1,000–2,000/mo": { total: "~S$15,000/yr", net: "~S$7,500/yr after PSG" },
      "S$2,000+/mo": { total: "~S$25,000/yr", net: "~S$12,500/yr after PSG" },
    };
    const costs = budgetMap[inputs.budget] || { total: "~S$12,000/yr", net: "~S$6,000/yr after PSG" };

    return NextResponse.json({
      sector_context: { sf_sector: a1.sf_sector, digital_maturity: a1.digital_maturity },
      skills_gap: { gaps: a2.gaps, summary: a2.summary },
      roadmap: {
        totalCost: costs.total,
        psgSavings: "Up to 50% on PSG-eligible tools",
        netCost: costs.net,
        painPointNote: `Roadmap prioritises: ${inputs.painPoints.slice(0, 2).join(" and ")}.`,
        Q1: quarters.Q1,
        Q2: quarters.Q2,
        Q3: quarters.Q3,
        Q4: quarters.Q4,
      },
      training: a4.recommendations,
      grants_summary: Object.fromEntries(
        Object.entries(psgCache.grants).map(([k, v]) => [
          k, { name: v.name, support_rate: v.support_rate, best_for: v.best_for, url: v.url }
        ])
      ),
      sea_ready: a1.digital_maturity === "high",
      cache_date: psgCache.meta.last_updated,
    });

  } catch (err) {
    console.error("[roadmap/route] pipeline error:", err.message);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}

// Block non-POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
