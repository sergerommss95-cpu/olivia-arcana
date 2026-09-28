import TransitionLink from "@/components/transitions/TransitionLink";

/** Shown on payment pages while membership is closed: nothing was sold, so nothing is pending. */
export default function MembershipClosed() {
  return <>
    <h1 className="alm-h1" style={{ marginBottom: "1rem" }}>Membership is not open yet</h1>
    <p style={{ margin: "0 auto 1.8rem", maxWidth: "26rem", color: "var(--ink-soft)", lineHeight: 1.7 }}>
      No payment has been taken. Every reading on Olivia Arcana is free while membership is prepared.
    </p>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem" }}>
      <TransitionLink href="/" className="alm-btn">Begin a reading</TransitionLink>
      <TransitionLink href="/pricing" className="alm-link">Free readings &amp; membership</TransitionLink>
    </div>
  </>;
}
