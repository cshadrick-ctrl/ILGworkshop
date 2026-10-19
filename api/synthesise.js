const { authed, body, send, hasAI } = require("./_lib");

function parseJSON(t) {
  try { return JSON.parse(t); } catch (e) {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a > -1 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

// POST {prompt}: sends the board's notes to Claude and returns the parsed JSON it writes back.
module.exports = async (req, res) => {
  if (!hasAI) return send(res, 503, { error: "no_ai" });
  if (!authed(req)) return send(res, 401, { error: "passcode" });
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  const prompt = String(body(req).prompt || "");
  if (!prompt || prompt.length > 250000) return send(res, 400, { error: "bad_prompt" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: "ai_failed", detail: (j.error && j.error.message) || String(r.status) });
    const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    const data = parseJSON(text);
    if (!data) return send(res, 502, { error: "invalid_json" });
    return send(res, 200, { data });
  } catch (e) {
    return send(res, 500, { error: "ai_failed" });
  }
};
