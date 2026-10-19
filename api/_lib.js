// Shared helpers for the board's API routes. Files starting with "_" are not deployed as routes.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const PASSCODE = process.env.BOARD_PASSCODE || "";
const PREFIX = (process.env.BOARD_KEY || "ilg-workshop").replace(/[^A-Za-z0-9_-]/g, "");

const hasStore = Boolean(REDIS_URL && REDIS_TOKEN);
const hasAI = Boolean(process.env.ANTHROPIC_API_KEY);

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Redis ${r.status}`);
  return j.result;
}

function authed(req) {
  if (!PASSCODE) return true;
  const given = String(req.headers["x-board-pass"] || "");
  if (given.length !== PASSCODE.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ PASSCODE.charCodeAt(i);
  return diff === 0;
}

// ?board=name on the page keeps a separate board (handy for a dry run).
function keys(req) {
  const b = String(req.headers["x-board-key"] || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const base = PREFIX + (b ? ":" + b : "");
  return { notes: base + ":notes", synth: base + ":synth" };
}

function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { redis, authed, keys, body, send, hasStore, hasAI, PASSCODE };
