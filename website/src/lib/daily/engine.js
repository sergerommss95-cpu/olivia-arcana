/* Ported from Olivia Today (outputs/olivia-today) by work/olivia-today/port-to-site.mjs. Edit the source there, then re-run the port. */
// @ts-nocheck
/* Olivia · Today — sky timing engine 2.0.0
 * Pure astronomy on top of the bundled Astronomy Engine 2.1.19 (via ../olivia-sky-card/engine.js).
 * Apparent geocentric tropical longitudes, true ecliptic of date — identical to OliviaSky.skyForDate.
 * Adds what a daily horoscope needs and the previous edition lacked: retrograde windows and stations,
 * sign ingresses, lunar quarters, Moon sign changes, exact aspect times, and natal ranges for unknown
 * birth times. Calendar day follows Europe/Kyiv; the daily snapshot is local noon in Kyiv. */
import * as Astronomy from 'astronomy-engine';
import OUTER_TABLE from './outer-table.js';
const root = { Astronomy, OLIVIA_OUTER_TABLE: OUTER_TABLE };
  'use strict';
  const A = root.Astronomy;
  const DAY = 86400000, HOUR = 3600000;
  const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const RULERS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  const MODERN_RULERS = { scorpio: 'pluto', aquarius: 'uranus', pisces: 'neptune' };
  const ASPECTS = [
    { key: 'conjunction', angle: 0, family: 'conj' },
    { key: 'sextile', angle: 60, family: 'soft' },
    { key: 'square', angle: 90, family: 'hard' },
    { key: 'trine', angle: 120, family: 'soft' },
    { key: 'opposition', angle: 180, family: 'hard' }
  ];
  const FAST = ['sun', 'moon', 'mercury', 'venus', 'mars'];
  const SLOW = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const PHASES = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
  const QUARTERS = ['new', 'firstQuarter', 'full', 'lastQuarter'];
  // Scan steps (days) and horizons used to find the edges of a body's stay in a sign.
  const SCAN = { sun: [1, 35], moon: [0.25, 3.5], mercury: [1, 120], venus: [1, 200], mars: [2, 300], jupiter: [4, 500], saturn: [6, 1200], uranus: [15, 3600], neptune: [20, 6200], pluto: [25, 9500] };
  const ZONE = 'Europe/Kyiv';

  if (!A || !A.GeoVector) throw new Error('Load ../olivia-sky-card/engine.js (Astronomy Engine) before today-engine.js');

  const norm = x => ((x % 360) + 360) % 360;
  const signed = x => { const r = norm(x); return r > 180 ? r - 360 : r; };
  const sep = (a, b) => Math.abs(signed(a - b));
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const signIndex = lon => Math.floor(norm(lon) / 30);

  function lonExact(key, t) {
    const date = t instanceof Date ? t : new Date(t);
    if (key === 'sun') return A.SunPosition(date).elon;
    if (key === 'moon') return A.EclipticGeoMoon(date).lon;
    return A.Ecliptic(A.GeoVector(cap(key), date, true)).elon;
  }
  // Pluto is integrated numerically by Astronomy Engine (~2 ms/call). Inside ±10 days of an anchor a
  // parabola through three exact positions stays within ~0.001° of the exact value.
  let plutoFit = null;
  function lon(key, t) {
    if (key !== 'pluto') return lonExact(key, t);
    const ms = +t;
    if (!plutoFit || Math.abs(ms - plutoFit.t) > 10 * DAY) {
      const h = 8 * DAY, l0 = lonExact('pluto', ms), lm = l0 + signed(lonExact('pluto', ms - h) - l0), lp = l0 + signed(lonExact('pluto', ms + h) - l0);
      plutoFit = { t: ms, l0, b: (lp - lm) / (2 * h), c: (lp - 2 * l0 + lm) / (2 * h * h) };
    }
    const x = ms - plutoFit.t;
    return norm(plutoFit.l0 + plutoFit.b * x + plutoFit.c * x * x);
  }
  const OUTER = key => root.OLIVIA_OUTER_TABLE && root.OLIVIA_OUTER_TABLE[key];
  function speed(key, t) { // degrees per day, central difference over ±6h (±1h for the Moon)
    const h = key === 'moon' ? HOUR : 6 * HOUR;
    return signed(lon(key, t + h) - lon(key, t - h)) * DAY / (2 * h);
  }

  /* ---------- calendar (Kyiv) ---------- */
  function zoneOffsetMinutes(t) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(t));
    const g = k => +parts.find(p => p.type === k).value;
    return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - Math.floor(t / 60000) * 60000) / 60000);
  }
  function kyivInstant(dateISO, hh = 12, mm = 0) {
    const [y, m, d] = dateISO.split('-').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let t = guess - zoneOffsetMinutes(guess) * 60000;
    t = guess - zoneOffsetMinutes(t) * 60000;
    return t;
  }
  function todayISO(now = Date.now()) {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
    return p; // en-CA yields YYYY-MM-DD
  }
  function validDate(dateISO) {
    if (typeof dateISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) throw new RangeError('Use YYYY-MM-DD');
    const y = +dateISO.slice(0, 4);
    if (y < 1900 || y > 2100) throw new RangeError('Dates 1900–2100 only');
    return dateISO;
  }

  /* ---------- search helpers ---------- */
  function bisect(f, t0, t1, tol = 60000) { // f changes sign (or boolean flips) between t0 and t1
    let a = Math.min(t0, t1), b = Math.max(t0, t1), fa = f(a);
    while (b - a > tol) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
    return (a + b) / 2;
  }
  function signEdge(key, t, dir) { // instant when the body enters (dir -1) or leaves (dir +1) its current sign
    if (OUTER(key)) {
      const rows = OUTER(key).ingress; let i = rows.findIndex(r => r[0] > t);
      if (i < 0) return null;
      const row = dir > 0 ? rows[i] : rows[i - 1];
      return row && (dir > 0 || i > 0) ? { at: row[0], sign: SIGNS[dir > 0 ? row[1] : (rows[i - 2] ? rows[i - 2][1] : row[1])] } : null;
    }
    const [stepDays, horizon] = SCAN[key], step = stepDays * DAY * dir, s0 = signIndex(lon(key, t));
    for (let x = t + step, n = 0; Math.abs(x - t) <= horizon * DAY; x += step, n++) {
      if (signIndex(lon(key, x)) !== s0) {
        const edge = bisect(y => signIndex(lon(key, y)) === s0 ? 1 : -1, x - step, x);
        return { at: Math.round(edge), sign: SIGNS[signIndex(lon(key, x))] };
      }
    }
    return null;
  }
  const STATION_STEP = { mercury: 1, venus: 2, mars: 3, jupiter: 5, saturn: 5, uranus: 6, neptune: 6, pluto: 6 };
  const STATION_SPAN = { mercury: 40, venus: 50, mars: 90, jupiter: 135, saturn: 150, uranus: 165, neptune: 170, pluto: 175 };
  function stationEdge(key, t, dir, horizonDays = STATION_SPAN[key]) { // next/previous instant the apparent motion reverses
    if (OUTER(key)) {
      const rows = OUTER(key).stations, i = rows.findIndex(r => r[0] > t), row = dir > 0 ? rows[i] : rows[i < 0 ? rows.length - 1 : i - 1];
      if (!row || Math.abs(row[0] - t) > horizonDays * DAY) return null;
      return { at: row[0], turns: row[1] ? 'retrograde' : 'direct', sign: SIGNS[signIndex(row[2])], deg: row[2] % 30 };
    }
    const r0 = speed(key, t) < 0, step = STATION_STEP[key] * DAY * dir;
    for (let x = t + step; Math.abs(x - t) <= horizonDays * DAY; x += step) {
      if ((speed(key, x) < 0) !== r0) {
        const at = bisect(y => speed(key, y), x - step, x, 10 * 60000);
        const l = lon(key, at);
        // scanning forward, a retrograde body next turns direct; scanning backward, we found where it turned retrograde
        const turns = dir > 0 ? (r0 ? 'direct' : 'retrograde') : (r0 ? 'retrograde' : 'direct');
        return { at: Math.round(at), turns, sign: SIGNS[signIndex(l)], deg: norm(l) % 30 };
      }
    }
    return null;
  }

  /* ---------- the day ---------- */
  function moonPhaseKey(angle) { return PHASES[Math.floor(((angle + 22.5) % 360) / 45)]; }
  function moonFacts(t) {
    const angle = A.MoonPhase(new Date(t)), illum = (1 - Math.cos(angle * Math.PI / 180)) / 2;
    // previous new Moon and the next four quarters
    const prevNew = A.SearchMoonPhase(0, new Date(t - 31 * DAY), 31);
    let q = A.SearchMoonQuarter(new Date(t - 14 * HOUR)); const quarters = []; // from the start of the Kyiv day, so a dawn lunation counts
    for (let i = 0; i < 4; i++) {
      const at = q.time.date.getTime();
      quarters.push({ key: QUARTERS[q.quarter], at, sign: SIGNS[signIndex(lon('moon', at))], deg: norm(lon('moon', at)) % 30 });
      q = A.NextMoonQuarter(q);
    }
    const prev = prevNew && prevNew.date.getTime() < t ? prevNew.date.getTime() : null;
    // Moon sign changes in the next 72h (hourly scan + bisection)
    const ingresses = []; let s = signIndex(lon('moon', t));
    for (let x = t + HOUR; x <= t + 72 * HOUR; x += HOUR) {
      const s1 = signIndex(lon('moon', x));
      if (s1 !== s) { const at = bisect(y => signIndex(lon('moon', y)) === s ? 1 : -1, x - HOUR, x); ingresses.push({ at: Math.round(at), from: SIGNS[s], to: SIGNS[s1] }); s = s1; }
    }
    const entered = signEdge('moon', t, -1);
    return {
      angle, illum, phase: moonPhaseKey(angle), waxing: angle < 180,
      age: prev ? (t - prev) / DAY : null,
      prevNew: prev ? { at: prev, sign: SIGNS[signIndex(lon('moon', prev))] } : null,
      quarters, ingresses, enteredSignAt: entered ? entered.at : null
    };
  }

  function aspectTiming(a, b, angle, t) {
    const f = x => sep(lon(a, x), lon(b, x)) - angle;
    const fast = a === 'moon' || b === 'moon';
    const step = (fast ? 1 : 6) * HOUR, span = (fast ? 2 : 6) * DAY;
    const now = f(t), next = f(t + step);
    const applying = Math.abs(next) < Math.abs(now) || (angle === 0 && next < now) || (angle === 180 && next > now);
    // exact = local minimum of |f| (f may touch 0 without sign change at 0°/180°)
    let best = { at: t, v: Math.abs(now) };
    for (let x = t - span; x <= t + span; x += step) { const v = Math.abs(f(x)); if (v < best.v) best = { at: x, v }; }
    let lo = best.at - step, hi = best.at + step;
    for (let i = 0; i < 26; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2; else lo = m1; }
    const at = (lo + hi) / 2, miss = Math.abs(f(at));
    return { applying, exactAt: miss < 0.05 ? Math.round(at) : null };
  }

  function aspectsAt(bodies, t, opts = {}) {
    const out = [];
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const p = bodies[i], q = bodies[j], d = sep(p.lon, q.lon);
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        const limit = (p.key === 'moon' || q.key === 'moon') ? 5 : (SLOW.includes(p.key) && SLOW.includes(q.key)) ? 2 : 3;
        if (orb <= limit) {
          const timing = opts.timing === false ? { applying: null, exactAt: null } : aspectTiming(p.key, q.key, asp.angle, t);
          out.push({ id: p.key + '-' + q.key + ':' + asp.key, a: p.key, b: q.key, key: asp.key, family: asp.family, angle: asp.angle, orb, limit, ...timing,
            period: (p.key === 'moon' || q.key === 'moon') ? 'hours' : (SLOW.includes(p.key) && SLOW.includes(q.key)) ? 'era' : FAST.includes(p.key) && FAST.includes(q.key) ? 'days' : 'weeks' });
        }
      }
    }
    return out.sort((x, y) => x.orb / x.limit - y.orb / y.limit);
  }

  function bodiesAt(t) {
    return BODIES.map(key => {
      const l = norm(lon(key, t)), v = speed(key, t), si = signIndex(l);
      return { key, lon: l, sign: SIGNS[si], signIndex: si, deg: l % 30, speed: v, retro: v < 0 };
    });
  }

  function stayInSign(key, t) {
    const entered = signEdge(key, t, -1), leaves = signEdge(key, t, +1);
    return { enteredAt: entered ? entered.at : null, cameFrom: entered ? entered.sign : null, leavesAt: leaves ? leaves.at : null, nextSign: leaves ? leaves.sign : null };
  }

  function retroWindow(key, t) {
    if (key === 'sun' || key === 'moon') return null;
    const v = speed(key, t);
    if (v < 0) {
      const start = stationEdge(key, t, -1), end = stationEdge(key, t, +1);
      return { state: 'retrograde', start, end };
    }
    const next = stationEdge(key, t, +1, 45);
    if (next && next.turns === 'retrograde') {
      const back = stationEdge(key, next.at + DAY, +1);
      return { state: 'upcoming', start: next, end: back };
    }
    const prev = stationEdge(key, t, -1, 30);
    if (prev && prev.turns === 'direct') return { state: 'recent-direct', end: prev };
    return null;
  }

  function day(options = {}) {
    const date = validDate(options.date || todayISO());
    const t = kyivInstant(date, 12, 0), dayStart = kyivInstant(date, 0, 0), dayEnd = kyivInstant(date, 23, 59);
    const bodies = bodiesAt(t);
    const moon = moonFacts(t);
    const aspects = aspectsAt(bodies, t);
    const stays = {}, retro = {};
    for (const b of bodies) { if (b.key !== 'moon') stays[b.key] = stayInSign(b.key, t); retro[b.key] = retroWindow(b.key, t); }
    stays.moon = { enteredAt: moon.enteredSignAt, leavesAt: moon.ingresses[0] ? moon.ingresses[0].at : null, nextSign: moon.ingresses[0] ? moon.ingresses[0].to : null };
    // Events in the next 14 days: lunar quarters, ingresses of Sun..Saturn, stations
    const horizon = t + 14 * DAY, events = [];
    for (const q of moon.quarters) if (q.at > dayStart && q.at <= horizon) events.push({ kind: 'lunation', key: 'moon', phase: q.key, at: q.at, sign: q.sign, deg: q.deg });
    for (const key of ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
      const s = stays[key]; if (s && s.leavesAt && s.leavesAt > dayStart && s.leavesAt <= horizon) events.push({ kind: 'ingress', key, at: s.leavesAt, sign: s.nextSign });
      const r = retro[key];
      for (const st of r ? [r.start, r.end] : []) if (st && st.at > dayStart && st.at <= horizon) events.push({ kind: 'station', key, turns: st.turns, at: st.at, sign: st.sign, deg: st.deg });
    }
    const seen = new Set();
    const uniq = events.filter(e => { const id = e.kind + e.key + Math.round(e.at / HOUR); if (seen.has(id)) return false; seen.add(id); return true; });
    uniq.sort((a, b) => a.at - b.at);
    // Eclipses within the next 45 days
    const eclipses = [];
    try {
      const le = A.SearchLunarEclipse(new Date(dayStart)); if (le && le.peak.date.getTime() - dayStart < 45 * DAY) eclipses.push({ kind: 'lunar', type: le.kind, at: le.peak.date.getTime(), sign: SIGNS[signIndex(lon('moon', le.peak.date.getTime()))] });
      const se = A.SearchGlobalSolarEclipse(new Date(dayStart)); if (se && se.peak.date.getTime() - dayStart < 45 * DAY) eclipses.push({ kind: 'solar', type: se.kind, at: se.peak.date.getTime(), sign: SIGNS[signIndex(lon('sun', se.peak.date.getTime()))] });
    } catch (e) { /* eclipse search is a bonus, never block the day */ }
    // sunrise and sunset in Kyiv, for the day/night band on the timing strip
    let sun = null;
    try {
      const obs = new A.Observer(50.45, 30.52, 180);
      const rise = A.SearchRiseSet(A.Body.Sun, obs, +1, new Date(dayStart), 1), set = A.SearchRiseSet(A.Body.Sun, obs, -1, new Date(dayStart), 1);
      sun = { rise: rise ? rise.date.getTime() : null, set: set ? set.date.getTime() : null };
    } catch (e) { /* polar edge cases: no band */ }
    return { version: '2.0.0', date, asOf: t, dayStart, dayEnd, bodies, moon, aspects, stays, retro, events: uniq, eclipses, sun };
  }

  /* ---------- houses relative to a Sun sign (solar houses) ---------- */
  function house(signKey, bodySignIndex) { const s = SIGNS.indexOf(signKey); return ((bodySignIndex - s + 12) % 12) + 1; }

  /* ---------- natal (birth) positions with honest uncertainty ---------- */
  function parseOffset(text) {
    const m = /^([+-])(\d{1,2}):?(\d{2})?$/.exec(String(text || '').trim());
    if (!m) return null;
    const mins = (+m[2]) * 60 + (+(m[3] || 0)); if (mins > 14 * 60) return null;
    return (m[1] === '-' ? -1 : 1) * mins;
  }
  function natal(input) {
    const date = validDate(input.date);
    const [y, mo, d] = date.split('-').map(Number);
    const offset = input.offset != null && input.offset !== '' ? parseOffset(input.offset) : null;
    const timeKnown = !!input.time && /^\d{1,2}:\d{2}$/.test(input.time) && offset != null;
    let instants;
    if (timeKnown) {
      const [hh, mm] = input.time.split(':').map(Number);
      instants = [Date.UTC(y, mo - 1, d, hh, mm) - offset * 60000];
    } else if (offset != null) {
      const start = Date.UTC(y, mo - 1, d, 0, 0) - offset * 60000; instants = Array.from({ length: 25 }, (_, i) => start + i * HOUR);
    } else {
      const start = Date.UTC(y, mo - 1, d, 0, 0) - 14 * 60 * 60000; instants = Array.from({ length: 51 }, (_, i) => start + i * HOUR); // UTC−12 … UTC+14
    }
    const keys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const bodies = keys.map(key => {
      const ls = instants.map(x => norm(lon(key, x))), base = ls[0];
      const deltas = ls.map(l => signed(l - base)), lo = Math.min(...deltas) - (timeKnown ? 0 : 0.02), hi = Math.max(...deltas) + (timeKnown ? 0 : 0.02);
      const mid = norm(base + (lo + hi) / 2), half = (hi - lo) / 2;
      const signs = [...new Set([signIndex(base + lo), signIndex(base + hi), ...ls.map(signIndex)])].map(i => SIGNS[i]);
      return { key, lon: mid, half, range: [norm(base + lo), norm(base + hi)], signs, sign: SIGNS[signIndex(mid)], deg: mid % 30 };
    });
    const usable = bodies.filter(b => b.key !== 'moon' || b.half < 1.5); // the natal Moon needs a birth time
    return { timeKnown, zoneKnown: offset != null, bodies: usable, moonKnown: usable.some(b => b.key === 'moon'), sunSigns: bodies[0].signs };
  }
  function transitsToNatal(sky, nat) {
    const out = [], targets = nat.bodies.filter(b => FAST.includes(b.key));
    for (const p of sky.bodies) for (const n of targets) for (const asp of ASPECTS) {
      const d = sep(p.lon, n.lon), orb = Math.abs(d - asp.angle), worst = orb + n.half;
      const limit = p.key === 'moon' ? 4 : FAST.includes(p.key) ? 2.5 : 2;
      if (worst <= limit) {
        const l2 = lon(p.key, sky.asOf + (p.key === 'moon' ? HOUR : DAY)), applying = Math.abs(sep(l2, n.lon) - asp.angle) < orb;
        out.push({ id: p.key + '>' + n.key + ':' + asp.key, t: p.key, n: n.key, key: asp.key, family: asp.family, orb, worst, limit, applying,
          period: p.key === 'moon' ? 'hours' : FAST.includes(p.key) ? 'days' : p.key === 'jupiter' ? 'weeks' : 'months', retro: p.retro });
      }
    }
    return out.sort((x, y) => x.worst / x.limit - y.worst / y.limit);
  }

  /* ---------- the Moon's exact contacts inside one Kyiv day (for the timing strip) ---------- */
  function moonContacts(dayStart, dayEnd) {
    const out = [], t0 = dayStart - HOUR, n = Math.ceil((dayEnd - t0) / HOUR) + 1;
    const moonL = Array.from({ length: n }, (_, i) => lon('moon', t0 + i * HOUR));
    for (const key of BODIES.filter(k => k !== 'moon')) {
      // planets barely move in a day: interpolate linearly between two exact positions
      const l0 = lon(key, t0), l1 = l0 + signed(lon(key, t0 + (n - 1) * HOUR) - l0), pl = x => l0 + (l1 - l0) * (x - t0) / ((n - 1) * HOUR);
      for (const asp of ASPECTS) {
        const f = x => sep(lon('moon', x), pl(x)) - asp.angle;
        const fi = i => sep(moonL[i], pl(t0 + i * HOUR)) - asp.angle;
        for (let i = 1; i < n; i++) {
          const v = fi(i), prev = fi(i - 1);
          if (Math.sign(v) === Math.sign(prev) && Math.abs(v) >= 0.6) continue;
          let lo = t0 + (i - 1) * HOUR, hi = t0 + i * HOUR;
          for (let k = 0; k < 18; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2; else lo = m1; }
          const at = Math.round((lo + hi) / 2), wStart = t0 + (i - 1) * HOUR, wEnd = t0 + i * HOUR;
          if (at - wStart < 60000 || wEnd - at < 60000) continue; // minimum sits on the window edge: the true exact moment is in a neighbouring hour
          if (Math.abs(f(at)) < 0.1 && at >= dayStart && at <= dayEnd && !out.some(o => o.b === key && o.key === asp.key && Math.abs(o.at - at) < 3 * HOUR))
            out.push({ a: 'moon', b: key, key: asp.key, family: asp.family, at });
        }
      }
    }
    return out.sort((x, y) => x.at - y.at);
  }

  /* ---------- formatting ---------- */
  function fmt(t, lang, opts) {
    const loc = lang === 'uk' ? 'uk-UA' : 'en-GB', d = new Date(t), f = new Intl.DateTimeFormat(loc, { timeZone: ZONE, ...opts });
    if (lang !== 'uk' || !opts || !opts.weekday) return f.format(d);
    // Chromium's ICU inflects a weekday joined to a date ("пʼятницю, 16 жовтня"); a dateline needs the nominative.
    const wd = new Intl.DateTimeFormat(loc, { timeZone: ZONE, weekday: opts.weekday }).format(d);
    return f.formatToParts(d).map(p => p.type === 'weekday' ? wd : p.value).join('');
  }

  root.OLIVIA_TODAY_ENGINE = Object.freeze({
    VERSION: '2.0.1', SIGNS, BODIES, RULERS, MODERN_RULERS, ASPECTS, FAST, SLOW, PHASES, ZONE,
    day, house, natal, transitsToNatal, moonContacts, todayISO, kyivInstant, fmt, lon, speed, signIndex, norm, sep
  });

export default root.OLIVIA_TODAY_ENGINE;
