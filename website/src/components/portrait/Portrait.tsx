// website/src/components/portrait/Portrait.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { birthChart } from "@/lib/astrology/chart.js";
import { loadPlaces, searchPlaces, type Place } from "@/lib/astrology/places";
import { loadProfile } from "@/lib/astrology/profile";
import type { MajorCard } from "@/lib/astrology/deck";
import { arkanPortrait } from "@/lib/portrait/arkan.js";
import { nameNumbers } from "@/lib/portrait/numbers.js";
import { signsThroughDay } from "@/lib/portrait/uncertain.js";
import { buildPacket } from "@/lib/portrait/packet.js";
import { litPositions } from "@/lib/portrait/lattice.js";
import { forgetSaved, listSaved, loadSaved, savePortrait } from "@/lib/portrait/saved.js";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { forgetInvite, pollPortrait, readInviteFromHash, rememberInvite, rememberJob, settleJob, startPortrait, storedInvite, storedJob, type PortraitPacket, type PortraitStages, type PortraitStatus } from "./client";
import Laying, { type Frames } from "./Laying";
import LatticeDock, { measureLaying, type Landing } from "./LatticeDock";
import Reader, { hasMaps, passageRefs, sectionStates, type SectionKey } from "./Reader";
import ChapterRail from "./ChapterRail";
import WhyDrawer, { type WhyTarget } from "./WhyDrawer";
import Keep from "./Keep";
import Confirm from "./Confirm";
import SavedList, { SAVED_TITLE_ID, type SavedSummary } from "./SavedList";
import styles from "./portrait.module.css";
import readerStyles from "./reader.module.css";

type Teachings = PortraitStatus["teachings"];
/**
 * A reading being written or reopened. `resumed` is a reading found in storage
 * on load: it waits briefly for its first status, so a finished one opens
 * straight into the reader. One stored before packets were kept has no packet,
 * and no Laying or dock. A kept reading (one saved on this device, or the
 * example) is read from what is in hand: no server, no network.
 */
type Phase =
  | { kind: "form" }
  | { kind: "working"; id: string; packet: PortraitPacket | null; status: PortraitStatus | null; resumed: boolean }
  | { kind: "kept"; source: "saved" | "example"; id: string; packet: PortraitPacket; stages: PortraitStages; teachings: Teachings }
  | { kind: "error"; code: string };
/** A question asked before something is lost. */
type Asking = { kind: "new" } | { kind: "forget"; id: string; title: string; from: "reader" | "list" };
type Saved = { id: string; packet?: { factors?: unknown }; stages?: PortraitStages; teachings?: Teachings };
/** A saved portrait named in the address: `#saved=<id>`. */
const SAVED_HASH = /[#&]saved=([^&]+)/;
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
  /** The passage the Why drawer explains, and the button that opened it. */
  const [why, setWhy] = useState<WhyTarget | null>(null);
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
  /** Whether the reading on screen is saved on this device now. */
  const [kept, setKept] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  /** Said through the reader's live region; `n` tells a repeat apart. */
  const [announce, setAnnounce] = useState<{ text: string; n: number } | null>(null);
  const [saved, setSaved] = useState<SavedSummary[]>([]);
  /** Said (and shown) on the entry screen: a portrait forgotten, or one that could not be opened. */
  const [entrySaid, setEntrySaid] = useState("");
  const [example, setExample] = useState<"idle" | "busy" | "failed">("idle");
  const entryTitle = useRef<HTMLHeadingElement>(null);
  const backToEntry = useRef(false);
  /** Where focus goes once the next render has landed (the control that replaced the one pressed). */
  const focusNext = useRef<(() => HTMLElement | null) | null>(null);
  const entryTimer = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const graceTimer = useRef(0);
  const submitting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    setSaved(listSaved() as SavedSummary[]);
    // A saved portrait opened from the other language's page (the address keeps it until the
    // reader leaves, so a reload reopens it); otherwise a reading in progress goes straight to
    // the reader. Every setState below lands in the same render.
    const savedFromHash = SAVED_HASH.exec(window.location.hash);
    if (savedFromHash) {
      openSaved(decodeURIComponent(savedFromHash[1]));
    } else {
      const job = storedJob();
      if (job) follow(job.id, job.packet ?? null, true);
    }
    const fromHash = readInviteFromHash();
    if (fromHash) setInvite(fromHash);
    setHasInvite(Boolean(fromHash ?? storedInvite()));
    const now = new Date();
    const two = (n: number) => String(n).padStart(2, "0");
    setMaxDate(`${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`);
    const profile = loadProfile();
    if (profile) { setDate(profile.date); setTime(profile.time ?? ""); setUnknownTime(!profile.time); setPlace(profile.place); setQuery(profile.place[locale] ?? profile.place.en); }
    loadPlaces().then(setPlaces);
    return () => { mounted.current = false; abort.current?.abort(); window.clearTimeout(graceTimer.current); window.clearTimeout(entryTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    target()?.focus();
  });

  // Back on the entry screen from a reading: it opens at its top, with focus on its heading.
  useLayoutEffect(() => {
    if (phase.kind !== "form" || !backToEntry.current) return;
    backToEntry.current = false;
    window.scrollTo(0, 0);
    entryTitle.current?.focus({ preventScroll: true });
  }, [phase.kind]);

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
    setWhy(null);
    setSection("opening");
    setAnnounce(null);
    setKept((listSaved() as SavedSummary[]).some((x) => x.id === id));
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

  const k = t.keeping;
  const say = (text: string) => setAnnounce((was) => ({ text, n: (was?.n ?? 0) + 1 }));
  /** The entry screen's live region is mounted with the screen: what it says lands a moment later. */
  const sayOnEntry = (text: string) => {
    window.clearTimeout(entryTimer.current);
    setEntrySaid("");
    entryTimer.current = window.setTimeout(() => setEntrySaid(text), 400);
  };
  const refreshSaved = () => setSaved(listSaved() as SavedSummary[]);

  /** To the entry screen, its heading focused; a saved portrait's address is let go. */
  function toEntry() {
    if (SAVED_HASH.test(window.location.hash)) history.replaceState(null, "", window.location.pathname + window.location.search);
    backToEntry.current = true;
    refreshSaved();
    setAsking(null);
    setWhy(null);
    setLanding(null);
    setAnnounce(null);
    setKept(false);
    setPhase({ kind: "form" });
  }
  /** A new portrait: the stored reading is forgotten. */
  function reset() { abort.current?.abort(); window.clearTimeout(graceTimer.current); rememberJob(null); setFirstName(""); toEntry(); }

  /** A saved portrait or the example, read from what is in hand; the stored reading in progress, if any, is left alone. */
  function openKept(source: "saved" | "example", reading: { id: string; packet: PortraitPacket; stages: PortraitStages; teachings: Teachings }) {
    abort.current?.abort();
    window.clearTimeout(graceTimer.current);
    setLanding(null);
    setActive(null);
    setWhy(null);
    setSection("opening");
    setFirstName("");
    setAnnounce(null);
    setEntrySaid("");
    setKept(source === "saved");
    setPhase({ kind: "kept", source, ...reading });
  }

  function openSaved(id: string) {
    const entry = loadSaved(id) as Saved | null;
    if (!entry?.stages?.a || typeof entry.stages.a.title !== "string") { refreshSaved(); sayOnEntry(t.saved.missing); return; }
    const packet = entry.packet && Array.isArray(entry.packet.factors) ? (entry.packet as PortraitPacket) : NO_PACKET;
    openKept("saved", { id: entry.id, packet, stages: entry.stages, teachings: entry.teachings ?? {} });
  }

  async function openExample() {
    if (example === "busy") return;
    setExample("busy");
    try {
      const res = await fetch(`/portrait/example-${locale}.json`);
      if (!res.ok) throw new Error(`http_${res.status}`);
      const body = (await res.json()) as { packet: PortraitPacket; stages: PortraitStages; teachings?: Teachings };
      if (!mounted.current) return;
      setExample("idle");
      openKept("example", { id: `example-${locale}`, packet: body.packet, stages: body.stages, teachings: body.teachings ?? {} });
    } catch {
      if (mounted.current) setExample("failed");
    }
  }

  /** The finished reading on screen, as it would be saved. */
  function onScreen() {
    if (phase.kind === "kept") return { id: phase.id, packet: phase.packet, stages: phase.stages, teachings: phase.teachings };
    if (phase.kind === "working" && phase.status?.stages.a) return { id: phase.id, packet: phase.packet ?? NO_PACKET, stages: phase.status.stages, teachings: phase.status.teachings };
    return null;
  }

  /** Saves the reading on screen: only the packet, the stages and the cited teachings. */
  function save() {
    const reading = onScreen();
    if (!reading || !savePortrait({ ...reading, locale })) { say(k.saveFailed); return false; }
    setKept(true);
    say(k.savedHere);
    return true;
  }

  /** Leaving a reading: a kept one leaves the stored reading alone; a live one is forgotten with it. */
  function depart() { if (phase.kind === "kept") toEntry(); else reset(); }
  /** "Start a new portrait": a finished reading not saved asks first; the example never does. */
  function onNew() {
    const finished = phase.kind === "kept" || (phase.kind === "working" && phase.status?.status === "done");
    const isExample = phase.kind === "kept" && phase.source === "example";
    if (finished && !kept && !isExample) setAsking({ kind: "new" });
    else depart();
  }

  function forget(target: { id: string; title: string; from: "reader" | "list" }) {
    setAsking(null);
    forgetSaved(target.id);
    refreshSaved();
    if (target.from === "reader") {
      // The reading stays on screen, so saving it again is one press away.
      setKept(false);
      say(k.forgotten);
      focusNext.current = () => document.querySelector<HTMLElement>("[data-keep-save]");
    } else {
      sayOnEntry(k.forgotten);
      focusNext.current = () => document.getElementById(SAVED_TITLE_ID) ?? entryTitle.current;
    }
  }

  const dialog = asking && (asking.kind === "new" ? (
    <Confirm title={k.confirmNew.title} body={k.confirmNew.body} onCancel={() => setAsking(null)} choices={[
      { label: k.confirmNew.save, tone: "primary", first: true, onChoose: () => { setAsking(null); if (save()) { depart(); sayOnEntry(k.savedHere); } } },
      { label: k.confirmNew.start, tone: "plain", onChoose: () => { setAsking(null); depart(); } },
      { label: k.confirmNew.stay, tone: "quiet", onChoose: () => setAsking(null) },
    ]} />
  ) : (
    <Confirm title={k.confirmForget.title} body={k.confirmForget.body.replace("{title}", asking.title)} onCancel={() => setAsking(null)} choices={[
      { label: k.confirmForget.keep, tone: "plain", first: true, onChoose: () => setAsking(null) },
      { label: k.confirmForget.forget, tone: "primary", onChoose: () => forget(asking) },
    ]} />
  ));

  /** The reader with its dock and rail: a live reading, a saved one, or the example. */
  function reading(view: { id: string; packet: PortraitPacket | null; stages: PortraitStages; status: PortraitStatus | null; teachings: Teachings; source: "live" | "saved" | "example" }) {
    const packet = view.packet ?? NO_PACKET;
    const { stages, status, source } = view;
    // While the Why drawer is open, the dock keeps the cards of the passage it explains.
    const shown = why?.key ?? active;
    const lit = shown ? litPositions(passageRefs(stages, shown), packet) : null;
    const isExample = source === "example";
    const keep = status?.status === "done" && !isExample ? (
      <Keep locale={locale} reopened={source === "saved"} kept={kept} packet={packet} stages={stages} teachings={view.teachings} cards={cards}
        onSave={save} onForget={() => setAsking({ kind: "forget", id: view.id, title: stages.a?.title ?? "", from: "reader" })} onSay={say} />
    ) : undefined;
    return (
      <div key={view.id} className={readerStyles.reading} data-reader="" data-example={isExample || undefined}>
        <div className={readerStyles.dockbar}>
          {view.packet && hasMaps(packet) && <LatticeDock packet={packet} cards={cards} locale={locale} lit={lit} landing={landing ?? undefined} note={isExample ? t.example.label : undefined} />}
          <ChapterRail locale={locale} states={sectionStates(stages, status?.status === "failed", hasMaps(packet))} current={section} />
        </div>
        <Reader stages={stages} status={status} packet={packet} cards={cards} locale={locale} firstName={firstName || undefined}
          kicker={isExample ? t.example.label : undefined} keep={keep} newLabel={isExample ? t.example.leave : undefined} announce={announce}
          onActive={setActive} onSection={setSection} onWhy={(key, trigger) => setWhy({ key, trigger })} onNew={onNew} />
        {why && <WhyDrawer target={why} stages={stages} teachings={view.teachings} packet={packet} cards={cards} locale={locale} frames={frames} onClose={() => setWhy(null)} />}
        {dialog}
      </div>
    );
  }

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

    return reading({ id: phase.id, packet: phase.packet, stages, status: s, teachings: s?.teachings ?? {}, source: "live" });
  }

  if (phase.kind === "kept") {
    return reading({ ...phase, status: { status: "done", stages: phase.stages, teachings: phase.teachings, error: null } });
  }

  return (
    <section className={styles.page} data-portrait-entry="">
      <p className={styles.kicker}>{t.kicker}</p>
      <h1 ref={entryTitle} tabIndex={-1} className={styles.title}>{t.title}</h1>
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
      {hasInvite !== null && (
        <>
          <p className={styles.example}>
            <button type="button" className={styles.exampleButton} aria-busy={example === "busy" || undefined} onClick={openExample}>{example === "busy" ? t.example.opening : t.example.open}</button>
          </p>
          {example === "failed" && <p className={styles.error} role="alert">{t.example.failed}</p>}
          {saved.length > 0 && (
            <SavedList locale={locale} items={saved} onOpen={openSaved} onForget={(item) => setAsking({ kind: "forget", id: item.id, title: item.title, from: "list" })} />
          )}
        </>
      )}
      <p className={styles.status} role="status">{entrySaid}</p>
      <p className={styles.note}>{t.note}</p>
      <div className={styles.deck} aria-hidden="true">
        {cards.slice(0, 3).map((c) => (
          // eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail
          <img key={c.id} src={c.thumb} alt="" loading="lazy" />
        ))}
      </div>
      {dialog}
    </section>
  );
}
