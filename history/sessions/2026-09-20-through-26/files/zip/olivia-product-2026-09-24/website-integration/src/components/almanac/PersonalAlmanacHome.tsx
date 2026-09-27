/** The self-contained Olivia experience owns its viewport and scroll journey. */
export default function PersonalAlmanacHome() {
  return (
    <main
      id="main-content"
      className="relative h-[100svh] w-full overflow-hidden bg-[#071522]"
    >
      <a
        href="/experience/index.html"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-[#f5f0e5] focus:px-4 focus:py-3 focus:text-[#071522]"
      >
        Open the Olivia Arcana experience directly
      </a>
      <iframe
        src="/experience/index.html?site=1"
        title="Olivia Arcana — a card, a question, a moment for yourself"
        className="block h-full w-full border-0"
        loading="eager"
      />
      <noscript>
        <p className="absolute inset-x-0 bottom-0 bg-[#071522] p-4 text-center text-[#f5f0e5]">
          <a href="/experience/index.html" className="underline">
            Open the Olivia Arcana experience
          </a>
        </p>
      </noscript>
    </main>
  );
}
