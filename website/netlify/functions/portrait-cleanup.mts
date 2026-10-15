// website/netlify/functions/portrait-cleanup.mts
// Every hour: delete portraits close to a day old with everything kept for them, and old daily counters.
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { cleanup } from "../portrait/cleanup.ts";

export default async () => {
  const kv = getStore({ name: "portrait", consistency: "strong" }) as any;
  const counts = await cleanup(kv, Date.now());
  console.log(JSON.stringify({ event: "portrait_cleanup", ...counts }));
};

export const config: Config = { schedule: "@hourly" };
