from pathlib import Path
b=Path('work/olivia-arcana/website/src')
p=b/'components/almanac/SpreadTheater.tsx';s=p.read_text();s=s.replace('useRef<HTMLDivElement>(null)','useRef<HTMLAnchorElement>(null)');s=s.replace('    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;', '    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");\n    let reduce = motionQuery.matches;')
s=s.replace('    let raf = 0;', '    let raf = 0;\n    let visible = false;\n    let diveTimer = 0;\n    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };')
a=s.index('    const wakeIO = new IntersectionObserver(');z=s.index('\n    const onMove',a)
s=s[:a]+'''    const wakeIO = new IntersectionObserver((entries) => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && wakeAt === 0) wakeAt = performance.now();
      if (visible) start();
      else { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 });
    wakeIO.observe(stage);
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else start();
    };
    const onMotionChange = () => { reduce = motionQuery.matches; if (reduce) wakeAt = -1; start(); };
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);
''' +s[z:]
s=s.replace('const delay = reduce ? 40 : 430;', 'const delay = reduce ? 0 : 220;')
s=s.replace('      window.setTimeout(() => {\n        window.dispatchEvent', '      diveTimer = window.setTimeout(() => {\n        window.dispatchEvent')
s=s.replace('    const onClick = () => dive();', '''    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      dive();
    };''')
s=s.replace('      if (e.key === "Enter" || e.key === " ")', '      if (e.key === " ")')
s=s.replace('    const loop = (now: number) => {\n      raf = requestAnimationFrame(loop);', '    const loop = (now: number) => {\n      raf = 0;\n      if (!visible || document.hidden) return;\n      if (!reduce) raf = requestAnimationFrame(loop);')
s=s.replace('const g = reduce || diving ? 0.24 : LERP;', 'const g = reduce ? 1 : diving ? 0.24 : LERP;')
s=s.replace('    raf = requestAnimationFrame(loop);\n    return () => {', '    return () => {')
s=s.replace('      wakeIO.disconnect();', '      wakeIO.disconnect();\n      window.clearTimeout(diveTimer);\n      document.removeEventListener("visibilitychange", onVisibility);\n      motionQuery.removeEventListener("change", onMotionChange);')
s=s.replace('    <div\n      ref={stageRef}', '    <a\n      href={href}\n      ref={stageRef}').replace('      role="link"\n      tabIndex={0}\n','');i=s.rfind('    </div>');s=s[:i]+s[i:].replace('    </div>','    </a>',1)
s=s.replace('        .st-stage {', '        .st-stage {\n          display: block; text-decoration: none; color: inherit;')
p.write_text(s)
# Homepage scroll progress does not need a permanent render loop; the hero and deck own the animation.
p=b/'app/page.tsx';s=p.read_text();a=s.index('  // One rig for the page');z=s.index('  // ── Ink pressure',a)
s=s[:a]+'''  // Schedule at most one update for each scroll/resize burst. No idle layout polling.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const driftEls = Array.from(root.querySelectorAll<HTMLElement>("[data-drift]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const positions = reduced.matches ? [] : driftEls.map(el => {
        const rect = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      });
      root.style.setProperty("--read-p", progress.toFixed(3));
      positions.forEach((value, index) => driftEls[index].style.setProperty("--dp", value.toFixed(3)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

''' +s[z:]
p.write_text(s)
p=b/'components/sky/SkyAtlas.tsx';s=p.read_text();s=s.replace('  bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:90;', '  bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:90;')
s=s.replace('  color:${PERI};background:none;border:none;\n  border-bottom:1px solid transparent;padding:8px 2px;cursor:pointer;', '  color:${MOON};background:rgba(10,13,42,.96);border:1px solid rgba(224,183,104,.35);\n  border-radius:2px;min-height:44px;padding:10px 12px;cursor:pointer;')
s=s.replace('  border-bottom-color:rgba(232,233,255,.16);outline:none}', '  border-color:rgba(232,233,255,.5)}\n.oa-atlas-btn:focus-visible{outline:2px solid ${GOLD};outline-offset:4px}') if '${GOLD}' in s else s
# GOLD token might be named GILT, use literal.
s=s.replace('  border-bottom-color:rgba(232,233,255,.16);outline:none}', '  border-color:rgba(232,233,255,.5)}\n.oa-atlas-btn:focus-visible{outline:2px solid #e0b768;outline-offset:4px}')
s=s.replace('  .oa-atlas-btn{right:14px;bottom:calc(96px + env(safe-area-inset-bottom,0px));', '  .oa-atlas-btn .oa-atlas-key{display:none}\n  .oa-atlas-btn{right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));')
p.write_text(s)
