const { send, authed, hasStore, hasAI, PASSCODE } = require("./_lib");

// Tells the page what is switched on, so it can fall back gracefully.
module.exports = (req, res) => {
  send(res, 200, { ok: true, store: hasStore, ai: hasAI, auth: Boolean(PASSCODE), authed: authed(req) });
};
