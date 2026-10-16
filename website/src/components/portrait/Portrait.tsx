// website/src/components/portrait/Portrait.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { birthChart } from "@/lib/astrology/chart.js";
import { loadPlaces, searchPlaces, type Place } from "@/lib/astrology/places";
import { loadProfile } from "@/lib/astrology/profile";
import type { MajorCard } from "@/lib/astrology/deck";
import { arkanPortrait } from "@/lib/portrait/arkan.js";
import { nameNumbers } from "@/lib/portrait/numbers.js";
import { signsThroughDay } from "@/lib/portrait/uncertain.js";
import { buildPacket } from "@/lib/portrait/packet.js";
import { litPositions } from "@/lib/portrait/lattice.js";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { forgetInvite, pollPortrait, readInviteFromHash, rememberInvite, rememberJob, settleJob, startPortrait, storedInvite, storedJob, type PortraitPacket, type PortraitStatus } from "./client";
import Laying, { type Frames } from "./Laying";
import LatticeDock, { measureLaying, type Landing } from "./LatticeDock";
import Reader, { passageRefs, sectionStates, type SectionKey } from "./Reader";
import ChapterRail from "./ChapterRail";
import styles from "./portrait.module.css";
import readerStyles from "./reader.module.css";

/**
 * A reading being written or reopened. `resumed` is a reading found in storage
 * on load: it waits briefly for its first status, so a finished one opens
 * straight into the reader. One stored before packets were kept has no packet,
 * and no Laying or dock.
 */
type Phase = { kind: "form" } | { kind: "working"; id: string; packet: PortraitPacket | null; status: PortraitStatus | null; resumed: boolean } | { kind: "error"; code: string };
/** How long a reopened reading waits for its first status before the Laying starts anyway. */
const FIRST_STATUS_GRACE = 1200;
const NO_PACKET: PortraitPacket = { v: 1, locale: "en", timeKnown: false, factors: [] };
type ErrorKey = keyof (typeof PORTRAIT_COPY)["en"]["errors"];

/** The copy for a finished-but-failed reading: timeout and missing are their own; "unconfigured" is a pause; the rest is "failed". */
function failureKey(error: string | null): ErrorKey {
  if (error === "timeout") return "timeout";
  if (error === "missing") return "missing";
  if (error === "unconfigured") return "paused";
  return "failed";
}

export default function Portrait({ locale, cards, frames }: { locale: PortraitLocale; cards: MajorCard[]; frames: Frames }) {
  const t = PORTRAIT_COPY[locale];
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  /** Where the Laying's cards lay when stage A arrived: the dock's cards fly from there. */
  const [landing, setLanding] = useState<Landing | null>(null);
  /** False while a reopened reading waits for its first status. */
  const [grace, setGrace] = useState(true);
  /** The passage lighting the dock, and the section crossing the reading line. */
  const [active, setActive] = useState<string | null>(null);
  const [section, setSection] = useState<SectionKey>("opening");
  /** For the Laying's kicker only: kept in memory, never stored. */
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [latin, setLatin] = useState("");
  const [date, setDate] = useState("");
  const [maxDate, setMaxDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [invite, setInvite] = useState("");
  /** null until the page has mounted and storage has been read; the invite field shows only when false. */
  const [hasInvite, setHasInvite] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const graceTimer = useRef(0);
  const submitting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    // A reading in progress goes straight to the reader; every setState below lands in the same render.
    const job = storedJob();
    if (job) follow(job.id, job.packet ?? null, true);
    const fromHash = readInviteFromHash();
    if (fromHash) setInvite(fromHash);
    setHasInvite(Boolean(fromHash ?? storedInvite()));
    const now = new Date();
    const two = (n: number) => String(n).padStart(2, "0");
    setMaxDate(`${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`);
    const profile = loadProfile();
    if (profile) { setDate(profile.date); setTime(profile.time ?? ""); setUnknownTime(!profile.time); setPlace(profile.place); setQuery(profile.place[locale] ?? profile.place.en); }
    loadPlaces().then(setPlaces);
    return () => { mounted.current = false; abort.current?.abort(); window.clearTimeout(graceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = useMemo(() => (place && query === (place[locale] ?? place.en) ? [] : searchPlaces(places, query, 6)), [places, query, place, locale]);
  const needsLatin = useMemo(() => Boolean(date) && nameNumbers({ date, name }).status === "needs-latin", [date, name]);

  function follow(id: string, packet: PortraitPacket | null, resumed: boolean) {
    abort.current?.abort();
    window.clearTimeout(graceTimer.current);
    const controller = new AbortController();
    abort.current = controller;
    let opened = false;
    setLanding(null);
    setActive(null);
    setSection("opening");
    setGrace(!resumed);
    if (resumed) graceTimer.current = window.setTimeout(() => setGrace(true), FIRST_STATUS_GRACE);
    setPhase({ kind: "working", id, packet, status: null, resumed });
    pollPortrait(id, (status) => {
      if (controller.signal.aborted) return;
      // Stage A hands over from the Laying to the reader: its cards are measured where they lie,
      // in the same update that swaps them for the dock. A reading reopened after A has no Laying.
      if (status.stages.a && !opened) {
        opened = true;
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const lay = still ? {} : measureLaying();
        setLanding(Object.keys(lay).length ? lay : null);
      }
      setPhase({ kind: "working", id, packet, status, resumed });
      // The stored reading stays after it finishes, so a reload reopens it; an unknown or expired one is forgotten.
      settleJob(status);
    }, controller.signal);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !place || !date) return;
    submitting.current = true;
    setBusy(true);
    setFormError(null);
    try {
      const code = invite.trim() || storedInvite() || "";
      const birth = { date, time: unknownTime ? null : time || null, zone: place.zone, latitude: place.lat, longitude: place.lon };
      let packet: PortraitPacket;
      try {
        const numbers = nameNumbers({ date, name, latin: needsLatin ? latin : "" });
        if (name.trim() && numbers.status !== "calculated") { setFormError(t.latinNeeded); return; }
        packet = buildPacket({
          locale,
          chart: birthChart(birth),
          arkan: arkanPortrait(date),
          numbers,
          daySigns: birth.time ? null : signsThroughDay({ date, zone: place.zone }),
        });
      } catch {
        setPhase({ kind: "error", code: "packet" });
        return;
      }
      const started = await startPortrait(packet, code);
      if ("error" in started) {
        if (started.error === "invite") forgetInvite();
        if (!mounted.current) return;
        if (started.error === "invite") { setHasInvite(false); setInvite(""); }
        setPhase({ kind: "error", code: started.error });
        return;
      }
      rememberInvite(code);
      rememberJob({ id: started.id, packet });
      if (mounted.current) {
        setFirstName(name.trim().split(/\s+/)[0] ?? "");
        follow(started.id, packet, false);
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  /** A new portrait: the stored reading is forgotten. */
  function reset() { abort.current?.abort(); window.clearTimeout(graceTimer.current); rememberJob(null); setFirstName(""); setLanding(null); setPhase({ kind: "form" }); }

  if (phase.kind === "error") {
    return (
      <section className={styles.page}>
        <p className={styles.error} role="alert">{t.errors[phase.code as ErrorKey] ?? t.errors.generic}</p>
        <button className={styles.button} onClick={reset}>{t.again}</button>
      </section>
    );
  }

  if (phase.kind === "working") {
    const s = phase.status;
    const stages = s?.stages ?? {};
    if (!stages.a) {
      // A failure before the opening was written: nothing to keep, one way on.
      if (s?.status === "failed") {
        return (
          <section className={styles.page}>
            <p className={styles.error} role="alert">{t.errors[failureKey(s.error)]}</p>
            <button className={styles.button} onClick={reset}>{t.again}</button>
          </section>
        );
      }
      if (phase.resumed && !s && !grace) return <section className={`${styles.page} ${styles.hold}`} aria-busy="true" />;
      if (phase.packet) return <Laying packet={phase.packet} cards={cards} locale={locale} status={s} frames={frames} firstName={firstName || undefined} />;
      return (
        <section className={styles.page}>
          <div className={styles.waiting} role="status">
            <p className={styles.kicker}>{t.writing}</p>
            <p className={styles.hint}>{t.writingHint}</p>
            <ol className={styles.stages}>{(["a", "b", "c"] as const).map((k) => <li key={k} data-done={Boolean(stages[k])}>{t.stages[k]}</li>)}</ol>
          </div>
        </section>
      );
    }

    const packet = phase.packet ?? NO_PACKET;
    const lit = active ? litPositions(passageRefs(stages, active), packet) : null;
    return (
      <div className={readerStyles.reading} data-reader="">
        <div className={readerStyles.dockbar}>
          {phase.packet && <LatticeDock packet={phase.packet} cards={cards} locale={locale} lit={lit} landing={landing ?? undefined} />}
          <ChapterRail locale={locale} states={sectionStates(stages, s?.status === "failed")} current={section} />
        </div>
        {/* "Why this" opens the Why drawer once it exists (M3 Task 4). */}
        <Reader stages={stages} status={s} packet={packet} cards={cards} locale={locale} firstName={firstName || undefined}
          onActive={setActive} onSection={setSection} onWhy={() => {}} onNew={reset} />
      </div>
    );
  }

  return (
    <section className={styles.page}>
      <p className={styles.kicker}>{t.kicker}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.lede}</p>
      {hasInvite !== null && (
        <form className={styles.form} onSubmit={submit} aria-busy={busy}>
          <label>{t.name}<input value={name} onChange={(e) => { setName(e.target.value); setFormError(null); }} autoComplete="name" required /></label>
          {needsLatin && <label>{t.latin}<input value={latin} onChange={(e) => { setLatin(e.target.value); setFormError(null); }} pattern="[A-Za-zÀ-ž .'’\-]+" required /><small>{t.latinHint}</small></label>}
          <div className={styles.row}>
            <label>{t.date}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} min="1800-01-01" max={maxDate} required /></label>
            <label>{t.time}<input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={unknownTime} required={!unknownTime} /></label>
          </div>
          <label className={styles.check}><input type="checkbox" checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} />{t.unknown}</label>
          <label>{t.place}
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPlace(null); }} placeholder={t.placeHint} autoComplete="off" required />
          </label>
          {matches.length > 0 && (
            <ul className={styles.places}>
              {matches.map((p) => (
                <li key={`${p.en}-${p.lat}`}><button type="button" onClick={() => { setPlace(p); setQuery(p[locale] ?? p.en); }}>{p[locale] ?? p.en}<span>{locale === "uk" ? p.countryUk : p.countryEn}</span></button></li>
              ))}
            </ul>
          )}
          {hasInvite === false && <label>{t.invite}<input value={invite} onChange={(e) => setInvite(e.target.value)} autoComplete="off" required /></label>}
          {formError && <p className={styles.error} role="alert">{formError}</p>}
          <button className={styles.button} type="submit" disabled={!place || busy}>{busy ? t.preparing : t.begin}</button>
        </form>
      )}
      <p className={styles.note}>{t.note}</p>
      <div className={styles.deck} aria-hidden="true">
        {cards.slice(0, 3).map((c) => (
          // eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail
          <img key={c.id} src={c.thumb} alt="" loading="lazy" />
        ))}
      </div>
    </section>
  );
}
