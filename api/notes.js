const { redis, authed, keys, body, send, hasStore } = require("./_lib");

const COLORS = ["note", "key", "follow", "q"];

function cleanNote(n) {
  return {
    frame: Math.max(1, Math.min(6, Number(n.frame) || 1)),
    kind: n.kind === "q" ? "q" : "note",
    color: COLORS.includes(n.color) ? n.color : "note",
    text: String(n.text || "").slice(0, 5000),
    x: Math.max(0, Math.min(1, Number(n.x) || 0)),
    y: Math.max(0, Math.min(20000, Number(n.y) || 0)),
    t: Number(n.t) || Date.now(),
  };
}

// GET    all notes and the latest synthesis
// POST   {id, note} saves one note, or {synth} saves the synthesis
// DELETE ?id=... removes one note
module.exports = async (req, res) => {
  if (!hasStore) return send(res, 503, { error: "no_store" });
  if (!authed(req)) return send(res, 401, { error: "passcode" });
  const k = keys(req);
  try {
    if (req.method === "GET") {
      const flat = (await redis(["HGETALL", k.notes])) || [];
      const notes = {};
      for (let i = 0; i < flat.length; i += 2) {
        try { notes[flat[i]] = JSON.parse(flat[i + 1]); } catch (e) {}
      }
      const s = await redis(["GET", k.synth]);
      let synth = null;
      try { synth = s ? JSON.parse(s) : null; } catch (e) {}
      return send(res, 200, { notes, synth });
    }
    if (req.method === "POST") {
      const b = body(req);
      if (b.synth && typeof b.synth === "object") {
        const s = JSON.stringify(b.synth);
        if (s.length > 200000) return send(res, 400, { error: "too_large" });
        await redis(["SET", k.synth, s]);
        return send(res, 200, { ok: true });
      }
      const id = String(b.id || "");
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !b.note) return send(res, 400, { error: "bad_note" });
      await redis(["HSET", k.notes, id, JSON.stringify(cleanNote(b.note))]);
      return send(res, 200, { ok: true });
    }
    if (req.method === "DELETE") {
      const id = String((req.query && req.query.id) || "");
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return send(res, 400, { error: "bad_id" });
      await redis(["HDEL", k.notes, id]);
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: "method" });
  } catch (e) {
    return send(res, 500, { error: "store_failed" });
  }
};
