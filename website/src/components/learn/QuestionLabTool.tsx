/** Server wrapper: gives the Question lab each card's name, thumbnail and one-line essence. */
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { cardName } from "@/components/academy/PairPage";
import QuestionLab from "./QuestionLab";

const LABELS = {
  en: { yours: "Your question", placeholder: "Type a question you have been carrying…", open: "This question is open: any of the 78 cards can meet it with something to look at.", closed: "A closed question", mind: "Another person’s mind", care: "Worth care", tryInstead: "Try instead: ", deal: "Deal three cards to test it", again: "Deal three more", ask: "Could this card answer your question usefully? If not, the question may be what needs to change.", examples: "Or start from an example", empty: "" },
  uk: { yours: "Ваше запитання", placeholder: "Напишіть запитання, яке ви давно носите в собі…", open: "Це відкрите запитання: кожна з 78 карт може запропонувати, на що подивитися.", closed: "Закрите запитання", mind: "Думки іншої людини", care: "Потребує обережності", tryInstead: "Спробуйте так: ", deal: "Розкласти три карти для перевірки", again: "Розкласти ще три", ask: "Чи могла б ця карта корисно відповісти на ваше запитання? Якщо ні, можливо, змінити варто саме запитання.", examples: "Або почніть із прикладу", empty: "" },
};

export default function QuestionLabTool({ locale }: { locale: "en" | "uk" }) {
  const cards = ALL_CARDS.map((card, id) => ({ name: cardName(id, locale), thumb: getCardThumbPath(card), essence: leafById(id)![locale].essence }));
  return <QuestionLab locale={locale} cards={cards} labels={LABELS[locale]} />;
}
