/* Ported from Olivia Today (outputs/olivia-today) by work/olivia-today/port-to-site.mjs. Edit the source there, then re-run the port. */
// @ts-nocheck
/* Olivia · Today — reading composer 2.0.0
 * Turns the calculated day (today-engine.js) into a reading for one Sun sign, in the way a working
 * astrologer writes a column: lead with today's sharpest real event, place it in the reader's solar
 * houses, add the Moon's mood, then the slower weather with dates. Every sentence traces to a
 * calculated fact plus an authored library entry; nothing is invented to fill a day. */
import ENGINE from './engine.js';
import COPY from './copy.js';
const root = { OLIVIA_TODAY_ENGINE: ENGINE, OLIVIA_TODAY_COPY: COPY, OLIVIA_TODAY_LIB: null };
  'use strict';
  const E = () => root.OLIVIA_TODAY_ENGINE, L = () => root.OLIVIA_TODAY_LIB, C = () => root.OLIVIA_TODAY_COPY;
  const HOUR = 3600000, DAY = 86400000;
  const PERSONAL = ['sun', 'mercury', 'venus', 'mars'];
  const GLYPH = { sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇' };
  const ASP_GLYPH = { conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍' };
  const SPEED_ORDER = ['moon', 'mercury', 'venus', 'sun', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

  /* ---------- small language helpers ---------- */
  function ukPrep(prev, next) {
    if (/^[вфВФ]/.test(next)) return 'у';
    if (/^[аеєиіїоуюяАЕЄИІЇОУЮЯ]/.test(next)) return 'в';
    return /[аеєиіїоуюяАЕЄИІЇОУЮЯ]$/.test(prev) ? 'в' : 'у';
  }
  function placeIn(lang, planetKey, signKey) {
    const c = C()[lang], p = c.planets[planetKey];
    if (lang === 'uk') { const s = c.signsLoc[signKey]; return p + ' ' + ukPrep(p, s) + ' ' + s; }
    return (planetKey === 'sun' || planetKey === 'moon' ? 'the ' : '') + p + ' in ' + c.signs[signKey];
  }
  function aspectPhrase(lang, a, aSign, key, b, bSign) {
    const c = C()[lang];
    if (lang === 'uk') {
      const bForm = key === 'opposition' ? c.gen[b] : c.ins[b];
      const bLoc = c.signsLoc[bSign];
      return placeIn('uk', a, aSign) + ' ' + c.aspects[key] + ' ' + bForm + ' ' + ukPrep(bForm, bLoc) + ' ' + bLoc;
    }
    return placeIn('en', a, aSign) + ' ' + (key === 'opposition' ? 'opposes' : key === 'conjunction' ? 'meets' : 'is ' + c.aspects[key]) + ' ' + c.planets[b] + ' in ' + c.signs[bSign];
  }
  const time = (t, lang) => E().fmt(t, lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dateShort = (t, lang) => E().fmt(t, lang, { day: 'numeric', month: 'short' }).replace('.', '');
  const dateLong = (t, lang) => E().fmt(t, lang, { day: 'numeric', month: 'long' });
  const weekdayShort = (t, lang) => E().fmt(t, lang, { weekday: 'short' }).replace('.', '');
  const year = (t) => new Date(t).getUTCFullYear();
  function when(t, D, lang) { // "at 15:56" today, "tomorrow 05:22", "Fri 16 Oct 15:56"
    const c = C()[lang];
    if (t >= D.dayStart && t <= D.dayEnd + 60000) return time(t, lang);
    if (t > D.dayEnd && t <= D.dayEnd + DAY) return c.t.tomorrow + ' ' + time(t, lang);
    return weekdayShort(t, lang) + ' ' + dateShort(t, lang) + ', ' + time(t, lang);
  }
  const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  function whenRel(t, D, lang) { // past moments: "at 03:59" today, "yesterday at 15:56"
    if (t >= D.dayStart) return (lang === 'uk' ? 'о ' : 'at ') + time(t, lang);
    if (t >= D.dayStart - DAY) return (lang === 'uk' ? 'учора о ' : 'yesterday at ') + time(t, lang);
    return (lang === 'uk' ? '' : 'on ') + weekdayShort(t, lang) + ' ' + dateShort(t, lang);
  }
  const joinS = (...parts) => parts.filter(p => p && String(p).trim()).join(' ');
  function exactLabel(a, D, lang) {
    const t = C()[lang].t;
    if (!a.exactAt) return '';
    if (a.exactAt >= D.dayStart && a.exactAt <= D.dayEnd) return t.exactAt(time(a.exactAt, lang));
    return t.exactOn(when(a.exactAt, D, lang), a.exactAt < D.dayStart);
  }

  /* ---------- library access ---------- */
  const entry = (planet, house, lang) => L()?.planets?.[planet]?.houses?.[house]?.[lang] || null;
  const signLine = (planet, sign, lang) => L()?.planets?.[planet]?.signs?.[sign]?.[lang] || '';
  const retroLine = (planet, house, lang) => L()?.planets?.[planet]?.retro?.[house]?.[lang] || '';
  const retroGeneral = (planet, lang) => L()?.planets?.[planet]?.retroGeneral?.[lang] || '';
  const stationLine = (planet, turns, lang) => L()?.planets?.[planet]?.station?.[turns]?.[lang] || '';
  const aspectText = (a, b, family, lang) => {
    const [x, y] = E().BODIES.indexOf(a) < E().BODIES.indexOf(b) ? [a, b] : [b, a];
    return L()?.aspects?.[x + '-' + y]?.[family]?.[lang] || '';
  };
  const transitText = (t, n, family, lang) => L()?.transits?.[t + '>' + n]?.[family]?.[lang] || '';

  /* ---------- salience: which real event leads today ---------- */
  const entryKey = s => s.planet + ':' + s.house;
  function signals(D, sign, moonHits = [], recent = {}) {
    const eng = E(), out = [], ruler = sign ? eng.RULERS[eng.SIGNS.indexOf(sign)] : null;
    const byKey = Object.fromEntries(D.bodies.map(b => [b.key, b]));
    const H = key => sign ? eng.house(sign, byKey[key].signIndex) : null;
    const angular = h => [1, 4, 7, 10].includes(h);
    const near = (t, hours) => t != null && Math.abs(t - D.asOf) <= hours * HOUR;
    // lunations today
    for (const q of D.moon.quarters) if (q.at >= D.dayStart - 6 * HOUR && q.at <= D.dayEnd + 6 * HOUR) {
      const h = sign ? eng.house(sign, eng.SIGNS.indexOf(q.sign)) : null;
      out.push({ kind: 'lunation', planet: 'moon', phase: q.key, at: q.at, sign: q.sign, house: h, score: (q.key === 'new' || q.key === 'full' ? 10 : 7) + (angular(h) ? 0.5 : 0) });
    }
    // stations within ±36h
    for (const key of Object.keys(D.retro)) {
      const r = D.retro[key]; if (!r) continue;
      for (const st of [r.start, r.end]) if (st && near(st.at, 36)) {
        const base = ['mercury', 'venus', 'mars'].includes(key) ? 9 : ['jupiter', 'saturn'].includes(key) ? 7 : 6;
        const today = st.at >= D.dayStart && st.at <= D.dayEnd;
        out.push({ kind: 'station', planet: key, turns: st.turns, at: st.at, sign: st.sign, house: H(key), score: base - (today ? 0 : 2.5) + (key === ruler ? 1 : 0) });
      }
    }
    // ingresses of personal planets within ±18h
    for (const key of PERSONAL) {
      const s = D.stays[key]; if (s && near(s.enteredAt, 18)) out.push({ kind: 'ingress', planet: key, at: s.enteredAt, sign: byKey[key].sign, house: H(key), score: 7 + (key === ruler ? 1 : 0) });
    }
    // exact or near-exact aspects between moving planets (Moon handled separately)
    for (const a of D.aspects) {
      if (a.a === 'moon' || a.b === 'moon' || a.period === 'era') continue;
      // only an aspect that perfects today may lead; one perfecting within ±1.5 days can still be the "also"
      const exactToday = a.exactAt && a.exactAt >= D.dayStart && a.exactAt <= D.dayEnd;
      const exactNear = a.exactAt && Math.abs(a.exactAt - D.asOf) <= 36 * HOUR;
      if (!exactToday && !exactNear) continue;
      const personal = [a.a, a.b].some(k => PERSONAL.includes(k)) ? 1 : 0;
      const fastFirst = SPEED_ORDER.indexOf(a.a) < SPEED_ORDER.indexOf(a.b);
      out.push({ kind: 'aspect', aspect: a, planet: fastFirst ? a.a : a.b, other: fastFirst ? a.b : a.a, house: sign ? H(fastFirst ? a.a : a.b) : null,
        score: (exactToday ? 7 : 3.9) + personal + ([a.a, a.b].includes(ruler) ? 1.5 : 0) });
    }
    // the Moon's house: the daily voice. Fresh on the day it changes sign.
    const moonFresh = D.moon.enteredSignAt != null && D.asOf - D.moon.enteredSignAt <= 30 * HOUR;
    out.push({ kind: 'moon', planet: 'moon', house: H('moon'), sign: byKey.moon.sign, score: (moonFresh ? 6.2 : 4.6) + (angular(H('moon')) ? 0.4 : 0) + (ruler === 'moon' ? 1 : 0) });
    // the Moon's exact contacts today switch on one planet at a time: on a quiet day, that planet speaks
    for (const m of moonHits) {
      if (m.b === 'sun' && m.family !== 'soft') continue;
      out.push({ kind: 'moonhit', planet: m.b, other: 'moon', contact: m, house: H(m.b), sign: byKey[m.b].sign,
        score: 5.3 + (PERSONAL.includes(m.b) ? 0.4 : 0) + (m.b === ruler ? 0.8 : 0) + (m.family === 'conj' ? 0.2 : 0) - (eng.SLOW.includes(m.b) ? 0.6 : 0) });
    }
    // retrogrades in force
    for (const key of ['mercury', 'venus', 'mars']) if (D.retro[key]?.state === 'retrograde') out.push({ kind: 'retro', planet: key, house: H(key), sign: byKey[key].sign, score: 4.4 + (key === ruler ? 1.2 : 0) });
    // the sign's ruler and the Sun's month
    if (ruler && ruler !== 'moon') out.push({ kind: 'placement', planet: ruler, house: H(ruler), sign: byKey[ruler].sign, ruler: true, score: eng.FAST.includes(ruler) ? 4.2 : 3 });
    out.push({ kind: 'placement', planet: 'sun', house: H('sun'), sign: byKey.sun.sign, score: 3.5 });
    // freshness: yesterday's headline should not lead again unless today's event is clearly bigger
    for (const s of out) if (recent[entryKey(s)] && s.kind !== 'lunation') s.score -= recent[entryKey(s)];
    return out.sort((x, y) => y.score - x.score);
  }

  // today's signals in order, with yesterday's and the day before's lead penalised (history[0] = yesterday)
  function ranked(D, sign, history = [], moonHits = null) {
    const eng = E(), recent = {};
    if (sign) history.slice(0, 2).forEach((P, i) => { if (!P) return; const k = entryKey(signals(P, sign, eng.moonContacts(P.dayStart, P.dayEnd))[0]); recent[k] = (recent[k] || 0) + (i === 0 ? 2.6 : 1.6); });
    return signals(D, sign, moonHits || eng.moonContacts(D.dayStart, D.dayEnd), recent);
  }

  /* ---------- the reading ---------- */
  function compose({ day: D, sign = null, lang = 'en', natal = null, cardId = null, history = [] }) {
    const eng = E(), c = C()[lang], t = c.t;
    const byKey = Object.fromEntries(D.bodies.map(b => [b.key, b]));
    const H = key => sign ? eng.house(sign, byKey[key].signIndex) : null;
    const ruler = sign ? eng.RULERS[eng.SIGNS.indexOf(sign)] : null;
    const moonHits = eng.moonContacts(D.dayStart, D.dayEnd);
    const S = ranked(D, sign, history, moonHits);
    const used = new Set(); // planet:house entries already spoken
    const markUsed = (p, h) => used.add(p + ':' + h);
    const isUsed = (p, h) => used.has(p + ':' + h);
    const moonB = byKey.moon, moonH = H('moon');

    const top = S[0];
    let headline, kicker, lead = [], topEntry = null, topPlanet = top.planet, topHouse = top.house;

    // ---- lead paragraph from the sharpest event
    if (top.kind === 'aspect') {
      const a = top.aspect, A1 = top.planet, A2 = top.other;
      const exact = exactLabel(a, D, lang);
      kicker = c.planets[A1] + ' ' + ASP_GLYPH[a.key] + ' ' + c.planets[A2] + (exact ? ' · ' + exact : '');
      lead.push(joinS(cap1(aspectPhrase(lang, A1, byKey[A1].sign, a.key, A2, byKey[A2].sign)) + (exact ? ' — ' + exact : '') + '.', aspectText(A1, A2, a.family, lang)));
      if (sign) {
        lead.push(t.bridge[a.family](H(A1), H(A2)));
        topEntry = entry(A1, H(A1), lang); markUsed(A1, H(A1));
        if (topEntry) lead.push(topEntry.text);
      }
    } else if (top.kind === 'moonhit') {
      const m = top.contact, P = top.planet;
      kicker = (lang === 'uk' ? 'Місяць ' : 'Moon ') + ASP_GLYPH[m.key] + ' ' + c.planets[P] + ' · ' + t.exactAt(time(m.at, lang));
      lead.push(joinS(cap1(aspectPhrase(lang, 'moon', moonB.sign, m.key, P, byKey[P].sign)) + ' — ' + t.exactAt(time(m.at, lang)) + '.', aspectText('moon', P, m.family, lang)));
      if (sign) {
        lead.push(t.bridge[m.family](H(P), moonH));
        topEntry = entry(P, H(P), lang); markUsed(P, H(P));
        if (topEntry) lead.push(topEntry.text);
      }
    } else if (top.kind === 'lunation') {
      kicker = t.lunationToday(top.phase, top.sign, time(top.at, lang));
      const ph = c.phases[top.phase];
      lead.push(t.lunationFact(top.phase, top.sign, byKey.sun.sign, time(top.at, lang)) + ' ' + ph.text);
      if (sign) { topEntry = entry('moon', top.house, lang); markUsed('moon', top.house); lead.push(t.lunationHouse(top.house)); if (topEntry) lead.push(topEntry.text); }
      topPlanet = 'moon';
    } else if (top.kind === 'station') {
      kicker = t.stationTitle(c.planets[top.planet], top.turns) + ' · ' + when(top.at, D, lang);
      lead.push(stationLine(top.planet, top.turns, lang));
      if (sign) {
        const rl = top.turns === 'retrograde' ? retroLine(top.planet, top.house, lang) : '';
        topEntry = entry(top.planet, top.house, lang); markUsed(top.planet, top.house);
        lead.push(rl || (topEntry ? topEntry.text : ''));
      }
    } else if (top.kind === 'ingress') {
      kicker = t.ingressTitle(c.planets[top.planet], top.sign) + ' · ' + when(top.at, D, lang);
      lead.push(signLine(top.planet, top.sign, lang));
      if (sign) { topEntry = entry(top.planet, top.house, lang); markUsed(top.planet, top.house); lead.push(topEntry ? topEntry.text : ''); }
    } else if (top.kind === 'retro') {
      const r = D.retro[top.planet];
      kicker = c.planets[top.planet] + ' ℞ · ' + t.until(dateShort(r.end.at, lang));
      lead.push(joinS(t.retroNow(c.planets[top.planet], dateLong(r.start.at, lang), dateLong(r.end.at, lang), top.planet), retroGeneral(top.planet, lang)));
      if (sign) { topEntry = entry(top.planet, top.house, lang); markUsed(top.planet, top.house); lead.push(retroLine(top.planet, top.house, lang)); }
    } else { // moon or placement
      const p = top.planet;
      kicker = cap1(placeIn(lang, p, byKey[p].sign)) + (sign ? ' · ' + t.inHouse(H(p)) : '');
      const entered = p === 'moon' && D.moon.enteredSignAt ? t.moonEntered(byKey.moon.sign, whenRel(D.moon.enteredSignAt, D, lang)) : '';
      lead.push(joinS(entered, signLine(p, byKey[p].sign, lang)));
      if (sign) { topEntry = entry(p, H(p), lang); markUsed(p, H(p)); lead.push(topEntry ? topEntry.text : ''); }
    }
    if (sign && top.planet === ruler && top.kind !== 'moon') lead.push(t.rulerNote(c.planets[ruler], lang === 'uk' ? sign : c.signs[sign]));
    headline = top.kind === 'lunation' && sign ? t.lunationHeadline(top.phase, top.house) : topEntry ? topEntry.theme : (sign ? '' : c.phases[D.moon.phase].name + (lang === 'uk' ? ' ' + ukPrep(c.phases[D.moon.phase].name, c.signsLoc[moonB.sign]) + ' ' + c.signsLoc[moonB.sign] : ' in ' + c.signs[moonB.sign]));

    // ---- a second real event, briefly (aspect, station, ingress or lunation not already leading)
    const second = S.slice(1).find(s => ['aspect', 'station', 'ingress', 'lunation'].includes(s.kind) && s.planet !== top.planet);
    const alsoPara = [];
    if (second && second.kind === 'aspect') {
      const a = second.aspect, A1 = second.planet, A2 = second.other;
      const ex = exactLabel(a, D, lang);
      alsoPara.push(joinS(cap1(aspectPhrase(lang, A1, byKey[A1].sign, a.key, A2, byKey[A2].sign)) + (ex ? ' — ' + ex : '') + '.', aspectText(A1, A2, a.family, lang), sign ? t.bridge[a.family](H(A1), H(A2)) : ''));
    } else if (second && second.kind === 'station') {
      alsoPara.push(t.stationTitle(c.planets[second.planet], second.turns) + ' · ' + when(second.at, D, lang) + '. ' + stationLine(second.planet, second.turns, lang));
    } else if (second && second.kind === 'ingress') {
      alsoPara.push(t.ingressTitle(c.planets[second.planet], lang === 'uk' ? second.sign : c.signs[second.sign]) + ' · ' + when(second.at, D, lang) + '. ' + signLine(second.planet, second.sign, lang));
    }

    // ---- the Moon paragraph (if the Moon did not lead)
    const moonPara = [];
    if (top.kind !== 'moon' && top.kind !== 'lunation') {
      moonPara.push(joinS(t.moonUntil(moonB.sign, when(D.stays.moon.leavesAt, D, lang), D.stays.moon.nextSign) + '.', signLine('moon', moonB.sign, lang)));
      const mt = sign ? entry('moon', moonH, lang) : null;
      if (mt) moonPara.push(t.moonHouse(moonH, mt.theme));
    }

    // ---- keep in mind: retrogrades in force and stations ahead (personal planets, ruler first)
    const keep = [];
    const retroKeys = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].filter(k => D.retro[k]).sort((a, b) => (b === ruler) - (a === ruler));
    for (const k of retroKeys) {
      const r = D.retro[k];
      if (top.planet === k && (top.kind === 'retro' || top.kind === 'station')) continue;
      if (r.state === 'retrograde' && ['mercury', 'venus', 'mars'].includes(k) && r.start && r.end)
        keep.push({ planet: k, text: t.retroNow(c.planets[k], dateLong(r.start.at, lang), dateLong(r.end.at, lang), k) + (sign ? ' ' + retroLine(k, H(k), lang) : ' ' + retroGeneral(k, lang)) });
      else if (r.state === 'upcoming' && r.start && r.end && r.start.at - D.asOf < 21 * DAY) {
        const hh = sign ? eng.house(sign, eng.SIGNS.indexOf(r.start.sign)) : null;
        keep.push({ planet: k, text: (k === ruler && sign ? t.rulerNote(c.planets[k], lang === 'uk' ? sign : c.signs[sign]) + ' ' : '') + t.retroSoon(c.planets[k], dateLong(r.start.at, lang), dateLong(r.end.at, lang), k) + (sign && ['mercury', 'venus', 'mars'].includes(k) ? ' ' + retroLine(k, hh, lang) : '') });
      }
      if (keep.length >= 2) break;
    }

    // ---- three areas
    const climateFor = (p) => {
      if (D.retro[p]?.state === 'retrograde') return 'retro';
      const asp = D.aspects.find(a => (a.a === p || a.b === p) && a.a !== 'moon' && a.b !== 'moon' && a.period !== 'era');
      return asp ? asp.family : 'steady';
    };
    const areas = [];
    const progress = p => { const st = D.stays[p]; return st && st.enteredAt && st.leavesAt ? Math.max(0, Math.min(1, (D.asOf - st.enteredAt) / (st.leavesAt - st.enteredAt))) : null; };
    // An area whose planet already led the reading must not reprint it: take the first real line (sign line,
    // retrograde line, a live aspect, the named Moon phase) that the reader has not been shown yet.
    const shown = [...lead, ...alsoPara, ...moonPara, ...keep.map(k => k.text), topEntry ? topEntry.scene : ''].join(' ');
    const fresh = list => list.find(x => x && !shown.includes(x)) || list.find(Boolean) || '';
    const phaseLine = key => { const p = c.phases[key]; return p.name + ': ' + (/^(Moon|Місяць)/.test(p.text) ? p.text : p.text.charAt(0).toLowerCase() + p.text.slice(1)); };
    const liveAspects = p => D.aspects.filter(a => (a.a === p || a.b === p) && a.period !== 'era').map(a => aspectText(a.a, a.b, a.family, lang));
    if (sign) {
      const vH = H('venus'), vE = entry('venus', vH, lang);
      if (vE) areas.push({ key: 'love', planet: 'venus', house: vH, climate: climateFor('venus'), theme: vE.theme, progress: progress('venus'), leaves: D.stays.venus.leavesAt,
        text: isUsed('venus', vH) ? fresh([signLine('venus', byKey.venus.sign, lang), D.retro.venus?.state === 'retrograde' ? retroLine('venus', vH, lang) : '', ...liveAspects('venus'), vE.scene]) : vE.text + (D.retro.venus?.state === 'retrograde' && !keep.some(k => k.planet === 'venus') ? ' ' + retroLine('venus', vH, lang) : '') });
      markUsed('venus', vH);
      const workPick = ['mercury', 'mars', 'saturn', 'sun', 'jupiter'].map(p => ({ p, h: H(p) }))
        .sort((x, y) => (([2, 6, 10].includes(y.h) ? 2 : 0) - ([2, 6, 10].includes(x.h) ? 2 : 0)) || (isUsed(x.p, x.h) - isUsed(y.p, y.h)))
        .find(x => !isUsed(x.p, x.h)) || { p: 'mercury', h: H('mercury') };
      const wE = entry(workPick.p, workPick.h, lang);
      if (wE) areas.push({ key: 'work', planet: workPick.p, house: workPick.h, climate: climateFor(workPick.p), theme: wE.theme, text: wE.text, progress: progress(workPick.p), leaves: D.stays[workPick.p].leavesAt });
      markUsed(workPick.p, workPick.h);
      const mE = entry('moon', moonH, lang);
      const phaseClimate = { new: 'reset', waxingCrescent: 'building', firstQuarter: 'building', waxingGibbous: 'building', full: 'peak', waningGibbous: 'releasing', lastQuarter: 'releasing', waningCrescent: 'releasing' }[D.moon.phase];
      if (mE) areas.push({ key: 'self', planet: 'moon', house: moonH, climate: phaseClimate, theme: mE.theme, progress: progress('moon'), leaves: D.stays.moon.leavesAt, text: isUsed('moon', moonH) ? fresh([signLine('moon', moonB.sign, lang), phaseLine(D.moon.phase), ...liveAspects('moon')]) : mE.text });
    }

    // ---- do / avoid / ask / scene
    const mE = sign ? entry('moon', moonH, lang) : null;
    const dos = [], avoids = [];
    if (topEntry) { dos.push(topEntry.do); avoids.push(topEntry.avoid); }
    if (mE && mE !== topEntry) { dos.push(mE.do); avoids.push(mE.avoid); }
    const scene = topEntry ? topEntry.scene : null;
    const ask = topEntry ? topEntry.ask : (mE ? mE.ask : null);

    // ---- timing today
    const timing = [];
    const ing = D.moon.ingresses.find(i => i.at >= D.dayStart && i.at <= D.dayEnd);
    timing.push({ glyph: '☽', label: ing ? (lang === 'uk' ? 'Місяць переходить у ' + c.signsAcc[ing.to] : 'Moon enters ' + c.signs[ing.to]) : t.moonUntil(moonB.sign, when(D.stays.moon.leavesAt, D, lang), D.stays.moon.nextSign), at: ing ? ing.at : null, family: null });
    for (const q of D.moon.quarters) if (q.at >= D.dayStart && q.at <= D.dayEnd) timing.push({ glyph: q.key === 'full' ? '○' : q.key === 'new' ? '●' : '◐', label: t.lunationTitle(q.key, q.sign), at: q.at });
    for (const k of Object.keys(D.retro)) { const r = D.retro[k]; for (const st of r ? [r.start, r.end] : []) if (st && st.at >= D.dayStart && st.at <= D.dayEnd) timing.push({ glyph: GLYPH[k], label: t.stationTitle(c.planets[k], st.turns), at: st.at }); }
    for (const a of D.aspects) if (a.exactAt && a.exactAt >= D.dayStart && a.exactAt <= D.dayEnd && a.a !== 'moon' && a.b !== 'moon')
      timing.push({ glyph: GLYPH[a.a] + ASP_GLYPH[a.key] + GLYPH[a.b], label: c.planets[a.a] + ' ' + ASP_GLYPH[a.key] + ' ' + c.planets[a.b], at: a.exactAt, family: a.family });
    const MOON_WORD = lang === 'uk'
      ? { sun: 'видимість', mercury: 'розмови', venus: 'тепло й гроші', mars: 'рішучість', jupiter: 'щедрість', saturn: 'дисципліна', uranus: 'несподіванки', neptune: 'мрії й туман', pluto: 'глибина' }
      : { sun: 'visibility', mercury: 'conversation', venus: 'warmth & money', mars: 'nerve', jupiter: 'generosity', saturn: 'discipline', uranus: 'surprises', neptune: 'dreams & fog', pluto: 'depth' };
    const FAM_WORD = lang === 'uk' ? { soft: 'вдале вікно', hard: 'точка тертя', conj: 'фокус' } : { soft: 'good window', hard: 'friction point', conj: 'focus point' };
    for (const m of moonHits) if (!(m.b === 'sun' && m.family !== 'soft')) timing.push({ glyph: '☽' + ASP_GLYPH[m.key] + GLYPH[m.b], label: (lang === 'uk' ? 'Місяць ' : 'Moon ') + ASP_GLYPH[m.key] + ' ' + c.planets[m.b] + ' — ' + FAM_WORD[m.family] + ': ' + MOON_WORD[m.b], at: m.at, family: m.family });
    timing.sort((x, y) => (x.at ?? -1) - (y.at ?? -1));

    // ---- season: what is in force now (bars) and long chapters
    const season = [];
    for (const k of ['sun', 'mercury', 'venus', 'mars', 'jupiter']) {
      const s = D.stays[k], b = byKey[k], h = H(k), e = sign ? entry(k, h, lang) : null, r = D.retro[k];
      season.push({ planet: k, sign: b.sign, house: h, start: s.enteredAt, end: s.leavesAt, nextSign: s.nextSign, retro: r && r.start && r.end ? { start: r.start.at, end: r.end.at, state: r.state } : null,
        theme: e ? e.theme : signLine(k, b.sign, lang), line: signLine(k, b.sign, lang), isRuler: k === ruler });
    }
    const chapters = [];
    for (const k of ['saturn', 'uranus', 'neptune', 'pluto']) {
      const s = D.stays[k], b = byKey[k], h = H(k), e = sign ? entry(k, h, lang) : null;
      chapters.push({ planet: k, sign: b.sign, house: h, from: s.enteredAt ? year(s.enteredAt) : null, to: s.leavesAt ? year(s.leavesAt) : null, theme: e ? e.theme : '', text: e ? e.text : signLine(k, b.sign, lang), line: signLine(k, b.sign, lang), retro: b.retro, isRuler: k === ruler });
    }

    // ---- next 14 days, written for this sign
    const dates = D.events.filter(ev => ev.at > D.dayEnd).map(ev => {
      const h = sign ? eng.house(sign, eng.SIGNS.indexOf(ev.sign)) : null;
      if (ev.kind === 'lunation') {
        const e = sign ? entry('moon', h, lang) : null;
        return { at: ev.at, glyph: ev.phase === 'full' ? '○' : ev.phase === 'new' ? '●' : '◐', title: t.lunationTitle(ev.phase, ev.sign), house: h, text: (e ? cap1(t.inHouse(h)) + ': ' + e.theme.toLowerCase() + '. ' : '') + c.phases[ev.phase].text };
      }
      if (ev.kind === 'ingress') {
        const e = sign ? entry(ev.key, h, lang) : null;
        return { at: ev.at, glyph: GLYPH[ev.key], title: t.ingressTitle(c.planets[ev.key], lang === 'uk' ? ev.sign : c.signs[ev.sign]), house: h, text: (e ? cap1(t.inHouse(h)) + ': ' + e.theme.toLowerCase() + '. ' : '') + signLine(ev.key, ev.sign, lang) };
      }
      const rl = ev.turns === 'retrograde' && sign && ['mercury', 'venus', 'mars'].includes(ev.key) ? retroLine(ev.key, h, lang) : stationLine(ev.key, ev.turns, lang);
      return { at: ev.at, glyph: GLYPH[ev.key], title: t.stationTitle(c.planets[ev.key], ev.turns), house: h, text: rl };
    });
    for (const ec of D.eclipses) dates.push({ at: ec.at, glyph: ec.kind === 'solar' ? '◑' : '◒', title: (lang === 'uk' ? (ec.kind === 'solar' ? 'Сонячне затемнення' : 'Місячне затемнення') : (ec.kind === 'solar' ? 'Solar eclipse' : 'Lunar eclipse')) + ' · ' + c.signs[ec.sign], house: sign ? eng.house(sign, eng.SIGNS.indexOf(ec.sign)) : null, text: '' });
    dates.sort((a, b) => a.at - b.at);

    // ---- the Moon panel
    const nextQ = D.moon.quarters.find(q => q.at > D.dayEnd);
    const moon = { phase: D.moon.phase, name: c.phases[D.moon.phase].name, text: c.phases[D.moon.phase].text, illum: D.moon.illum, angle: D.moon.angle, sign: moonB.sign, house: moonH,
      until: D.stays.moon.leavesAt, nextSign: D.stays.moon.nextSign, next: nextQ ? { key: nextQ.key, at: nextQ.at, sign: nextQ.sign, name: c.quarterNames[nextQ.key] } : null };

    // ---- personal transits (Pro)
    let personal = null;
    if (natal) {
      const tr = eng.transitsToNatal(D, natal);
      personal = { timeKnown: natal.timeKnown, note: natal.timeKnown ? '' : t.unknownTime, cusp: natal.sunSigns.length > 1 ? t.cusp(c.signs[natal.sunSigns[0]], c.signs[natal.sunSigns[1]]) : '',
        transits: tr.slice(0, 8).map(x => ({ id: x.id, t: x.t, n: x.n, key: x.key, family: x.family, orb: x.orb, applying: x.applying, period: x.period,
          title: c.planets[x.t] + ' ' + ASP_GLYPH[x.key] + ' ' + (lang === 'uk' ? 'ваш натальний ' + (x.n === 'venus' ? 'Венера' : c.planets[x.n]) : 'your natal ' + c.planets[x.n]),
          text: transitText(x.t, x.n, x.family, lang) })) };
      if (lang === 'uk') personal.transits.forEach(x => { x.title = x.title.replace('ваш натальний Венера', 'ваша натальна Венера').replace('ваш натальний Сонце', 'ваше натальне Сонце'); });
      if (!personal.transits.length) personal.none = t.personalNone;
      // a personal headline beats the shared one when a fast, tight contact exists
      const lead1 = tr.find(x => ['moon', 'sun', 'mercury', 'venus', 'mars'].includes(x.t) && x.worst < 1.5) || tr.find(x => !['moon'].includes(x.t) && x.worst < 1);
      if (lead1) personal.lead = personal.transits.find(p => p.id === lead1.id) || null;
    }

    // ---- tarot
    let tarot = null;
    if (cardId != null && L()?.tarot?.[cardId]) {
      const card = L().tarot[cardId][lang];
      tarot = { id: cardId, ...card, bridge: cardBridge(cardId, D, sign, lang, card.name), withTheme: headline ? t.cardWithTheme(headline) : '' };
    }

    return {
      version: '2.0.0', date: D.date, lang, sign, live: top.at ? (top.at >= D.dayStart && top.at <= D.dayEnd) : (top.aspect ? !!(top.aspect.exactAt && top.aspect.exactAt >= D.dayStart && top.aspect.exactAt <= D.dayEnd) : !!top.contact), signName: sign ? c.signs[sign] : null, ruler,
      headline, kicker, lead: lead.filter(Boolean), alsoPara: alsoPara.filter(Boolean), moonPara: moonPara.filter(Boolean), keep, areas, dos: dos.filter(Boolean), avoids: avoids.filter(Boolean), scene, ask,
      timing, season, chapters, dates, moon, personal, tarot,
      topSignal: { kind: top.kind, planet: top.planet, house: top.house, score: +top.score.toFixed(2) },
      signals: S.slice(0, 6).map(s => ({ kind: s.kind, planet: s.planet, house: s.house, score: +s.score.toFixed(2) })),
      positions: D.bodies.map(b => ({ key: b.key, name: c.planets[b.key], glyph: GLYPH[b.key], sign: b.sign, signName: c.signs[b.sign], deg: b.deg, retro: b.retro, house: sign ? eng.house(sign, b.signIndex) : null }))
    };
  }

  /* ---------- tarot ↔ sky: Golden Dawn attributions, only when today's sky actually touches them ---------- */
  const MAJOR = { 0: { el: 'air' }, 1: { p: 'mercury' }, 2: { p: 'moon' }, 3: { p: 'venus' }, 4: { s: 'aries' }, 5: { s: 'taurus' }, 6: { s: 'gemini' }, 7: { s: 'cancer' }, 8: { s: 'leo' }, 9: { s: 'virgo' }, 10: { p: 'jupiter' }, 11: { s: 'libra' }, 12: { el: 'water' }, 13: { s: 'scorpio' }, 14: { s: 'sagittarius' }, 15: { s: 'capricorn' }, 16: { p: 'mars' }, 17: { s: 'aquarius' }, 18: { s: 'pisces' }, 19: { p: 'sun' }, 20: { el: 'fire' }, 21: { p: 'saturn' } };
  // Minor 2–10 decans (Golden Dawn): suit → [sign, planet] for ranks 2..10
  const DECANS = {
    wands: [['aries', 'mars'], ['aries', 'sun'], ['aries', 'venus'], ['leo', 'saturn'], ['leo', 'jupiter'], ['leo', 'mars'], ['sagittarius', 'mercury'], ['sagittarius', 'moon'], ['sagittarius', 'saturn']],
    cups: [['cancer', 'venus'], ['cancer', 'mercury'], ['cancer', 'moon'], ['scorpio', 'mars'], ['scorpio', 'sun'], ['scorpio', 'venus'], ['pisces', 'saturn'], ['pisces', 'jupiter'], ['pisces', 'mars']],
    swords: [['libra', 'moon'], ['libra', 'saturn'], ['libra', 'jupiter'], ['aquarius', 'venus'], ['aquarius', 'mercury'], ['aquarius', 'moon'], ['gemini', 'jupiter'], ['gemini', 'mars'], ['gemini', 'sun']],
    pentacles: [['capricorn', 'jupiter'], ['capricorn', 'mars'], ['capricorn', 'sun'], ['taurus', 'mercury'], ['taurus', 'moon'], ['taurus', 'saturn'], ['virgo', 'sun'], ['virgo', 'venus'], ['virgo', 'mercury']]
  };
  const SUITS = ['wands', 'cups', 'swords', 'pentacles'];
  function cardBridge(id, D, sign, lang, cardName) {
    const eng = E(), c = C()[lang], t = c.t, byKey = Object.fromEntries(D.bodies.map(b => [b.key, b]));
    if (id <= 21) {
      const m = MAJOR[id];
      if (m.s) {
        const here = D.bodies.filter(b => b.sign === m.s).sort((a, b) => SPEED_ORDER.indexOf(a.key) - SPEED_ORDER.indexOf(b.key))[0];
        if (here && sign) return t.cardBridgeSign(cardName, lang === 'uk' ? m.s : c.signs[m.s], c.planets[here.key], eng.house(sign, here.signIndex));
        return '';
      }
      if (m.p && sign) return t.cardBridgePlanet(cardName, lang === 'uk' ? c.gen[m.p] : c.planets[m.p], eng.house(sign, byKey[m.p].signIndex));
      return '';
    }
    const suit = SUITS[Math.floor((id - 22) / 14)], rank = (id - 22) % 14; // 0 = Ace, 1..9 = 2..10
    if (rank >= 1 && rank <= 9) {
      const [s, p] = DECANS[suit][rank - 1];
      const here = D.bodies.filter(b => b.sign === s).sort((a, b) => SPEED_ORDER.indexOf(a.key) - SPEED_ORDER.indexOf(b.key));
      if (!here.length) return '';
      const names = here.map(b => c.planets[b.key]).join(lang === 'uk' ? ' і ' : ' and ');
      const h = sign ? eng.house(sign, eng.SIGNS.indexOf(s)) : null;
      if (lang === 'uk') return 'У деканах Золотої Зорі «' + cardName + '» — це ' + placeIn('uk', p, s) + '. Сьогодні в ' + c.signsLoc[s] + ' — ' + names + (h ? ', у вашому ' + c.ordLoc[h] + ' будинку. Читайте карту через сферу: ' + c.houseArena[h] + '.' : '.');
      return 'In the Golden Dawn decans, ' + cardName + ' is ' + placeIn('en', p, s).replace(/^the /, 'the ') + '. Today ' + c.signs[s] + ' holds ' + names + (h ? ' — your ' + c.ord(h) + ' house, so read the card through ' + c.houseArena[h] + '.' : '.');
    }
    return '';
  }

  root.OLIVIA_TODAY_COMPOSE = Object.freeze({ VERSION: '2.0.0', compose, signals, ranked, GLYPH, ASP_GLYPH, placeIn, ukPrep });

  // the interpretation library is loaded per language (lib-en.js / lib-uk.js) and handed in here
  root.OLIVIA_TODAY_COMPOSE = Object.freeze({ ...root.OLIVIA_TODAY_COMPOSE, setLibrary: lib => { root.OLIVIA_TODAY_LIB = lib; } });
export default root.OLIVIA_TODAY_COMPOSE;
