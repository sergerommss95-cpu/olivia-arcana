import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "DMCA Policy — Olivia Arcana",
  description: "How to file a DMCA copyright takedown notice with Olivia Arcana.",
};

export default function DmcaPage() {
  return (
    <LegalShell title="DMCA Policy" updated="April 25, 2026">
      <p>
        Olivia Arcana respects the intellectual property rights of others and
        complies with the U.S. Digital Millennium Copyright Act (17 U.S.C.
        §512). If you believe content on the Service infringes your copyright,
        you may file a notice using the procedure below.
      </p>

      <h2>Filing a DMCA takedown notice</h2>
      <p>
        Send the notice to <a href="mailto:dmca@oliviaarcana.com">dmca@oliviaarcana.com</a>.
        It must include all of the following:
      </p>
      <ol>
        <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>Identification of the allegedly infringing material and where it is located on our Service (URL).</li>
        <li>Your contact information: name, address, telephone, email.</li>
        <li>A statement that you have a good-faith belief the use is not authorized by the owner, agent, or law.</li>
        <li>A statement, under penalty of perjury, that the information is accurate and that you are authorized to act on behalf of the owner.</li>
      </ol>
      <p>
        Incomplete notices may not be actionable. Submitting a knowingly false
        notice may expose you to liability for damages under §512(f).
      </p>

      <h2>Counter-notice</h2>
      <p>
        If you believe your content was removed by mistake or misidentification,
        you may file a counter-notice with:
      </p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the removed material and its prior location.</li>
        <li>A statement, under penalty of perjury, of your good-faith belief that the removal was a mistake or misidentification.</li>
        <li>Your name, address, and a statement consenting to the jurisdiction of the federal court for the district of your address (or, if outside the U.S., any district where Olivia Arcana LLC may be found).</li>
        <li>A statement that you will accept service of process from the complaining party.</li>
      </ol>

      <h2>Repeat infringers</h2>
      <p>
        We will terminate accounts of users who are determined to be repeat
        copyright infringers.
      </p>

      <h2>Designated agent</h2>
      <address style={{ fontStyle: "normal", marginTop: "1rem" }}>
        DMCA Agent — Olivia Arcana LLC<br />
        Email: <a href="mailto:dmca@oliviaarcana.com">dmca@oliviaarcana.com</a>
      </address>
    </LegalShell>
  );
}
