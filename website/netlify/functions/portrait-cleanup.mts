// website/netlify/functions/portrait-cleanup.mts
// Every hour: delete portraits close to a day old with everything kept for them, and old daily counters.
// Scheduled functions run on the production deploy only, but the preview store is site-wide and needs the same sweep.
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { cleanup } from "../portrait/cleanup.ts";
import { STORE_NAMES } from "../portrait/store.ts";

export default async () => {
  let failure: unknown;
  for (const name of STORE_NAMES) {
    try {
      const counts = await cleanup(getStore({ name, consistency: "strong" }) as any, Date.now());
      console.log(JSON.stringify({ event: "portrait_cleanup", store: name, ...counts }));
    } catch (error) {
      failure ??= error;
      console.warn(JSON.stringify({ event: "portrait_cleanup_failed", store: name, message: (error as Error)?.message }));
    }
  }
  if (failure) throw failure;
};

export const config: Config = { schedule: "@hourly" };
