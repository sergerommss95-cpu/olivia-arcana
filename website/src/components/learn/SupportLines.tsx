/** Where to reach people now: the same lines as the reading experience's support note. */

import { Fragment } from "react";
import type { Locale } from "@/lib/learn/lessons";
import styles from "./support-lines.module.css";

export interface SupportLabels { title: string; body: string; lines: { name: string; numbers: string[]; detail: string }[]; elsewhere: string }

export const SUPPORT: Record<Locale, SupportLabels> = {
  en: {
      title: "You don’t have to hold this alone",
      body: "If you are thinking about harming yourself, or you are not safe, please reach out to someone now. The cards can wait.",
      lines: [
        { name: "Emergency", numbers: ["112", "911", "999"], detail: "112 in Europe and Ukraine, 911 in the US and Canada, 999 in the UK" },
        { name: "Lifeline Ukraine", numbers: ["7333"], detail: "free, day and night" },
        { name: "Samaritans, UK and Ireland", numbers: ["116 123"], detail: "free, day and night" },
        { name: "US and Canada", numbers: ["988"], detail: "call or text" },
      ],
      elsewhere: "Other countries:",
    },
  uk: {
      title: "Вам не треба нести це наодинці",
      body: "Якщо ви думаєте про те, щоб заподіяти собі шкоду, або вам загрожує небезпека, будь ласка, зверніться до когось просто зараз. Карти можуть зачекати.",
      lines: [
        { name: "Екстрена допомога", numbers: ["112"], detail: "в Україні та Європі" },
        { name: "Lifeline Ukraine", numbers: ["7333"], detail: "цілодобово й безкоштовно" },
      ],
      elsewhere: "Інші країни:",
    },
};

export default function SupportLines({ labels }: { labels: SupportLabels }) {
  return (
    <div className={styles.support} role="note">
      <p className={styles.supportTitle}>{labels.title}</p>
      <p>{labels.body}</p>
      <ul>
        {labels.lines.map((line) => (
          <li key={line.name}>
            {line.name}:{" "}
            {line.numbers.map((n, i) => (
              <Fragment key={n}>{i > 0 && " · "}<a href={`tel:${n.replace(/\s/g, "")}`}>{n}</a></Fragment>
            ))}{" "}
            ({line.detail})
          </li>
        ))}
      </ul>
      <p>{labels.elsewhere} <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></p>
    </div>
  );
}
