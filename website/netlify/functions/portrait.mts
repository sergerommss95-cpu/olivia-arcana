// website/netlify/functions/portrait.mts
// The Birth Portrait API: admit a reading (POST /api/portrait) and report its progress (GET /api/portrait/:id).
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { createApi } from "../portrait/api.ts";
import bank from "../portrait/knowledge/bank.json" with { type: "json" };

export default async (req: Request, context: Context) => {
  const api = createApi({
    kv: getStore({ name: "portrait", consistency: "strong" }) as any,
    env: (name) => Netlify.env.get(name),
    now: () => Date.now(),
    uuid: () => crypto.randomUUID(),
    bank,
    // A background function answers 202 at once; the work continues there for up to 15 minutes.
    kick: async (id) => {
      const res = await fetch(new URL("/.netlify/functions/portrait-background", req.url), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }), signal: AbortSignal.timeout(8000) });
      if (res.status !== 202) throw new Error(`background_${res.status}`);
    },
  });
  if (req.method === "POST" && !context.params.id) return api.create(req);
  if (req.method === "GET" && context.params.id) return api.status(context.params.id);
  return new Response(null, { status: 405, headers: { allow: "GET, POST" } });
};

export const config: Config = { path: ["/api/portrait", "/api/portrait/:id"] };
