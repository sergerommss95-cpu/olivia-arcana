"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { experienceEntryHash, shouldRefreshSubscription, subscriptionRequestId, subscriptionState } from "@/lib/experience-subscription";

function subscribeEntry(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
function getEntry() { return experienceEntryHash(window.location.search); }
function getServerEntry() { return ""; }

/** The self-contained Olivia experience owns its viewport and scroll journey. */
export default function PersonalAlmanacHome() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const lastRequest = useRef<string | null>(null);
  const refreshPending = useRef(false);
  const mounted = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const { data, isLoading, error, refresh } = useSubscription();
  const entry = useSyncExternalStore(subscribeEntry, getEntry, getServerEntry);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const origin = window.location.origin;
    const state = subscriptionState(data, isLoading || refreshing, error || refreshFailed);
    const reply = (requestId: string, response = state) => {
      iframe.current?.contentWindow?.postMessage({
        type: "olivia:subscription:state", requestId, ...response,
      }, origin);
    };
    const onMessage = (event: MessageEvent) => {
      const requestId = subscriptionRequestId(event, origin, iframe.current?.contentWindow);
      if (requestId === null) return;
      const needsRefresh = shouldRefreshSubscription(lastRequest.current, requestId, isLoading || refreshPending.current);
      lastRequest.current = requestId;
      if (needsRefresh) {
        // Close the brief gap before React publishes the provider's loading state.
        refreshPending.current = true;
        setRefreshing(true);
        setRefreshFailed(false);
        reply(requestId, subscriptionState(null, true, null));
        void refresh().catch(() => {
          if (mounted.current) setRefreshFailed(true);
        }).finally(() => {
          refreshPending.current = false;
          if (mounted.current) setRefreshing(false);
        });
      } else {
        reply(requestId, refreshPending.current ? subscriptionState(null, true, null) : state);
      }
    };
    window.addEventListener("message", onMessage);
    // A request made while loading receives a new answer when the server responds.
    if (lastRequest.current !== null) reply(lastRequest.current);
    return () => window.removeEventListener("message", onMessage);
  }, [data, isLoading, error, refresh, refreshing, refreshFailed]);

  return (
    <main
      id="main-content"
      className="olivia-experience"
    >
      <a
        href={`/experience/index.html${entry}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-[#f5f0e5] focus:px-4 focus:py-3 focus:text-[#071522]"
      >
        Open the Olivia Arcana experience directly
      </a>
      <iframe
        ref={iframe}
        src={`/experience/index.html?site=1${entry}`}
        title="Olivia Arcana — a card, a question, a moment for yourself"
        className="olivia-experience-frame"
        loading="eager"
      />
      <noscript>
        <p className="absolute inset-x-0 bottom-0 bg-[#071522] p-4 text-center text-[#f5f0e5]">
          <a href="/experience/index.html" className="underline">
            Open the Olivia Arcana experience
          </a>
        </p>
      </noscript>
    </main>
  );
}
