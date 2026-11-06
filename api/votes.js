/* ==========================================================
   ASTRA — live results API (Vercel serverless function)

   Stores one vote per visitor per question and returns the totals,
   so the site can show "Most users said: Medium".

   Storage: a Redis database from Vercel Storage (Upstash).
   Connecting it to the project adds these environment variables
   automatically, and this file reads whichever pair exists:
     KV_REST_API_URL + KV_REST_API_TOKEN
     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
   Without them the API answers 503 and the site simply hides
   the live-results box.

   GET  /api/votes?keys=adm-pri-0,edu-ready-3   -> { ok, counts }
   POST /api/votes { key, voter, value|null }    -> { ok, counts }
   ========================================================== */

const OPTIONS = {
  "adm-pri": ["1", "2", "3"],            // Low / Medium / High
  "edu-ready": ["doing", "try", "later"] // Already doing it / Want to try it / Not yet
};
const KEY_RE = /^(adm-pri|edu-ready)-(\d{1,2})$/;
const VOTER_RE = /^[A-Za-z0-9-]{8,64}$/;
const MAX_INDEX = 30;

function storage() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redis(cfg, commands) {
  const r = await fetch(cfg.url + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error("storage " + r.status);
  const out = await r.json();
  return out.map((x) => {
    if (x && x.error) throw new Error(x.error);
    return x ? x.result : null;
  });
}

function validKey(key) {
  const m = KEY_RE.exec(String(key || ""));
  return m && Number(m[2]) <= MAX_INDEX ? m : null;
}

function tally(values, key) {
  const opts = OPTIONS[KEY_RE.exec(key)[1]];
  const counts = {};
  opts.forEach((o) => { counts[o] = 0; });
  (values || []).forEach((v) => { if (Object.prototype.hasOwnProperty.call(counts, v)) counts[v] += 1; });
  return counts;
}

const hashName = (key) => "astra:votes:" + key;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const cfg = storage();
  if (!cfg) return res.status(503).json({ ok: false, reason: "not-configured" });

  try {
    if (req.method === "GET") {
      const keys = String((req.query && req.query.keys) || "")
        .split(",").filter((k) => validKey(k)).slice(0, 20);
      if (!keys.length) return res.status(200).json({ ok: true, counts: {} });
      const results = await redis(cfg, keys.map((k) => ["HVALS", hashName(k)]));
      const counts = {};
      keys.forEach((k, i) => { counts[k] = tally(results[i], k); });
      return res.status(200).json({ ok: true, counts });
    }

    if (req.method === "POST") {
      let body = req.body || {};
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      const { key, voter } = body;
      const value = body.value === null || body.value === undefined ? null : String(body.value);
      const m = validKey(key);
      if (!m || !VOTER_RE.test(String(voter || ""))) return res.status(400).json({ ok: false, reason: "bad-request" });
      if (value !== null && !OPTIONS[m[1]].includes(value)) return res.status(400).json({ ok: false, reason: "bad-value" });

      const h = hashName(key);
      const write = value === null ? ["HDEL", h, voter] : ["HSET", h, voter, value];
      const results = await redis(cfg, [write, ["HVALS", h]]);
      return res.status(200).json({ ok: true, counts: { [key]: tally(results[1], key) } });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, reason: "method-not-allowed" });
  } catch (e) {
    return res.status(502).json({ ok: false, reason: "storage-error" });
  }
};
