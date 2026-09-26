/** Static hosts may expose the root export as /index.html or /index.html/. */
export function ownsExperienceStage(pathname: string | null): boolean {
  if (pathname === null) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/index.html" || path === "/uk" || path === "/uk/index.html";
}
