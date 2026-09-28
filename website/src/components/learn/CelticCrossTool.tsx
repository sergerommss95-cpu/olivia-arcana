/**
 * Server wrapper for the Celtic Cross practice: Olivia's ten positions (no
 * outcome card), plus each card's name, thumbnail, page slug, one-line essence
 * and rarer carved symbols, so the client can deal and survey without the
 * rest of the card pages.
 */
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { cardName } from "@/components/academy/PairPage";
import { COMMON_SYMBOL_KEYS } from "@/lib/learn/card-facts";
import CARD_SYMBOLS from "@/lib/learn/card-symbols.json";
import type { Locale } from "@/lib/learn/lessons";
import CelticCross, { type CrossCard, type CrossPosition } from "./CelticCross";

type Symbols = Record<string, { k: string; x: number; y: number; en: string; uk: string }[]>;

/** Olivia's relabelling, in Waite's order. `with` is the position to read beside it. */
const POSITIONS: Record<Locale, CrossPosition[]> = {
  en: [
    { name: "The situation", question: "What aspect of the situation deserves your attention?", waite: "The card that “covers” the enquirer.", pair: "Read it with card 2: many teachers treat the two crossed cards as the heart of the reading.", with: 2 },
    { name: "What complicates it", question: "How does this card complicate the first: what tension or assumption deserves a closer look?", waite: "The card that “crosses” the enquirer.", pair: "Read it with card 1 as a single pair.", with: 1 },
    { name: "What you are aiming for", question: "What aim or ideal are you reaching for in this matter?", waite: "The card that “crowns”: the enquirer’s aim or ideal in the matter.", pair: "Read it with card 10: the gap between your aim and the thread is where the real work sits.", with: 10 },
    { name: "What lies at the root", question: "What lies beneath the situation and feeds it?", waite: "The card that lies “beneath”.", pair: "It lies under card 1 as its root: read the two together.", with: 1 },
    { name: "What is passing", question: "What is already loosening its hold on you here?", waite: "The card “behind”: what is passing.", pair: "Cards 5 and 6 face each other across the cross: what is loosening its hold, and what is drawing your attention.", with: 6 },
    { name: "What you are turning towards", question: "What is drawing your attention now?", waite: "The card “before”: what is approaching.", pair: "Cards 5 and 6 face each other across the cross: what is loosening its hold, and what is drawing your attention.", with: 5 },
    { name: "Your perspective", question: "How do you see this matter from where you stand?", waite: "The enquirer’s self.", pair: "Cards 7 and 8 set your own view beside what surrounds you.", with: 8 },
    { name: "Outer influences", question: "What in your surroundings is shaping this matter?", waite: "The enquirer’s “house”, or surroundings.", pair: "Cards 7 and 8 set your own view beside what surrounds you.", with: 7 },
    { name: "Hopes and fears", question: "Which part of this card do you hope for, and which part do you fear?", waite: "“Hopes or fears”, given a single place.", pair: "Card 9 stands alone: a hope and a fear are often the same wish seen from two sides.", with: null },
    { name: "The thread to carry forward", question: "What from this card can you take with you and work on?", waite: "The final result. Olivia keeps the place and changes its question.", pair: "Read it beside card 3: something to take with you and work on, not a result.", with: 3 },
  ],
  uk: [
    { name: "Ситуація", question: "Який аспект ситуації потребує вашої уваги?", waite: "Карта, що «покриває» людину, яка запитує.", pair: "Читайте її разом із другою: дві схрещені карти багато вчителів вважають серцем читання.", with: 2 },
    { name: "Що ускладнює", question: "Як ця карта ускладнює першу: яка напруга чи припущення потребує уважнішого погляду?", waite: "Карта, що «перетинає» людину, яка запитує.", pair: "Читайте її разом із першою як одну пару.", with: 1 },
    { name: "До чого ви прагнете", question: "До якої мети чи ідеалу ви тягнетеся в цій справі?", waite: "Карта, що «вінчає»: мета чи ідеал людини в цій справі.", pair: "Читайте її поруч із десятою: саме в розриві між метою і ниткою відбувається справжня робота.", with: 10 },
    { name: "Що лежить у корені", question: "Що лежить під ситуацією і живить її?", waite: "Карта, що лежить «під нею», тобто під людиною, яка запитує.", pair: "Вона лежить під першою як її корінь: читайте їх разом.", with: 1 },
    { name: "Що минає", question: "Що тут уже відпускає вас?", waite: "Карта «позаду»: те, що минає.", pair: "П’ята й шоста дивляться одна на одну через хрест: те, що відпускає вас, і те, що притягує вашу увагу.", with: 6 },
    { name: "До чого ви розвертаєтеся", question: "Що зараз притягує вашу увагу?", waite: "Карта «попереду»: те, що наближається.", pair: "П’ята й шоста дивляться одна на одну через хрест: те, що відпускає вас, і те, що притягує вашу увагу.", with: 5 },
    { name: "Ваш погляд", question: "Як ви бачите цю справу з того місця, де стоїте?", waite: "Сама людина, яка запитує.", pair: "Сьома й восьма ставлять ваш власний погляд поруч із тим, що вас оточує.", with: 8 },
    { name: "Зовнішні впливи", question: "Що у вашому оточенні впливає на цю справу?", waite: "«Дім» людини, тобто її оточення.", pair: "Сьома й восьма ставлять ваш власний погляд поруч із тим, що вас оточує.", with: 7 },
    { name: "Надії й страхи", question: "На яку частину цієї карти ви сподіваєтеся, а якої боїтеся?", waite: "«Надії чи страхи» в одній спільній позиції.", pair: "Дев’ята стоїть окремо: надія і страх часто — одне й те саме бажання, побачене з двох боків.", with: null },
    { name: "Нитка, яку варто нести далі", question: "Що з цієї карти ви можете взяти з собою і над чим попрацювати?", waite: "Остаточний результат. Olivia зберігає позицію, але змінює її запитання.", pair: "Читайте її поруч із третьою: це те, що ви берете з собою і над чим працюєте, а не результат.", with: 3 },
  ],
};

const LABELS = {
  en: {
    lead: "Ten cards dealt at random into Waite’s layout, with Olivia’s questions in place of his labels. The tenth place asks for a thread to carry, not a result. Look at the whole first, then read the positions, beginning with the two crossed cards.",
    positions: "The ten positions",
    slot: "{n}. {name}: {card}",
    written: "you have written here",
    whole: "Look at the whole",
    wholeLead: "Before reading any position, look at the ten cards as one picture: how many Major Arcana, which suit gathers, any image that repeats. Each line says how often that happens in a random draw.",
    worth: "Worth noticing",
    begin: "Begin with the crossed cards",
    back: "← Look at the whole",
    position: "Position {n}",
    fromPage: "From the card page",
    newTab: "opens in a new tab",
    yours: "Your reading of position {n}",
    placeholder: "What does this card show you in this position?",
    goTo: "Go to position {n} →",
    waite: "Waite, 1910",
    sentence: "The spread in one sentence",
    sentenceLead: "Read cards 3 and 10 together, then write one sentence for the whole layout and one small step you can try.",
    sentenceField: "Your sentence",
    sentencePlaceholder: "In one sentence, what is this layout about?",
    step: "One small step you can try",
    stepPlaceholder: "Something small, within your reach…",
    check: "Could this sentence have been written without the cross at the centre? If so, go back to cards 1 and 2 and begin again from there.",
    toCross: "Back to cards 1 and 2",
    again: "Deal again",
    againNote: "Dealing again clears your notes.",
    cardPage: "/cards/{slug}/",
  },
  uk: {
    lead: "Десять карт, випадково викладених у розклад Вейта, із запитаннями Olivia замість його підписів. Десята позиція просить нитку, яку варто нести далі, а не результат. Спершу погляньте на розклад цілком, а тоді читайте позиції, починаючи з двох схрещених карт.",
    positions: "Десять позицій",
    slot: "{n}. {name}: {card}",
    written: "тут є ваш запис",
    whole: "Погляд на ціле",
    wholeLead: "Перш ніж читати будь-яку позицію, погляньте на десять карт як на одну картину: скільки Старших Арканів, яка масть переважає, чи повторюється якесь зображення. Кожен рядок показує, як часто таке трапляється випадково.",
    worth: "Варто помітити",
    begin: "Почніть зі схрещених карт",
    back: "← Погляд на ціле",
    position: "Позиція {n}",
    fromPage: "Зі сторінки карти",
    newTab: "відкривається в новій вкладці",
    yours: "Ваше читання позиції {n}",
    placeholder: "Що ця карта показує вам у цій позиції?",
    goTo: "До позиції {n} →",
    waite: "Вейт, 1910",
    sentence: "Розклад одним реченням",
    sentenceLead: "Прочитайте разом третю й десяту карти, а тоді напишіть одне підсумкове речення про весь розклад і один невеликий крок, який можна спробувати.",
    sentenceField: "Ваше речення",
    sentencePlaceholder: "Одним реченням: про що цей розклад?",
    step: "Один невеликий крок, який можна спробувати",
    stepPlaceholder: "Щось невелике, що у ваших силах…",
    check: "Чи можна було б написати це речення без хреста в центрі? Якщо так, поверніться до першої й другої карт і почніть звідти знову.",
    toCross: "До першої й другої карт",
    again: "Розкласти ще раз",
    againNote: "Якщо розкласти карти ще раз, ваші нотатки зникнуть.",
    cardPage: "/uk/cards/{slug}/",
  },
};

/** Symbols that can echo: not too common to say anything, and carved on at least two cards. */
function echoKeys(symbols: Symbols) {
  const cardsWith = new Map<string, Set<string>>();
  for (const [id, list] of Object.entries(symbols)) {
    for (const s of list) if (!COMMON_SYMBOL_KEYS.has(s.k)) cardsWith.set(s.k, (cardsWith.get(s.k) ?? new Set()).add(id));
  }
  return new Set([...cardsWith].filter(([, ids]) => ids.size >= 2).map(([key]) => key));
}

export default function CelticCrossTool({ locale }: { locale: Locale }) {
  const symbols = CARD_SYMBOLS as unknown as Symbols;
  const echoing = echoKeys(symbols);
  const cards: CrossCard[] = ALL_CARDS.map((card, id) => {
    const leaf = leafById(id)!;
    return {
      name: cardName(id, locale),
      thumb: getCardThumbPath(card),
      slug: leaf.slug,
      essence: leaf[locale].essence,
      symbols: (symbols[id] || []).filter((s) => echoing.has(s.k)).map((s) => [s.k, s.x, s.y, s[locale]] as [string, number, number, string]),
    };
  });
  return <CelticCross locale={locale} cards={cards} positions={POSITIONS[locale]} labels={LABELS[locale]} />;
}
