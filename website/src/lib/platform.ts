/**
 * platform.ts — runtime device + native-shell detection.
 *
 * Why this exists: Apple takes 30% on any digital subscription sold inside an
 * iOS native shell (UIWebView/WKWebView/SwiftUI WebView). Paddle takes 5%.
 * The Spotify model: when running inside the native iOS shell, hide all
 * Subscribe/Buy CTAs and let the user upgrade on the open web.
 *
 * The site itself (Safari mobile) keeps full pricing — Apple has no claim
 * unless we wrap the same site in a native iOS app.
 *
 * Safe at SSR (returns false / "web" before mount).
 */

export type Platform = "ios-app" | "android-app" | "ios-web" | "android-web" | "web";

/**
 * True only when running inside the (future) Olivia Arcana iOS native app.
 *
 * The native app sets `window.OliviaArcanaShell = { platform: "ios" }` at
 * startup. We never trust the User-Agent alone — Mobile Safari shares a UA
 * with WKWebView. The shell injection is the only reliable signal.
 *
 * Until the native app ships, this always returns false.
 */
export function isIosNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const shell = (window as unknown as { OliviaArcanaShell?: { platform?: string } }).OliviaArcanaShell;
  if (shell?.platform === "ios") return true;
  // Defensive secondary check for Capacitor / Cordova naming if we use one.
  if ((window as unknown as { Capacitor?: { platform?: string } }).Capacitor?.platform === "ios") return true;
  return false;
}

export function isAndroidNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const shell = (window as unknown as { OliviaArcanaShell?: { platform?: string } }).OliviaArcanaShell;
  if (shell?.platform === "android") return true;
  if ((window as unknown as { Capacitor?: { platform?: string } }).Capacitor?.platform === "android") return true;
  return false;
}

/**
 * True if user is inside an Olivia Arcana native shell on either platform.
 * Use this to hide Subscribe CTAs to comply with Apple/Google billing rules.
 */
export function isNativeShell(): boolean {
  return isIosNativeShell() || isAndroidNativeShell();
}

/**
 * Best-effort platform classification for analytics / conditional UI.
 */
export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  if (isIosNativeShell()) return "ios-app";
  if (isAndroidNativeShell()) return "android-app";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios-web";
  if (/Android/i.test(ua)) return "android-web";
  return "web";
}

/**
 * Returns the URL to send a user to when we want them to subscribe on the
 * open web (out of the native shell). Includes a hint so the destination
 * page can show a "you've left the app to upgrade" message.
 */
export function externalUpgradeUrl(): string {
  return "https://oliviaarcana.com/#pricing?from=app";
}
