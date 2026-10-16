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
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { forgetInvite, pollPortrait, readInviteFromHash, rememberInvite, rememberJob, startPortrait, storedInvite, storedJob, type PortraitPacket, type PortraitStatus } from "./client";
import Laying, { type Frames } from "./Laying";
import styles from "./portrait.module.css";

/** A reading resumed from an id stored before packets were kept has no packet, and no Laying. */
type Phase = { kind: "form" } | { kind: "working"; id: string; packet: PortraitPacket | null; status: PortraitStatus | null } | { kind: "error"; code: string };
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
  /** True once the Laying has handed over to the reader (stage A has arrived). */
  const [settled, setSettled] = useState(false);
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
  const submitting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    // A reading in progress goes straight to the reader; every setState below lands in the same render.
    const job = storedJob();
    if (job) follow(job.id, job.packet ?? null);
    const fromHash = readInviteFromHash();
    if (fromHash) setInvite(fromHash);
    setHasInvite(Boolean(fromHash ?? storedInvite()));
    const now = new Date();
    const two = (n: number) => String(n).padStart(2, "0");
    setMaxDate(`${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`);
    const profile = loadProfile();
    if (profile) { setDate(profile.date); setTime(profile.time ?? ""); setUnknownTime(!profile.time); setPlace(profile.place); setQuery(profile.place[locale] ?? profile.place.en); }
    loadPlaces().then(setPlaces);
    return () => { mounted.current = false; abort.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = useMemo(() => (place && query === (place[locale] ?? place.en) ? [] : searchPlaces(places, query, 6)), [places, query, place, locale]);
  const needsLatin = useMemo(() => Boolean(date) && nameNumbers({ date, name }).status === "needs-latin", [date, name]);

  function follow(id: string, packet: PortraitPacket | null) {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setSettled(false);
    setPhase({ kind: "working", id, packet, status: null });
    pollPortrait(id, (status) => {
      if (controller.signal.aborted) return;
      setPhase({ kind: "working", id, packet, status });
      // A client-side give-up is resumable: the job may still be running, so keep its id.
      if (status.status === "failed" && !status.resumable) rememberJob(null);
      // The packet is kept only while the reading is being written.
      if (status.status === "done") rememberJob({ id });
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
        follow(started.id, packet);
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function reset() { abort.current?.abort(); rememberJob(null); setFirstName(""); setPhase({ kind: "form" }); }

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
    const a = s?.stages.a, b = s?.stages.b, c = s?.stages.c;
    const over = s?.status === "done" || s?.status === "failed";
    // The Laying holds the page until stage A has landed; a failure before then goes to the notice below.
    if (phase.packet && !settled && !(s?.status === "failed" && !a)) {
      return <Laying packet={phase.packet} cards={cards} locale={locale} status={s} frames={frames} firstName={firstName || undefined} onSettled={() => setSettled(true)} />;
    }
    return (
      <article className={styles.page} aria-busy={!over}>
        {!a && !over && (
          <div className={styles.waiting} role="status">
            <p className={styles.kicker}>{t.writing}</p>
            <p className={styles.hint}>{t.writingHint}</p>
            <ol className={styles.stages}>{(["a", "b", "c"] as const).map((k) => <li key={k} data-done={Boolean(s?.stages[k])}>{t.stages[k]}</li>)}</ol>
          </div>
        )}
        {a && (
          <header className={`${styles.reveal} ${styles.head}`}>
            <h1 className={styles.title}>{a.title}</h1>
            <p className={styles.epigraph}>{a.epigraph}</p>
            <p className={styles.overview}>{a.overview.text}</p>
          </header>
        )}
        {a && Object.entries(a.facets).map(([key, facet]) => (
          <section key={key} className={`${styles.reveal} ${styles.facet}`}>
            <h2>{facet.heading}</h2>
            <p>{facet.text}</p>
          </section>
        ))}
        {[b, c].map((stage, i) => stage && Object.entries(stage.chapters).map(([key, ch]) => (
          <section key={`${i}-${key}`} className={`${styles.reveal} ${styles.chapter}`}>
            <h2>{ch.title}</h2>
            <p className={styles.lede}>{ch.lede}</p>
            {ch.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            <p className={styles.practice}>{ch.practice}</p>
          </section>
        )))}
        {c?.keep && (
          <section className={`${styles.reveal} ${styles.keep}`}>
            <h2>{t.keep}</h2>
            <ul>{c.keep.map((line, i) => <li key={i}>{line}</li>)}</ul>
          </section>
        )}
        {s?.status === "failed" && <p className={styles.error} role="alert">{t.errors[failureKey(s.error)]}</p>}
        {over && (
          <footer className={styles.footer}>
            <p className={styles.note}>{t.note}</p>
            <button className={styles.button} onClick={reset}>{t.again}</button>
          </footer>
        )}
      </article>
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
