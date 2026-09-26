import type { BirthDataFormCopy } from "@/components/birth/BirthDataForm";

export const UK_BIRTH_FORM: BirthDataFormCopy = {
  fig: "Іл. 1 — дані народження", nameLabel: "Ваше ім’я (необов’язково)", namePlaceholder: "Ім’я",
  dateLabel: "Дата народження", dayPh: "ДД", monthPh: "ММ", yearPh: "РРРР", timeLabel: "Час народження",
  timeUnknownOff: "Я не знаю часу народження", timeUnknownOn: "✓ Використовуємо полудень — асцендент не визначено",
  noonNote: "Умовно 12:00", cityLabel: "Місто народження", cityPlaceholder: "Наприклад, Kyiv, London, Tokyo",
  cityNone: "Місто не знайдено — спробуйте найближче велике місто",
  tzLine: (city, off, summer) => `${city} · ${off}${summer ? " (літній час)" : ""}`,
  submit: "Створити мою натальну карту", submitAsleep: "Заповніть дату, час і місце народження",
};

export const UK_PLANETS: Record<string, string> = {
  Sun: "Сонце", Moon: "Місяць", Mercury: "Меркурій", Venus: "Венера", Mars: "Марс", Jupiter: "Юпітер",
  Saturn: "Сатурн", Uranus: "Уран", Neptune: "Нептун", Pluto: "Плутон", Ascendant: "Асцендент",
};
export const UK_SIGNS: Record<string, string> = {
  Aries: "Овен", Taurus: "Телець", Gemini: "Близнюки", Cancer: "Рак", Leo: "Лев", Virgo: "Діва",
  Libra: "Терези", Scorpio: "Скорпіон", Sagittarius: "Стрілець", Capricorn: "Козоріг", Aquarius: "Водолій", Pisces: "Риби",
};
export const UK_ASPECTS: Record<string, string> = {
  conjunction: "З’єднання", sextile: "Секстиль", square: "Квадрат", trine: "Тригон", opposition: "Опозиція", quincunx: "Квінконс",
};
