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
 */

import { NextResponse } from "next/server";
import psgCache from "@/data/psg-cache.json";

// --- Rate limiting (in-memory, resets on cold start) ---
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

// --- Single Claude call helper ---
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
      max_tokens: 2000,
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

// --- Agent prompts ---

const AGENT1_SYSTEM = `You are a Singapore SME sector classifier. 
Map the user's business to a SkillsFuture sector and identify 3 relevant job roles.
Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT2_SYSTEM = `You are a digital skills gap analyst for Singapore SMEs.
Given a sector, job roles, team size, tech level and pain points, identify the top digital skill gaps.
Reference SkillsFuture TSC codes where relevant.
Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT3_SYSTEM = `You are a Singapore SME digital transformation roadmap architect.
Build a practical 12-month roadmap using PSG-eligible tools from the provided cache.
Respond ONLY in valid JSON. No preamble. No markdown.`;

const AGENT4_SYSTEM = `You are a SkillsFuture training advisor for Singapore SMEs.
Recommend training courses aligned to the skills gaps and roadmap quarters.
Respond ONLY in valid JSON. No preamble. No markdown.`;

// --- Main handler ---
export async function POST(req) {
  // CORS — same origin only
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

  // Parse + sanitise inputs
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
    // Strip cache to essentials — don't send full JSON to every agent
    const relevantPSG = {
      grant_rate: psgCache.grant_info.max_support_rate,
      solutions: Object.fromEntries(
        Object.entries(psgCache.solutions).map(([k, v]) => [
          k,
          { category: v.category, psg_eligible: v.psg_eligible, solutions: v.solutions }
        ])
      )
    };

    // Agent 1 — Sector mapper
    const a1Raw = await callClaude(
      AGENT1_SYSTEM,
      `Business type: "${inputs.sector}"
Headcount: "${inputs.headcount}"
Return JSON: { "sf_sector": string, "job_roles": [string, string, string], "digital_maturity": "low|medium|high" }`
    );
    const a1 = parseJSON(a1Raw);

    // Agent 2 — Skills gap
    const a2Raw = await callClaude(
      AGENT2_SYSTEM,
      `Sector: "${a1.sf_sector}"
Job roles: ${JSON.stringify(a1.job_roles)}
Team size: "${inputs.headcount}"
Tech level: "${inputs.techLevel}"
Pain points: ${JSON.stringify(inputs.painPoints)}
Return JSON: { "gaps": [{ "skill": string, "priority": "high|medium", "sf_tsc": string }], "summary": string }`
    );
    const a2 = parseJSON(a2Raw);

    // Agent 3 — Roadmap
    const a3Raw = await callClaude(
      AGENT3_SYSTEM,
      `Sector: "${a1.sf_sector}" | Headcount: "${inputs.headcount}" | Budget: "${inputs.budget}"
Tech level: "${inputs.techLevel}" | Pain points: ${JSON.stringify(inputs.painPoints)}
Skills gaps: ${JSON.stringify(a2.gaps)}
PSG tools available: ${JSON.stringify(relevantPSG)}
Return JSON:
{
  "totalCost": string,
  "psgSavings": string,
  "netCost": string,
  "painPointNote": string,
  "Q1": { "title": string, "summary": string, "cost": string, "psg": string, "timeline": string, "roi": string, "tools": [string], "milestone": string, "checklist": [string] },
  "Q2": { "title": string, "summary": string, "cost": string, "psg": string, "timeline": string, "roi": string, "tools": [string], "milestone": string, "checklist": null },
  "Q3": { "title": string, "summary": string, "cost": string, "psg": string, "timeline": string, "roi": string, "tools": [string], "milestone": string, "checklist": null },
  "Q4": { "title": string, "summary": string, "cost": string, "psg": string, "timeline": string, "roi": string, "tools": [string], "milestone": string, "checklist": null }
}`
    );
    const a3 = parseJSON(a3Raw);

    // Agent 4 — Training
    const a4Raw = await callClaude(
      AGENT4_SYSTEM,
      `Skills gaps: ${JSON.stringify(a2.gaps)}
Roadmap quarters: Q1=${a3.Q1?.title}, Q2=${a3.Q2?.title}, Q3=${a3.Q3?.title}, Q4=${a3.Q4?.title}
Available courses: ${JSON.stringify(psgCache.skillsfuture_courses)}
Return JSON: { "recommendations": [{ "quarter": "Q1|Q2|Q3|Q4", "course": string, "provider": string, "funding": string, "reason": string }] }`
    );
    const a4 = parseJSON(a4Raw);

    // Return combined result — no user PII in response
    return NextResponse.json({
      sector_context: { sf_sector: a1.sf_sector, digital_maturity: a1.digital_maturity },
      skills_gap: { gaps: a2.gaps, summary: a2.summary },
      roadmap: a3,
      training: a4.recommendations,
      cache_date: psgCache.meta.last_updated,
    });

  } catch (err) {
    console.error("[roadmap/route] pipeline error:", err.message);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}

// Block non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
