from pathlib import Path
p=Path('work/tarot-staging/FramerTarotOracle.tsx');s=p.read_text()
def replace(a,b):
 global s
 assert a in s, a[:100]
 s=s.replace(a,b)
replace('"preparing" | "spread" | "result"','"preparing" | "spread" | "revealing" | "result"')
replace('(state === "spread" && p.id === "preparing")','((state === "spread" || state === "revealing") && p.id === "preparing")')
replace('Math.sin(t / 2000) * 5','prefersReduced ? 0 : Math.sin(t / 2000) * 2')
replace('  const [inspecting, setInspecting]', '  const [revealedCards, setRevealedCards] = useState<number[]>([]);\n  const [lastRevealed, setLastRevealed] = useState<number | null>(null);\n  const ritualTimer = useRef<ReturnType<typeof setTimeout> | null>(null);\n  const revealButtonRef = useRef<HTMLButtonElement>(null);\n  const [inspecting, setInspecting]')
replace('      scale,\n      cx:', '      scale,\n      viewportWidth: viewport.w,\n      cx:')
replace('      const indices = drawParam\n        .split(",")\n        .map(Number)\n        .filter(n => Number.isInteger(n) && n >= 0 && n < restoredPool);\n      if (indices.length === want) {', '      const values = drawParam.split(",");\n      const indices = values.filter((value) => /^\\d+$/.test(value)).map(Number);\n      if (indices.length === want && new Set(indices).size === want &&\n          indices.every((n) => Number.isInteger(n) && n >= 0 && n < restoredPool)) {')
replace('          setSelectedCards(indices);\n          setState("result");','          setSelectedCards(indices);\n          setRevealedCards(indices);\n          setState("result");')
a=s.index('  const handleCardClick = useCallback');b=s.index('  /* ── THE SHEET',a)
s=s[:a]+'''  const clearRitualTimer = useCallback(() => {
    if (ritualTimer.current !== null) clearTimeout(ritualTimer.current);
    ritualTimer.current = null;
  }, []);
  useEffect(() => clearRitualTimer, [clearRitualTimer]);

  // Selection is a transaction. Timers belong to this sitting and are
  // cancelled when leaving it, so an old deal cannot reopen after reset.
  const handleCardClick = useCallback((id: number) => {
    if (state !== "drawing" || isTransitioning.current) return;
    const next = selectedCards.includes(id)
      ? selectedCards.filter((card) => card !== id)
      : [...selectedCards, id];
    if (next.length > spread.count) return;
    setSelectedCards(next);
    if (next.length === spread.count) {
      isTransitioning.current = true;
      setState("preparing");
      updateUrl(next);
      ritualTimer.current = setTimeout(() => {
        ritualTimer.current = null;
        setState("spread");
        isTransitioning.current = false;
      }, prefersReduced ? 0 : 850);
    }
  }, [state, selectedCards, updateUrl, spread.count, prefersReduced]);

  const reset = useCallback(() => {
    clearRitualTimer();
    isTransitioning.current = false;
    setInspecting(null);
    setRevealedCards([]);
    setLastRevealed(null);
    setState("focusing");
    setSelectedCards([]);
    setDeckSeed(Math.floor(Math.random() * 1e9));
    updateUrl([]);
    hoveredIndexMV.set(-1);
  }, [clearRitualTimer, updateUrl, hoveredIndexMV]);

  const turnCard = useCallback((id?: number) => {
    if ((state !== "spread" && state !== "revealing") || isTransitioning.current) return;
    const nextId = id ?? selectedCards.find((card) => !revealedCards.includes(card));
    if (nextId === undefined || revealedCards.includes(nextId)) return;
    const next = [...revealedCards, nextId];
    audio.playReveal();
    setRevealedCards(next);
    setLastRevealed(nextId);
    setState("revealing");
    if (next.length === selectedCards.length) {
      isTransitioning.current = true;
      ritualTimer.current = setTimeout(() => {
        ritualTimer.current = null;
        isTransitioning.current = false;
        setState("result");
      }, prefersReduced ? 0 : 650);
    }
  }, [state, selectedCards, revealedCards, prefersReduced]);

  const revealAll = useCallback(() => {
    clearRitualTimer();
    isTransitioning.current = false;
    audio.playReveal();
    setRevealedCards(selectedCards);
    setState("result");
  }, [clearRitualTimer, selectedCards]);

  useEffect(() => {
    if (state !== "spread") return;
    const frame = requestAnimationFrame(() => revealButtonRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [state]);

''' +s[b:]
replace('  const sheetDelay = prefersReduced ? 0 : 0.45 + spread.count * 0.08;', '  const sheetDelay = prefersReduced ? 0 : 0.35;\n  const lastCard = lastRevealed === null ? null : oracleData[lastRevealed];\n  const nextPosition = selectedCards.findIndex((id) => !revealedCards.includes(id));')
replace('        {/* ── NIGHT GROUND', '''        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {state === "drawing" ? selectionInstruction : state === "preparing"
            ? (isUk ? "Розкладаємо карти" : "Arranging your cards")
            : state === "revealing" && lastCard
              ? `${revealedCards.length} / ${spread.count}. ${(isUk && ukCard(lastCard.name)?.name) || lastCard.name}${reversedFlags[lastRevealed!] ? (isUk ? ", перевернута" : ", reversed") : ""}`
              : state === "result" ? (isUk ? "Ваше читання готове" : "Your reading is ready") : ""}
        </p>
        {/* ── NIGHT GROUND''')
replace('className="absolute z-40 flex flex-col items-center text-center px-6"','className="oracle-focus absolute z-40 flex flex-col items-center text-center px-6"')
replace('<h2 className="[font-family:var(--font-heading),serif] text-3xl md:text-5xl', '<p className="oracle-edition">{isUk ? "I · Студія Таро" : "I · The Tarot Studio"}</p>\n              <h2 className="[font-family:var(--font-heading),serif] text-3xl md:text-5xl')
replace('                {t("oracle_focus_cta")}\n              </button>', '''                {isUk ? `Почати · ${spread.count} карт` : `Begin · ${spread.count} cards`}
              </button>
              <p className="oracle-method">{isUk ? "Оберіть форму. Витягніть карти. Читайте у власному темпі." : "Choose a shape. Draw your cards. Read at your own pace."}</p>''')
a=s.index('          {state === "spread" && (');b=s.index('        </AnimatePresence>',a)
s=s[:a]+'''          {(state === "spread" || state === "revealing") && (
            <m.div
              key="spread"
              initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="oracle-turn-panel absolute z-40 text-center"
            >
              <p className="oracle-edition">{resultKicker} · {revealedCards.length} / {spread.count}</p>
              <h2>{lastCard ? ((isUk && ukCard(lastCard.name)?.name) || lastCard.name) : (isUk ? "Кожна карта — розділ." : "Each card, a chapter.")}</h2>
              <p className="oracle-turn-detail">{lastCard
                ? `${spreadLabels[selectedCards.indexOf(lastRevealed!)]}${reversedFlags[lastRevealed!] ? (isUk ? " · перевернута" : " · turned") : ""} · ${((isUk && ukCard(lastCard.name)?.keywords) || lastCard.keywords).slice(0, 3).join(" · ")}`
                : (isUk ? "Торкніться карти або розкрийте їх по черзі." : "Touch a card, or turn the story one by one.")}</p>
              <div className="oracle-turn-actions">
                <button ref={revealButtonRef} onClick={() => turnCard()} className="night-btn" disabled={nextPosition < 0}>
                  {nextPosition < 0 ? (isUk ? "Читання відкривається…" : "Opening your reading…")
                    : `${isUk ? "Розкрити" : "Turn"} ${String(nextPosition + 1).padStart(2, "0")} · ${spreadLabels[nextPosition]}`}
                </button>
                {nextPosition >= 0 && <button onClick={revealAll} className="oracle-text-button">{isUk ? "Розкрити всі" : "Reveal all"} ↗</button>}
              </div>
            </m.div>
          )}
''' +s[b:]
replace('        {/* ── THE ORACLE DECK ENGINE', '''        {isMobile && state === "drawing" && (
          <div className="oracle-hand" role="group" aria-label={isUk ? "Колода — гортайте, щоб обрати карту" : "The deck — swipe to choose a card"}>
            <p>{isUk ? "Гортайте колоду · торкніться, щоб обрати" : "Slide the deck · touch to choose"}</p>
            <div className="oracle-hand-track">
              {oracleData.map((card, i) => {
                const chosen = selectedCards.indexOf(i);
                return <button key={card.name} type="button" className="oracle-hand-card" aria-pressed={chosen >= 0}
                  aria-label={`${isUk ? "Карта" : "Face-down card"} ${i + 1}${chosen >= 0 ? (isUk ? ", обрана. Торкніться, щоб прибрати" : ", chosen. Activate to remove") : ""}`}
                  onClick={() => { audio.playSelect(); handleCardClick(i); }}>
                  <span className="oracle-hand-art" aria-hidden><NightCardBack /></span>
                  <span>{chosen >= 0 ? `✓ ${String(chosen + 1).padStart(2, "0")}` : String(i + 1).padStart(2, "0")}</span>
                </button>;
              })}
            </div>
          </div>
        )}
        {/* ── THE ORACLE DECK ENGINE''')
replace('                reversed={reversedFlags[i] ?? false}\n                onClick={() => handleCardClick(i)}', '                reversed={reversedFlags[i] ?? false}\n                isRevealed={revealedCards.includes(i)}\n                uk={isUk}\n                onClick={() => state === "drawing" ? handleCardClick(i) : turnCard(i)}')
replace('                  ref={sheetRef}\n                  onScroll', '                  ref={sheetRef}\n                  role="region"\n                  aria-label={isUk ? "Ваше читання" : "Your reading"}\n                  tabIndex={0}\n                  onScroll')
replace('                  {locale === "uk"\n                    ? "Карти живі — нахиліть · перетягніть · клік = лупа"\n                    : "The plates are alive — tilt · drag · click to magnify"}', '                  {locale === "uk"\n                    ? "Оберіть карту на столі або в покажчику, щоб роздивитися її."\n                    : "Choose a card on the table or in the index to look closer."}')
replace('<article key={id} className="result-artifact-card">','<button type="button" key={id} className="result-artifact-card" onClick={() => setInspecting(idx)} aria-label={`${spreadLabels[idx]}. ${(isUk && ukCard(card.name)?.name) || card.name}${reversedFlags[id] ? (isUk ? ", перевернута" : ", reversed") : ""}. ${isUk ? "Роздивитися карту" : "Inspect card"}`}>')
replace('                      </article>','                      </button>')
# Child card semantics and layout.
replace('  reversed = false,\n  onInspect,','  reversed = false,\n  isRevealed = false,\n  uk = false,\n  onInspect,')
replace('rig: { ux: number; uy: number; scale: number; cx: number; cy: number; oy: number }','rig: { ux: number; uy: number; scale: number; viewportWidth: number; cx: number; cy: number; oy: number }')
replace('  reversed?: boolean,\n  onClick:', '  reversed?: boolean,\n  isRevealed?: boolean,\n  uk?: boolean,\n  onClick:')
replace('    const arcRadius = isMobile ? 800 : isTablet ? 1000 : 1300; \n    const span = Math.PI * (isMobile ? 0.35 : isTablet ? 0.38 : 0.42); ', '    const span = Math.PI * (isMobile ? 0.35 : isTablet ? 0.38 : 0.42);\n    const arcRadius = Math.min(isTablet ? 1000 : 1300, Math.max(120, rig.viewportWidth * 0.44 - cardWidth / 2) / Math.sin(span / 2));')
replace('  }, [index, total, isMobile, isTablet]);','  }, [index, total, isMobile, isTablet, rig.viewportWidth, cardWidth]);')
replace('if (machineState === "spread" || machineState === "result")', 'if (machineState === "spread" || machineState === "revealing" || machineState === "result")')
replace('      if (machineState === "result") {\n        targetRotateY = 180;', '      if (isRevealed || machineState === "result") {\n        targetRotateY = 180;')
replace('  // ── MERGE DOCK PHYSICS WITH LAYOUT TARGETS ──','  if (isMobile && machineState === "drawing" && !isSelected) targetOpacity = 0;\n\n  // ── MERGE DOCK PHYSICS WITH LAYOUT TARGETS ──')
replace('    springScale.set(targetScale);', '    if (isReducedMotion) {\n      springX.jump(targetX); springY.jump(targetY); springZ.jump(targetZ); springRotZ.jump(targetRotateZ);\n      springScale.jump(targetScale);\n    } else springScale.set(targetScale);')
replace('staticX, staticY, staticZ, staticRotZ]);','staticX, staticY, staticZ, staticRotZ, isReducedMotion]);')
replace('    if (targetRotateY > 0 && selectionIndex > 0 && !isReducedMotion) {', '    if (isReducedMotion) { motionRotateY.jump(targetRotateY); return; }\n    if (machineState === "result" && targetRotateY > 0 && selectionIndex > 0) {')
replace('selectionIndex, isReducedMotion]);','selectionIndex, isReducedMotion, machineState]);')
replace('    if (machineState === "drawing" && !isSelected) {\n      hoveredIndexMV.set(index);','    if (machineState === "drawing" && !isSelected && !isReducedMotion) {\n      hoveredIndexMV.set(index);')
replace('index, isHoveredMV]);', 'index, isHoveredMV, isReducedMotion]);')
replace('    isHoveredMV.set(1);', '    if (!isReducedMotion) isHoveredMV.set(1);')
replace('      onPointerMove={handlePointerMove}\n      onPointerLeave={handlePointerLeave}', '      onPointerMove={handlePointerMove}\n      onPointerLeave={handlePointerLeave}\n      onFocus={handlePointerEnter}\n      onBlur={handlePointerLeave}')
a=s.index('      tabIndex={machineState === "drawing"');b=s.index('      drag={isLiftable}',a)
s=s[:a]+'''      tabIndex={(machineState === "drawing" && !isMobile) || (isSelected && (machineState === "spread" || machineState === "revealing" || machineState === "result")) ? 0 : -1}
      aria-hidden={targetOpacity === 0 || machineState === "focusing" || machineState === "preparing" ? true : undefined}
      aria-pressed={machineState === "drawing" ? isSelected : undefined}
      aria-label={isRevealed || isLiftable
        ? `${positionLabel}. ${(uk && ukCard(card.name)?.name) || card.name}${reversed ? (uk ? ", перевернута" : ", reversed") : ""}${isLiftable ? (uk ? ". Роздивитися карту" : ". Inspect card") : ""}`
        : `${uk ? "Карта" : "Face-down card"} ${index + 1}${isSelected ? ` · ${positionLabel}. ${uk ? "Розкрити" : "Turn card"}` : ""}`}
''' +s[b:]
replace('      drag={isLiftable}', '      drag={isLiftable && !isReducedMotion && !isMobile}')
replace('        width: cardWidth,','        pointerEvents: targetOpacity === 0 ? "none" : "auto",\n        width: cardWidth,')
replace('          className="absolute inset-0 rounded-[14px] overflow-hidden will-change-transform"','          aria-hidden="true"\n          className="absolute inset-0 rounded-[14px] overflow-hidden will-change-transform"')
replace('{(isSelected || machineState === "result") && (','{isSelected && (')
replace('                 quality={100}','                 quality={85}')
replace('(machineState === "spread" || machineState === "result") && (() => {','(machineState === "spread" || machineState === "revealing" || machineState === "result") && (() => {')
replace('${machineState === "result" ? " rotateY(180deg)" : ""}', '${isRevealed || machineState === "result" ? " rotateY(180deg)" : ""}')
replace('        <style>{`','''        <style>{`
          .oracle-edition { color: #d7bd85; font-size: 10px; letter-spacing: .23em; text-transform: uppercase; margin-bottom: 16px; }
          .oracle-method { color: #abb0cc; font-size: 12px; margin-top: 20px; line-height: 1.6; }
          .oracle-focus { max-height: calc(100% - 170px); top: 140px; overflow-y: auto; overscroll-behavior: contain; padding-bottom: 28px; }
          .oracle-turn-panel { width: min(640px, calc(100% - 40px)); bottom: max(8%, 36px); }
          .oracle-turn-panel h2 { color: #e8e9ef; font-family: var(--font-heading), serif; font-weight: 400; font-size: clamp(30px, 4vw, 48px); line-height: 1.1; }
          .oracle-turn-detail { color: #b9bfd6; font-size: 13px; line-height: 1.7; margin: 16px auto 24px; max-width: 48ch; }
          .oracle-turn-actions { display: flex; flex-wrap: wrap; gap: 12px 24px; justify-content: center; align-items: center; }
          .oracle-text-button { min-height: 44px; color: #d7bd85; font-size: 12px; text-decoration: underline; text-underline-offset: 5px; }
          .oracle-hand { position: absolute; z-index: 30; left: 0; right: 0; top: 57%; }
          .oracle-hand > p { color: #b9bfd6; font-size: 11px; text-align: center; margin-bottom: 14px; }
          .oracle-hand-track { display: flex; gap: 12px; overflow-x: auto; padding: 10px 24px 20px; scroll-snap-type: x proximity; scrollbar-width: thin; scrollbar-color: #bda773 transparent; }
          .oracle-hand-card { position: relative; flex: 0 0 82px; color: #c4c8d9; text-align: center; scroll-snap-align: center; transition: transform 180ms ease-out; }
          .oracle-hand-art { position: relative; display: block; overflow: hidden; height: 134px; border: 1px solid #6a6380; border-radius: 5px; background: #111838; }
          .oracle-hand-card > span:last-child { display: block; padding: 8px 0; font-size: 11px; letter-spacing: .14em; }
          .oracle-hand-card[aria-pressed="true"] { transform: translateY(-8px); color: #e0bd77; }
          .oracle-hand-card[aria-pressed="true"] .oracle-hand-art { opacity: .48; border-color: #e0bd77; }
          .oracle-hand-card:focus-visible, .oracle-text-button:focus-visible, .result-artifact-card:focus-visible { outline: 2px solid #e0bd77; outline-offset: 3px; }
          button.result-artifact-card { text-align: left; cursor: pointer; transition: border-color 180ms ease-out; }
          button.result-artifact-card:hover { border-color: #bda773; }
          @media (max-width: 640px) {
            .oracle-focus { top: 132px; max-height: calc(100% - 144px); padding-inline: 16px; }
            .oracle-focus > h2 { margin-bottom: 12px; }
            .oracle-focus .oracle-method { margin-top: 12px; max-width: 30ch; }
            .oracle-turn-panel { bottom: max(7%, 24px); }
          }
          @media (max-height: 620px) and (min-width: 641px) { .oracle-focus { top: 112px; max-height: calc(100% - 112px); } }
          @media (prefers-reduced-motion: reduce) { .oracle-hand-card { transition: none; } }
''')
p.write_text(s)
