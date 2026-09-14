import { Body, Equator, EquatorFromVector, Horizon, MoonPhase, Observer, RotateVector, Rotation_ECT_EQD, Rotation_EQJ_EQD, Spherical, VectorFromSphere } from "astronomy-engine";
import type { NatalChart } from "@/lib/natal-chart";

const RAD = Math.PI / 180;
type CatalogStar = { ra: number; dec: number; mag: number };

/** Zenith at the centre, north above and east left: looking up at the sky. */
export function horizonPoint(altitude: number, azimuth: number) {
  // Objects below the horizon are schematic: the projection is capped before
  // its nadir singularity, and their numerical altitude remains unmodified.
  const radius = Math.min(1.22, Math.tan((90 - altitude) * RAD / 2));
  return { x: -radius * Math.sin(azimuth * RAD), y: -radius * Math.cos(azimuth * RAD), alt: altitude, az: azimuth };
}

/** Observed sky is independent of the geocentric longitudes printed on the atlas. */
export function birthSkyGeometry(chart: NatalChart, catalog: readonly CatalogStar[] = []) {
  const inp = chart.input;
  const utc = new Date(Date.UTC(inp.year, inp.month - 1, inp.day, inp.hour, inp.minute) - inp.timezone * 3600e3);
  const observer = new Observer(inp.latitude, inp.longitude, 0);
  const horizontal = (ra: number, dec: number) => {
    const h = Horizon(utc, observer, ra, dec); // geometric horizon, no atmospheric refraction
    return horizonPoint(h.altitude, h.azimuth);
  };
  const planets = chart.planets.map(planet => {
    const equatorial = Equator(planet.name as Body, utc, observer, true, true);
    return { ...horizontal(equatorial.ra, equatorial.dec), name: planet.name, glyph: planet.glyph, longitude: planet.longitude };
  });
  // Catalog coordinates are J2000. Precession/nutation are applied for the date;
  // this reference backdrop does not model each star's proper motion.
  const rotation = Rotation_EQJ_EQD(utc);
  const stars = catalog.map(star => {
    const vector = VectorFromSphere(new Spherical(star.dec, star.ra * 15, 1), utc);
    const equatorial = EquatorFromVector(RotateVector(rotation, vector));
    return { ...horizontal(equatorial.ra, equatorial.dec), mag: star.mag };
  });
  const eclipticRotation = Rotation_ECT_EQD(utc);
  const eclipticPoint = (longitude: number) => {
    const vector = VectorFromSphere(new Spherical(0, longitude, 1), utc);
    const equatorial = EquatorFromVector(RotateVector(eclipticRotation, vector));
    return horizontal(equatorial.ra, equatorial.dec);
  };
  const ecliptic = Array.from({ length: 181 }, (_, i) => eclipticPoint(i * 2));
  const asc = chart.timeKnown !== false && chart.ascendant ? eclipticPoint(chart.ascendant.longitude) : null;
  return { planets, stars, ecliptic, asc, phase: MoonPhase(utc), sunUp: planets.find(p => p.name === "Sun")!.alt > 0 };
}
