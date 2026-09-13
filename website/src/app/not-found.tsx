/**
 * 404 — Lost in the Cosmos, filed as an erratum of the Personal Almanac.
 * Server component: styled with the shell's shared classes + inline ink.
 */

import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";

export default function NotFound() {
  return (
    <AlmanacShell narrow>
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            fontSize: "2.6rem",
            color: "var(--ox)",
            opacity: 0.65,
            marginBottom: "1.4rem",
            lineHeight: 1,
          }}
        >
          ✦
        </div>

        <p className="alm-kicker" style={{ marginBottom: "0.9rem" }}>
          Erratum · 404
        </p>

        <h1 className="alm-h1" style={{ marginBottom: "1rem" }}>
          Lost in the Cosmos
        </h1>

        <p
          className="alm-lead"
          style={{ maxWidth: "40ch", margin: "0 0 2.2rem" }}
        >
          The stars couldn&apos;t find this page. Perhaps it exists in another dimension.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.2rem 1.8rem",
          }}
        >
          <TransitionLink href="/" className="alm-btn">
            Return Home
          </TransitionLink>
          <TransitionLink href="/portrait" className="alm-link">
            Celestial Portrait
          </TransitionLink>
        </div>
      </div>
    </AlmanacShell>
  );
}
