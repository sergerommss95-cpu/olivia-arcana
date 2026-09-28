/** Server wrapper for the one-sentence practice. */
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { cardName } from "@/components/academy/PairPage";
import Sentence from "./Sentence";

const LABELS = {
  en: { lead: "Three cards from the deck. Say in one sentence what they are about together, then try the cover test.", yours: "Your sentence", placeholder: "In one sentence, what is this spread about?", words: "{n} of about {limit} words", names: "Names: {list}", noNames: "It names none of the cards yet: which one carries the sentence?", consider: "Softer words to consider:", cover: "Cover test: hide the cards", uncover: "Show the cards again", coverNote: "Read your sentence without the cards. Does it still make sense on its own, and does it end on something within your reach?", deal: "Deal three other cards" },
  uk: { lead: "Три карти з колоди. Скажіть одним реченням, про що вони разом, а потім спробуйте перевірку закриттям.", yours: "Ваше речення", placeholder: "Одним реченням: про що цей розклад?", words: "Слів: {n} з приблизно {limit}", names: "Названо: {list}", noNames: "Речення ще не називає жодної карти: яка з них його тримає?", consider: "М’якші слова, які варто розглянути:", cover: "Перевірка: сховати карти", uncover: "Знову показати карти", coverNote: "Прочитайте речення без карт. Чи має воно сенс саме по собі і чи закінчується тим, що у ваших силах?", deal: "Розкласти три інші карти" },
};

export default function SentenceTool({ locale }: { locale: "en" | "uk" }) {
  const cards = ALL_CARDS.map((card, id) => ({ name: cardName(id, locale), thumb: getCardThumbPath(card) }));
  return <Sentence locale={locale} cards={cards} labels={LABELS[locale]} />;
}
