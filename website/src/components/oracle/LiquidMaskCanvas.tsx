"use client"

import { useRef, useState, useEffect, type CSSProperties } from "react"
import OracleLoadingState from "./OracleLoadingState"
import OracleStaticFallback from "./OracleStaticFallback"

interface Props {
  className?: string
  style?: CSSProperties
  onReady?: () => void
}

export default function LiquidMaskCanvas({ className, style, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<import("./LiquidMaskEngine").LiquidMaskEngine | null>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [useStatic, setUseStatic] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUseStatic(true)
      return
    }

    const mobile = "ontouchstart" in window || window.innerWidth < 768
    setIsMobile(mobile)

    // ── Cursor velocity tracking ──
    let lastX = 0, lastY = 0, velocity = 0

    const update = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const localX = clientX - rect.left
      const localY = clientY - rect.top
      const nx = localX / rect.width
      const ny = localY / rect.height
      engineRef.current?.updatePointer(nx, ny)

      // Velocity for cursor scaling
      const dx = clientX - lastX
      const dy = clientY - lastY
      velocity = Math.min(Math.sqrt(dx * dx + dy * dy), 40) / 40
      lastX = clientX
      lastY = clientY

      // Multi-layer cursor positioning
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0)`
      }
      if (ringRef.current) {
        // Ring follows with slight lag (CSS transition handles this)
        ringRef.current.style.transform =
          `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 0.5})`
      }
      if (haloRef.current) {
        haloRef.current.style.transform =
          `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 1.2})`
      }
    }

    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) update(t.clientX, t.clientY)
    }

    // Enter/leave for mask presence animation
    const onEnter = () => {
      engineRef.current?.setPresent(true)
      if (hintRef.current) hintRef.current.style.opacity = "0"
    }
    const onLeave = () => {
      engineRef.current?.setPresent(false)
      if (hintRef.current) hintRef.current.style.opacity = "1"
    }

    el.addEventListener("mousemove", onMouse)
    el.addEventListener("mouseenter", onEnter)
    el.addEventListener("mouseleave", onLeave)
    el.addEventListener("touchstart", onTouch, { passive: true })
    el.addEventListener("touchmove", onTouch, { passive: true })
    el.addEventListener("touchstart", onEnter as EventListener, { passive: true })
    el.addEventListener("touchend", onLeave as EventListener, { passive: true })

    let aborted = false
    let localEngine: import("./LiquidMaskEngine").LiquidMaskEngine | null = null

    import("./LiquidMaskEngine")
      .then(({ LiquidMaskEngine }) => {
        if (aborted || !el) return
        try {
          const engine = new LiquidMaskEngine(el, {
            baseImage: "/liquid-mask/base.png",
            revealImage: "/liquid-mask/reveal.png",
            maskRadius: mobile ? 0.32 : 0.26,
            feather: 0.09,
            lerpFactor: 0.09,
            onReady: () => { if (!aborted) { setReady(true); onReady?.() } },
          })
          engine.start()
          localEngine = engine
          engineRef.current = engine
        } catch {
          if (!aborted) setUseStatic(true)
        }
      })
      .catch(() => { if (!aborted) setUseStatic(true) })

    return () => {
      aborted = true
      el.removeEventListener("mousemove", onMouse)
      el.removeEventListener("mouseenter", onEnter)
      el.removeEventListener("mouseleave", onLeave)
      el.removeEventListener("touchstart", onTouch)
      el.removeEventListener("touchmove", onTouch)
      el.removeEventListener("touchstart", onEnter as EventListener)
      el.removeEventListener("touchend", onLeave as EventListener)
      localEngine?.dispose()
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [onReady])

  if (useStatic) return <OracleStaticFallback />

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "none",
        borderRadius: "var(--radius-card, 1.25rem)",
        border: "1px solid var(--c-border, rgba(255,255,255,0.08))",
        background: "var(--c-void, #06041a)",
        ...style,
      }}
    >
      {!ready && <OracleLoadingState />}

      {/* ── Multi-layer custom cursor (desktop only) ── */}
      {!isMobile && (
        <>
          {/* Outer halo — large, soft, velocity-reactive */}
          <div
            ref={haloRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(160,122,224,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 9,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* Middle ring — thin, follows with lag */}
          <div
            ref={ringRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              pointerEvents: "none",
              zIndex: 10,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
              transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* Inner core — snappy, bright */}
          <div
            ref={cursorRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(255, 240, 200, 0.95)",
              boxShadow:
                "0 0 12px 3px rgba(255, 215, 130, 0.8), " +
                "0 0 30px 6px rgba(180, 160, 220, 0.25)",
              pointerEvents: "none",
              zIndex: 11,
              mixBlendMode: "screen" as const,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
            }}
          />
        </>
      )}

      {/* Hint text — fades on cursor enter */}
      {ready && (
        <div
          ref={hintRef}
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "var(--font-accent, 'Cormorant Garamond', serif)",
            fontSize: "0.65rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase" as const,
            color: "rgba(232, 218, 170, 0.45)",
            pointerEvents: "none",
            zIndex: 12,
            textShadow: "0 0 16px rgba(140, 150, 220, 0.3)",
            whiteSpace: "nowrap",
            transition: "opacity 0.5s ease",
          }}
        >
          {isMobile ? "Touch to reveal" : "Explore with your cursor"}
        </div>
      )}
    </div>
  )
}
