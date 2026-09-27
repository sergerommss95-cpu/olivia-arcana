from pathlib import Path
base=Path('work/olivia-arcana/website/src')
p=base/'components/oracle/FramerTarotOracle.tsx';s=p.read_text()
s=s.replace('const poolSize = Math.max(basePool, spread.count + 2);','const poolSize = Math.max(basePool, spread.count + 2, ...selectedCards.map((id) => id + 1));')
s=s.replace('if (indices.length === want && new Set(indices).size === want &&','if (values.length === want && indices.length === want && new Set(indices).size === want &&')
s=s.replace('quality={85}','quality={75}')
s=s.replace('  const toggleMute = useCallback(() => {\n    const muted', '  const toggleMute = useCallback(() => {\n    audio.init();\n    const muted')
s=s.replace('  // Auto-init audio when engine mounts since the user already clicked "Awaken the Deck" in the shell\n  useEffect(() => {\n    audio.init();\n  }, []);','  // The AudioContext is only created by an explicit user interaction.')
s=s.replace('      this.ctx = new AudioCtx();','      if (!AudioCtx) return;\n      this.ctx = new AudioCtx();')
s=s.replace('    if (this.ctx.state === \'suspended\') this.ctx.resume();', '    if (this.ctx.state === \'suspended\') void this.ctx.resume().catch(() => {});')
s=s.replace('  const backFaceOpacity = useTransform(motionRotateY, (r) => (!isMobile || Number(r) <= 90 ? 1 : 0));','  const backFaceOpacity = useTransform(motionRotateY, (r) => (Number(r) <= 90 ? 1 : 0));')
s=s.replace('  const frontFaceOpacity = useTransform(motionRotateY, (r) => (!isMobile || Number(r) > 90 ? 1 : 0));','  const frontFaceOpacity = useTransform(motionRotateY, (r) => (Number(r) > 90 ? 1 : 0));')
# Anonymous backs should not retain an inspect role while invisible.
s=s.replace('aria-hidden={targetOpacity === 0 || machineState === "focusing" || machineState === "preparing" ? true : undefined}', 'aria-hidden={targetOpacity === 0 || machineState === "focusing" || machineState === "preparing" || (isMobile && machineState === "drawing") ? true : undefined}')
s=s.replace('  const isVisible = machineState === "focusing"', '  const reduced = useReducedMotion();\n  const isVisible = machineState === "focusing"')
s=s.replace('<animate attributeName="stroke-dashoffset" from="100" to="0" dur="80s" repeatCount="indefinite" />','{!reduced && <animate attributeName="stroke-dashoffset" from="100" to="0" dur="80s" repeatCount="indefinite" />}')
p.write_text(s)
# Keep the relation between numbered chapter and reading visible; make motion optional.
p=base/'components/oracle/ReadingScroll.tsx';s=p.read_text().replace('import { motion }','import { motion, useReducedMotion }')
s=s.replace('  const uk = locale === "uk";','  const uk = locale === "uk";\n  const reduced = useReducedMotion();')
s=s.replace('className="rs-entry glass-thin"','className="rs-entry"')
s=s.replace('className="rs-synth glass"','className="rs-synth"')
s=s.replace('initial={{ opacity: 0, y: 16 }}','initial={reduced ? false : { opacity: 0, y: 16 }}').replace('initial={{ opacity: 0, y: 18 }}','initial={reduced ? false : { opacity: 0, y: 18 }}')
s=s.replace('          .rs {','          .rs-entry { border-bottom: 1px solid rgba(183, 188, 233, .22); border-radius: 0 !important; }\n          .rs-synth { border-top: 1px solid #a08d61; border-radius: 0 !important; background: rgba(183,188,233,.035); }\n          .rs {')
p.write_text(s)
# Mobile spread choice retains the explanation, instead of hiding its purpose.
p=base/'components/oracle/SpreadChooser.tsx';s=p.read_text()
s=s.replace('    if (!dir) return;\n    e.preventDefault();\n    const j = (i + dir + SPREADS.length) % SPREADS.length;', '    if (!dir && e.key !== "Home" && e.key !== "End") return;\n    e.preventDefault();\n    const j = e.key === "Home" ? 0 : e.key === "End" ? SPREADS.length - 1 : (i + dir + SPREADS.length) % SPREADS.length;')
s=s.replace('font-size: 0.55rem;', 'font-size: 0.65rem;').replace('font-size: 0.5rem;', 'font-size: 0.6rem;')
s=s.replace('color: var(--ink-faint, rgba(183, 188, 233, 0.66));','color: #b9bfd6;')
s=s.replace('          .sc-line {\n            display: none;\n          }','          .sc-line {\n            font-size: 0.73rem;\n            line-height: 1.4;\n          }')
p.write_text(s)
# Focus containment and return are separate from per-card keyboard navigation,
# so moving through the loupe never bounces focus back to the reading.
p=base/'components/oracle/CardInspector.tsx';s=p.read_text().replace('import { motion, AnimatePresence }','import { motion, AnimatePresence, useReducedMotion }')
s=s.replace('  const open = index !== null', '  const reduced = useReducedMotion();\n  const dialogRef = useRef<HTMLDivElement>(null);\n  const closeRef = useRef<HTMLButtonElement>(null);\n  const open = index !== null')
marker='  // keyboard: escape closes, arrows walk the spread, +/- zoom'
s=s.replace(marker, '''  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex='0']") ?? []);
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", containFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", containFocus);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

''' +marker)
s=s.replace('      if (e.key === "Escape")', '      if (["Escape", "ArrowLeft", "ArrowRight", "+", "=", "-", "_", "0"].includes(e.key)) e.preventDefault();\n      if (e.key === "Escape")')
s=s.replace('          className="ci-scrim"','          ref={dialogRef}\n          className="ci-scrim"')
s=s.replace('aria-label={`${entry.card.name} — inspect the plate`}', 'aria-label={`${(uk && ukCard(entry.card.name)?.name) || entry.card.name}${entry.reversed ? (uk ? ", перевернута" : ", reversed") : ""} — ${uk ? "роздивитися карту" : "inspect the plate"}`}')
s=s.replace('<button type="button" className="ci-close"','<button ref={closeRef} type="button" className="ci-close"')
s=s.replace('aria-label="Close the plate">Close ✕','aria-label={uk ? "Закрити карту" : "Close the plate"}>{uk ? "Закрити ✕" : "Close ✕"}')
s=s.replace('aria-label="Zoom out"','aria-label={uk ? "Зменшити" : "Zoom out"}').replace('aria-label="Zoom in"','aria-label={uk ? "Збільшити" : "Zoom in"}')
s=s.replace('initial={{ scale: 0.92, opacity: 0, y: 14 }}', 'initial={reduced ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 14 }}')
s=s.replace('exit={{ scale: 0.95, opacity: 0 }}', 'exit={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}')
s=s.replace('animate={{ opacity: [0, 0.9, 0] }}','animate={{ opacity: reduced ? 0 : [0, 0.9, 0] }}')
p.write_text(s)
