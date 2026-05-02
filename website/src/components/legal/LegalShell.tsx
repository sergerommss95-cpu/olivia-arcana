"use client";

import Footer from "@/components/Footer";

interface LegalShellProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export default function LegalShell({ title, updated, children }: LegalShellProps) {
  return (
    <>
      <main id="main-content" className="relative z-10" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
        <article
          className="max-w-3xl mx-auto px-5 sm:px-8"
          style={{
            color: "rgba(240,236,255,0.92)",
            fontFamily: "var(--font-body)",
            lineHeight: 1.75,
          }}
        >
          <header style={{ marginBottom: "3rem", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-accent)",
                color: "rgba(212,175,55,0.85)",
                fontSize: "0.78rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                marginBottom: "0.6rem",
              }}
            >
              Olivia Arcana
            </p>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem, 5vw, 3rem)",
                fontWeight: 500,
                color: "rgba(245,240,232,0.96)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                marginTop: "0.9rem",
                color: "rgba(180,170,210,0.55)",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
              }}
            >
              Last updated: {updated}
            </p>
          </header>
          <div className="legal-prose">{children}</div>
        </article>
      </main>
      <Footer />
      <style>{`
        .legal-prose h2 {
          font-family: var(--font-heading);
          font-size: 1.55rem;
          font-weight: 500;
          color: rgba(232, 201, 106, 0.92);
          margin: 2.6rem 0 0.9rem;
          letter-spacing: 0.01em;
        }
        .legal-prose h3 {
          font-family: var(--font-heading);
          font-size: 1.18rem;
          font-weight: 500;
          color: rgba(245,240,232,0.94);
          margin: 1.8rem 0 0.6rem;
        }
        .legal-prose p { margin: 0.85rem 0; color: rgba(220,212,238,0.88); }
        .legal-prose a { color: rgba(232,201,106,0.92); text-decoration: underline; text-underline-offset: 3px; }
        .legal-prose a:hover { color: rgba(245,220,150,1); }
        .legal-prose ul, .legal-prose ol { padding-left: 1.4rem; margin: 0.8rem 0; }
        .legal-prose li { margin: 0.35rem 0; color: rgba(220,212,238,0.88); }
        .legal-prose strong { color: rgba(245,240,232,0.98); font-weight: 600; }
        .legal-prose hr {
          border: none;
          border-top: 1px solid rgba(200,185,255,0.10);
          margin: 2.5rem 0;
        }
        .legal-prose blockquote {
          border-left: 2px solid rgba(212,175,55,0.45);
          padding: 0.4rem 1rem;
          margin: 1.2rem 0;
          color: rgba(220,212,238,0.78);
          font-family: var(--font-heading);
          font-style: italic;
        }
      `}</style>
    </>
  );
}
