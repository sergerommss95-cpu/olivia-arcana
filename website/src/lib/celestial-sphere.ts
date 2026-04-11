export function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function greenwichSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T*T*0.000387933 - T*T*T/38710000.0;
  return ((gmst % 360) + 360) % 360;
}

export function localSiderealTime(date: Date, longitudeDeg: number): number {
  return ((greenwichSiderealTime(toJulianDate(date)) + longitudeDeg) % 360 + 360) % 360;
}

export function ascendantDegree(lst: number, latitudeDeg: number): number {
  const lstRad = lst * Math.PI / 180;
  const latRad = latitudeDeg * Math.PI / 180;
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(latRad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  return ((asc % 360) + 360) % 360;
}
