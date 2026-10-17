/**
 * One card of the deck at figure size, the way every card on /daily is shown: responsive art, a resting
 * elevation drawn by a pre-rendered shadow layer (only its opacity ever changes), an ivory lit edge, a name
 * tag that appears on fine-pointer hover or keyboard focus, and an optional two-level museum caption so the
 * card is named on touch too. Rotation is a custom property, so entry and scroll motion can move the frame
 * or a wrapper without fighting the card's own angle.
 */

import { Fragment, useId, type CSSProperties, type ReactNode, type Ref } from "react";
import { cardSrc, cardSrcSet } from "@/lib/daily/card-src";
import d from "./daily.module.css";

export type Elevation = "lie" | "lift" | "held";

/** `role` may be several lines, each set on its own line under the title. */
export type CardCaption = { title: ReactNode; role?: ReactNode | ReactNode[]; note?: ReactNode };

/**
 * A placement line may wrap only between its parts ("Venus ℞ · Fourth house"), and only before a dot: the dot
 * is bound to the part after it, so no width leaves it dangling at a line's end. Each separator is its own
 * element, so a narrow layout (or a pair caption) can turn it into a line break instead.
 */
export function RoleLine({ text }: { text: ReactNode }) {
  if (typeof text !== "string") return <>{text}</>;
  return <>{text.split(/ ·[ \u00a0]/).map((part, i) => <Fragment key={i}>{i > 0 && <span className={d.sep}>{" ·\u00a0"}</span>}<span className={d.nowrap}>{part}</span></Fragment>)}</>;
}

export default function CardFigure({
  name, href, image, sizes, rotate = 0, elevation = "lift", priority = false, reversed = false,
  caption, as = "figure", className, style, faceRef, imgRef, inert = false,
}: {
  /** The card's own name: the link's accessible name and the hover tag. */
  name: string;
  href?: string;
  image: string;
  sizes: string;
  rotate?: number;
  elevation?: Elevation;
  /** true: the page's largest image, fetched eagerly at high priority; "low": lazy and fetched after everything else. */
  priority?: boolean | "low";
  reversed?: boolean;
  caption?: CardCaption;
  /** "div" when a parent figure carries the captions (the hero pair). */
  as?: "figure" | "div";
  className?: string;
  style?: CSSProperties;
  /** The art's immediate wrapper, for the card-material light. */
  faceRef?: Ref<HTMLSpanElement>;
  imgRef?: Ref<HTMLImageElement>;
  /** A decorative duplicate of a link that follows (the door): out of the tab order and hidden from assistive tech, its hover tag kept. */
  inert?: boolean;
}) {
  const capId = useId();
  // only the hero's card A can be wide enough to want the 896 master
  const srcSet = cardSrcSet(image, { max: priority === true ? 896 : 640 });
  const art = (
    <span className={d.face} ref={faceRef}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: responsive srcset from public/cards */}
      <img ref={imgRef} src={cardSrc(image, 640)} srcSet={srcSet || undefined} sizes={srcSet ? sizes : undefined} alt="" width={448} height={768}
        loading={priority === true ? "eager" : "lazy"} fetchPriority={priority === true ? "high" : priority || undefined} decoding="async" className={reversed ? d.reversedArt : undefined} />
    </span>
  );
  const Root = as;
  return (
    <Root className={`${d.card} ${className ?? ""}`} style={{ ...style, "--r": `${rotate}deg` } as CSSProperties} data-elev={elevation}
      aria-labelledby={caption && as === "figure" ? capId : undefined}>
      <div className={d.cardFrame}>
        {href ? <a href={href} className={d.cardBody} aria-label={name} tabIndex={inert ? -1 : undefined} aria-hidden={inert || undefined}>{art}</a> : <span className={d.cardBody}>{art}</span>}
        <span className={d.tag} aria-hidden>{name}</span>
      </div>
      {caption && as === "figure" && (
        <figcaption className={d.caption}>
          <span className={d.capTitle} id={capId}>{caption.title}</span>
          {(Array.isArray(caption.role) ? caption.role : [caption.role]).filter(Boolean).map((role, i) => (
            <span key={i} className={d.capRole}><RoleLine text={role} /></span>
          ))}
          {caption.note && <span className={d.capNote}>{caption.note}</span>}
        </figcaption>
      )}
    </Root>
  );
}
