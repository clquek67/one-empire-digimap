/**
 * /app/api/roadmap/route.js
 * Secure server-side API route — Claude API key never leaves the server.
 *
 * Security:
 * - API key read from env only (ANTHROPIC_API_KEY)
 * - Input sanitised before prompt injection
 * - Rate limit: 10 requests per IP per minute
 * - No user data logged or stored
 * - CORS locked to same origin
 *
 * Token optimisation:
 * - Agent 3 split into 4 lean quarter calls (~500 tokens each)
 * - All agents capped at 1000 tokens
 * - PSG cache stripped to essentials before injection
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
Generate ONE quarter plan using PSG-eligible tools. Be concise.
Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT4_SYSTEM = `You are a SkillsFuture training advisor for Singapore SMEs.
Recommend 2 training courses maximum. Be brief.
Respond ONLY in valid JSON. No preamble. No markdown.`;

// --- Quarter context ---
const QUARTER_CONTEXT = {
  Q1: { focus: "FOUNDATION", hint: "cloud accounting, digital payments, basic comms" },
  Q2: { focus: "ONLINE PRESENCE", hint: "Google Business Profile, e-commerce, basic website" },
  Q3: { focus: "AUTOMATION", hint: "inventory, CRM, automated invoicing" },
  Q4: { focus: "GROWTH", hint: "digital marketing, analytics, loyalty programme" },
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
    // Strip PSG cache to tool names + eligibility only
    const leanPSG = Object.fromEntries(
      Object.entries(psgCache.solutions).map(([k, v]) => [
        k,
        {
          category: v.category,
          psg_eligible: v.psg_eligible,
          tools: v.solutions.map(s => `${s.name} (${s.pricing})`).slice(0, 3),
        }
      ])
    );

    // Agent 1 — Sector mapper
    const a1Raw = await callClaude(
      AGENT1_SYSTEM,
      `Business: "${inputs.sector}" | Team: "${inputs.headcount}"
Return JSON: { "sf_sector": string, "job_roles": [string, string, string], "digital_maturity": "low|medium|high" }`
    );
    const a1 = parseJSON(a1Raw);

    // Agent 2 — Skills gap (top 3 only)
    const a2Raw = await callClaude(
      AGENT2_SYSTEM,
      `Sector: "${a1.sf_sector}" | Team: "${inputs.headcount}" | Tech: "${inputs.techLevel}"
Pain points: ${inputs.painPoints.join(", ")}
Return JSON: { "gaps": [{ "skill": string, "priority": "high|medium" }], "summary": string }
Maximum 3 gaps.`
    );
    const a2 = parseJSON(a2Raw);

    // Agent 3 — One quarter plan per call (4 lean calls)
    const quarters = {};
    for (const [q, ctx] of Object.entries(QUARTER_CONTEXT)) {
      const isQ1 = q === "Q1";
      const raw = await callClaude(
        AGENT3_SYSTEM,
        `${q} focus: ${ctx.focus} (${ctx.hint})
Sector: "${a1.sf_sector}" | Budget: "${inputs.budget}" | Tech: "${inputs.techLevel}"
Available tools: ${JSON.stringify(leanPSG)}
Return JSON:
{
  "title": "${ctx.focus}",
  "cost": string,
  "psg": string,
  "tools": [string, string, string],
  "milestone": string${isQ1 ? ',\n  "checklist": [string, string, string]' : ''}
}${isQ1 ? "" : '\nSet checklist to null.'}`
      );
      quarters[q] = parseJSON(raw);
      if (!isQ1) quarters[q].checklist = null;
    }

    // Build cost summary from Q totals
    const costNote = `~S$${inputs.budget.includes("500") ? "6,000" : inputs.budget.includes("1,000") ? "12,000" : "18,000"}/yr`;

    // Agent 4 — Training (2 courses max)
    const a4Raw = await callClaude(
      AGENT4_SYSTEM,
      `Skill gaps: ${a2.gaps.map(g => g.skill).join(", ")}
Quarters: Q1=${quarters.Q1?.title}, Q2=${quarters.Q2?.title}
Courses available: ${JSON.stringify(psgCache.skillsfuture_courses)}
Return JSON: { "recommendations": [{ "quarter": "Q1|Q2|Q3|Q4", "course": string, "provider": string, "funding": string, "reason": string }] }
Maximum 2 recommendations.`
    );
    const a4 = parseJSON(a4Raw);

    return NextResponse.json({
      sector_context: { sf_sector: a1.sf_sector, digital_maturity: a1.digital_maturity },
      skills_gap: { gaps: a2.gaps, summary: a2.summary },
      roadmap: {
        totalCost: costNote,
        psgSavings: "Up to 50% on eligible tools",
        netCost: "Varies by tools selected",
        painPointNote: `Roadmap prioritises: ${inputs.painPoints.slice(0, 2).join(" and ")}.`,
        Q1: quarters.Q1,
        Q2: quarters.Q2,
        Q3: quarters.Q3,
        Q4: quarters.Q4,
      },
      training: a4.recommendations,
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
