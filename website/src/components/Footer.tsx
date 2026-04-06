export default function Footer() {
  const zodiacSigns = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <footer className="relative py-20 px-6 border-t border-celestial-gold/10">
      <div className="max-w-6xl mx-auto">
        {/* Zodiac strip */}
        <div className="flex justify-center gap-4 mb-12 text-celestial-gold/30 text-lg">
          {zodiacSigns.map((sign, i) => (
            <span key={i} className="hover:text-celestial-gold transition-colors cursor-default">
              {sign}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-celestial-gold text-xl">&#10022;</span>
              <span className="font-[family-name:var(--font-heading)] text-xl font-semibold text-celestial-gold">
                Olivia Arcana
              </span>
            </div>
            <p className="text-muted-lavender text-sm leading-relaxed max-w-md">
              Personalized astrology readings calculated from your exact planetary positions
              using NASA JPL ephemeris data. Your chart. Your truth.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Living Cosmos", href: "/cosmos" },
                { label: "Celestial Portrait", href: "/portrait" },
                { label: "Birth Chart", href: "/chart" },
                { label: "Ask the Stars", href: "/ask" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              Connect
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Telegram Bot", href: "https://t.me/OliviaArcanaBot" },
                { label: "Telegram Channel", href: "https://t.me/OliviaArcanaDaily" },
                { label: "Celestial Portrait", href: "/portrait" },
                { label: "Onboarding", href: "/onboarding" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-celestial-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-lavender/50 text-xs">
            &copy; {new Date().getFullYear()} Olivia Arcana. The stars guide, you decide.
          </p>
          <p className="text-muted-lavender/30 text-xs">
            Astronomical data: NASA JPL DE440/DE441 Ephemeris
          </p>
        </div>
      </div>
    </footer>
  );
}
