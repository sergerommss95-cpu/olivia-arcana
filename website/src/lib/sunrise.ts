export function sunriseHour(date: Date, latDeg: number, lngDeg: number): number {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const decl = (23.45 * Math.PI / 180) * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const latRad = latDeg * Math.PI / 180;
  const cosH = -Math.tan(latRad) * Math.tan(decl);
  const H = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI;
  const B = (2 * Math.PI / 365) * (dayOfYear - 81);
  const eot = 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solarNoon = 12 - lngDeg / 15 + eot / 60;
  return solarNoon - H / 15;
}
