// website/src/components/portrait/Portrait.tsx
"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { birthChart } from "@/lib/astrology/chart.js";
import { loadPlaces, type Place } from "@/lib/astrology/places";
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
import PlaceField, { placeName } from "./PlaceField";
import { portraitFonts } from "./fonts";
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
  | { kind: "kept"; source: "saved" | "example"; id: string; packet: PortraitPacket; stages: PortraitStages; teachings: Teachings };
/** A question asked before something is lost. */
type Asking = { kind: "new" } | { kind: "forget"; id: string; title: string; from: "reader" | "list" };
type Saved = { id: string; packet?: { factors?: unknown }; stages?: PortraitStages; teachings?: Teachings };
/** A saved portrait named in the address: `#saved=<id>`. */
const SAVED_HASH = /[#&]saved=([^&]+)/;
/** How long a reopened reading waits for its first status before the Laying starts anyway. */
const FIRST_STATUS_GRACE = 1200;
const NO_PACKET: PortraitPacket = { v: 1, locale: "en", timeKnown: false, factors: [] };
type ErrorKey = keyof (typeof PORTRAIT_COPY)["en"]["errors"];
/** The form's fields, in the order an error takes focus to them. */
const FIELDS = ["name", "latin", "date", "time", "place", "invite"] as const;
type FieldKey = (typeof FIELDS)[number];
type Invalid = Partial<Record<FieldKey, string>>;
/** A name in Latin letters, as the Latin field's pattern says. */
const LATIN_PATTERN = "[A-Za-zÀ-ž .'’\\-]+";
const LATIN = new RegExp(`^${LATIN_PATTERN}$`);
/** A view opened from the entry screen with its own history entry, so Back returns to the entry. */
type View = { portrait: "saved"; id: string } | { portrait: "example" };
type Arrival = "push" | "history" | "address";

/** A start that was turned away, said in the notice: the API's own codes, "unconfigured" as a pause, any other HTTP status as one. */
function noticeKey(code: string): ErrorKey {
  if (code === "unconfigured") return "paused";
  if (code in PORTRAIT_COPY.en.errors) return code as ErrorKey;
  return code.startsWith("http_") ? "http" : "generic";
}

/** The copy for a finished-but-failed reading: timeout and missing are their own; "unconfigured" is a pause; the rest is "failed". */
function failureKey(error: string | null): ErrorKey {
  if (error === "timeout") return "timeout";
  if (error === "missing") return "missing";
  if (error === "unconfigured") return "paused";
  return "failed";
}

type PortraitProps = { locale: PortraitLocale; cards: MajorCard[]; frames: Frames };

/** The portrait's root: it carries the label face to every phase, and lays out nothing itself. */
export default function Portrait(props: PortraitProps) {
  return <div className={`${portraitFonts.className} ${styles.root}`}><Phases {...props} /></div>;
}

function Phases({ locale, cards, frames }: PortraitProps) {
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
  /** Each field's error after a submit, said under it; cleared as that field is edited. */
  const [invalid, setInvalid] = useState<Invalid>({});
  /** Why the server turned a start away (an error code), said in the notice above the button. */
  const [notice, setNotice] = useState<string | null>(null);
  /** Whether the reading on screen is saved on this device now. */
  const [kept, setKept] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  /** Said through the reader's live region; `n` tells a repeat apart. */
  const [announce, setAnnounce] = useState<{ text: string; n: number } | null>(null);
  const [saved, setSaved] = useState<SavedSummary[]>([]);
  /** Said (and shown) on the entry screen: a portrait forgotten, or one that could not be opened. */
  const [entrySaid, setEntrySaid] = useState("");
  const [example, setExample] = useState<"idle" | "busy" | "failed">("idle");
  const uid = useId();
  const entryTitle = useRef<HTMLHeadingElement>(null);
  /** Whether the saved portrait or example on screen has its own history entry (Back, or leaving it, returns to the entry). */
  const pushedView = useRef(false);
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
      openSaved(decodeURIComponent(savedFromHash[1]), "address");
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
    if (profile) { setDate(profile.date); setTime(profile.time ?? ""); setUnknownTime(!profile.time); setPlace(profile.place); setQuery(placeName(profile.place, locale)); }
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

  // Back and Forward through a saved portrait or the example opened from the entry screen.
  // Re-subscribed each render, so it sees the phase on screen now.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const view = (event.state ?? {}) as Partial<View>;
      if (view.portrait === "saved" && typeof view.id === "string") openSaved(view.id, "history");
      else if (view.portrait === "example") void openExample("history");
      else if (phase.kind === "kept") { pushedView.current = false; toEntry(); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });
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

  /** What each field still needs, in the form's own words; empty when it can be sent. */
  function check(): Invalid {
    const found: Invalid = {};
    if (!name.trim()) found.name = t.invalid.name;
    if (needsLatin && !LATIN.test(latin.trim())) found.latin = t.invalid.latin;
    if (!date) found.date = t.invalid.date;
    else if (date < "1800-01-01" || (maxDate && date > maxDate)) found.date = t.invalid.dateRange;
    if (!unknownTime && !time) found.time = t.invalid.time;
    if (!place) found.place = query.trim() ? t.invalid.placeUnchosen : t.invalid.place;
    if (hasInvite === false && !invite.trim()) found.invite = t.invalid.invite;
    return found;
  }
  const fieldId = (key: FieldKey) => `${uid}-${key}`;
  /** Errors are said under their fields, and focus goes to the first of them. */
  function showInvalid(found: Invalid) {
    setInvalid(found);
    const first = FIELDS.find((key) => found[key]);
    if (first) focusNext.current = () => document.getElementById(fieldId(first));
  }
  /** Editing a field takes its error away. */
  const edited = (key: FieldKey) => setInvalid((was) => (was[key] ? { ...was, [key]: undefined } : was));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setNotice(null);
    const found = check();
    if (Object.keys(found).length || !place) { showInvalid(found); return; }
    setInvalid({});
    submitting.current = true;
    setBusy(true);
    try {
      const code = invite.trim() || storedInvite() || "";
      const birth = { date, time: unknownTime ? null : time || null, zone: place.zone, latitude: place.lat, longitude: place.lon };
      let packet: PortraitPacket;
      try {
        const numbers = nameNumbers({ date, name, latin: needsLatin ? latin : "" });
        if (numbers.status !== "calculated") { showInvalid(needsLatin ? { latin: t.invalid.latin } : { name: t.invalid.name }); return; }
        packet = buildPacket({
          locale,
          chart: birthChart(birth),
          arkan: arkanPortrait(date),
          numbers,
          daySigns: birth.time ? null : signsThroughDay({ date, zone: place.zone }),
        });
      } catch {
        setNotice("packet");
        return;
      }
      const started = await startPortrait(packet, code);
      if ("error" in started) {
        if (started.error === "invite") forgetInvite();
        if (!mounted.current) return;
        // The code is the field's to fix: the field shows (with what was sent, to correct), marked.
        if (started.error === "invite") { setInvite(code); setHasInvite(false); showInvalid({ invite: t.invalid.inviteWrong }); }
        else setNotice(started.error);
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
    pushedView.current = false;
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

  /**
   * A saved portrait or the example, read from what is in hand; the stored reading in progress, if any, is left alone.
   * Opened from the entry screen ("push"), it gets its own history entry, so Back returns to the entry; reached by
   * Back or Forward ("history") it already has one; named in the address on arrival ("address"), it has none.
   */
  function openKept(source: "saved" | "example", reading: { id: string; packet: PortraitPacket; stages: PortraitStages; teachings: Teachings }, arrival: Arrival) {
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
    pushedView.current = arrival !== "address";
    if (arrival === "push") {
      const here = window.location.pathname + window.location.search;
      const view: View = source === "saved" ? { portrait: "saved", id: reading.id } : { portrait: "example" };
      history.pushState(view, "", view.portrait === "saved" ? `${here}#saved=${encodeURIComponent(view.id)}` : here);
    }
  }

  function openSaved(id: string, arrival: Arrival) {
    const entry = loadSaved(id) as Saved | null;
    if (!entry?.stages?.a || typeof entry.stages.a.title !== "string") { refreshSaved(); sayOnEntry(t.saved.missing); return; }
    const packet = entry.packet && Array.isArray(entry.packet.factors) ? (entry.packet as PortraitPacket) : NO_PACKET;
    openKept("saved", { id: entry.id, packet, stages: entry.stages, teachings: entry.teachings ?? {} }, arrival);
  }

  async function openExample(arrival: Arrival) {
    if (example === "busy") return;
    setExample("busy");
    try {
      const res = await fetch(`/portrait/example-${locale}.json`);
      if (!res.ok) throw new Error(`http_${res.status}`);
      const body = (await res.json()) as { packet: PortraitPacket; stages: PortraitStages; teachings?: Teachings };
      if (!mounted.current) return;
      setExample("idle");
      openKept("example", { id: `example-${locale}`, packet: body.packet, stages: body.stages, teachings: body.teachings ?? {} }, arrival);
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

  /**
   * Leaving a reading: a kept one leaves the stored reading alone; a live one is forgotten with it. A kept one with its
   * own history entry leaves the way Back would, so the history holds no dead step (popstate takes it to the entry).
   */
  function depart() {
    if (phase.kind !== "kept") reset();
    else if (pushedView.current) history.back();
    else toEntry();
  }
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

  if (phase.kind === "working") {
    const s = phase.status;
    const stages = s?.stages ?? {};
    if (!stages.a) {
      // A failure before the opening was written: nothing to keep, one way on.
      if (s?.status === "failed") return <Stopped locale={locale} error={s.error} onAgain={reset} />;
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

  /** A field's id, its error and hint ids, and whether it is invalid now. */
  const describe = (key: FieldKey, hint = false) => ({
    id: fieldId(key),
    "aria-invalid": invalid[key] ? true : undefined,
    "aria-describedby": [invalid[key] && `${fieldId(key)}-error`, hint && `${fieldId(key)}-hint`].filter(Boolean).join(" ") || undefined,
  });
  const fieldError = (key: FieldKey) => invalid[key] && <p id={`${fieldId(key)}-error`} className={styles.fieldError}>{invalid[key]}</p>;
  const turnedAway = notice ? noticeKey(notice) : null;

  return (
    <section className={`${styles.page} ${styles.entry}`} data-portrait-entry="">
      <div className={styles.lead}>
        <header className={styles.head}>
          <p className={styles.kicker}>{t.kicker}</p>
          <h1 ref={entryTitle} tabIndex={-1} className={styles.title}>{t.title}</h1>
          <ul className={styles.ways}>
            {t.ways.map((way) => <li key={way.gives}>{way.from} <em>{way.gives}</em>.</li>)}
          </ul>
          <p className={styles.together}>{t.together}</p>
        </header>
        <p className={styles.note}>{t.note}</p>
      </div>

      <div className={styles.side}>
        <form className={styles.form} onSubmit={submit} noValidate aria-busy={busy || undefined}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("name")}>{t.name}</label>
            <input className={styles.input} {...describe("name")} value={name} autoComplete="name" required
              onChange={(e) => { setName(e.target.value); edited("name"); edited("latin"); }} />
            {fieldError("name")}
          </div>
          {needsLatin && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId("latin")}>{t.latin}</label>
              <input className={styles.input} {...describe("latin", true)} value={latin} lang="en" autoComplete="off" spellCheck={false} required
                pattern={LATIN_PATTERN} title={t.invalid.latin} onChange={(e) => { setLatin(e.target.value); edited("latin"); }} />
              {fieldError("latin")}
              <p id={`${fieldId("latin")}-hint`} className={styles.hint}>{t.latinHint}</p>
            </div>
          )}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId("date")}>{t.date}</label>
              <input className={styles.input} {...describe("date")} type="date" value={date} min="1800-01-01" max={maxDate} required
                onChange={(e) => { setDate(e.target.value); edited("date"); }} />
              {fieldError("date")}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId("time")}>{t.time}</label>
              <input className={styles.input} {...describe("time")} type="time" value={time} disabled={unknownTime} required={!unknownTime}
                onChange={(e) => { setTime(e.target.value); edited("time"); }} />
              {fieldError("time")}
            </div>
          </div>
          <div className={styles.unknown}>
            <label className={styles.check}>
              <input type="checkbox" checked={unknownTime} aria-describedby={`${uid}-unknown`}
                onChange={(e) => { setUnknownTime(e.target.checked); edited("time"); }} />
              <span>{t.unknown}</span>
            </label>
            {/* Mounted empty, so ticking the box is followed by what changes. */}
            <p id={`${uid}-unknown`} className={styles.hint} aria-live="polite">{unknownTime ? t.unknownHint : ""}</p>
          </div>
          <PlaceField id={fieldId("place")} locale={locale} places={places} query={query} place={place} error={invalid.place}
            onQuery={(q) => { setQuery(q); setPlace(null); edited("place"); }}
            onChoose={(p) => { setPlace(p); setQuery(placeName(p, locale)); edited("place"); }} />
          {hasInvite === false && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId("invite")}>{t.invite}</label>
              <input className={styles.input} {...describe("invite", true)} value={invite} autoComplete="off" autoCapitalize="none" spellCheck={false} required
                onChange={(e) => { setInvite(e.target.value); edited("invite"); }} />
              {fieldError("invite")}
              <p id={`${fieldId("invite")}-hint`} className={styles.hint}>{t.inviteHint}</p>
            </div>
          )}
          {/* Mounted empty: a start the server turned away is said here, with the one thing to do next. */}
          <div className={styles.alert} role="alert">
            {turnedAway && (
              <div className={styles.notice}>
                <p className={styles.noticeText}>{t.errors[turnedAway]}</p>
                <p className={styles.noticeNext}>{t.next[turnedAway]}</p>
              </div>
            )}
            {example === "failed" && <p className={styles.fieldError}>{t.example.failed}</p>}
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={busy}>{busy ? t.preparing : t.begin}</button>
            <button type="button" className={styles.exampleButton} aria-busy={example === "busy" || undefined} onClick={() => void openExample("push")}>
              {example === "busy" ? t.example.opening : t.example.open}
            </button>
          </div>
        </form>
        <details className={styles.details}>
          <summary>{t.details.summary}</summary>
          <ul>{t.details.points.map((point) => <li key={point}>{point}</li>)}</ul>
        </details>
        <p className={styles.status} role="status">{entrySaid}</p>
        {saved.length > 0 && (
          <SavedList locale={locale} items={saved} onOpen={(id) => openSaved(id, "push")} onForget={(item) => setAsking({ kind: "forget", id: item.id, title: item.title, from: "list" })} />
        )}
      </div>
      {dialog}
    </section>
  );
}

/** A reading that stopped before its opening was written: what happened, and one way on. Focus starts on its heading. */
function Stopped({ locale, error, onAgain }: { locale: PortraitLocale; error: string | null; onAgain: () => void }) {
  const t = PORTRAIT_COPY[locale];
  const key = failureKey(error);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className={`${styles.page} ${styles.stopped}`}>
      <p className={styles.kicker}>{t.reader.kicker}</p>
      <h1 ref={heading} tabIndex={-1} className={styles.stoppedTitle}>{t.errors[key]}</h1>
      <p className={styles.together}>{key === "failed" ? `${t.failedNote} ${t.next[key]}` : t.next[key]}</p>
      <button type="button" className={styles.button} onClick={onAgain}>{t.again}</button>
    </section>
  );
}
