/**
 * translations.ts — All UI strings in 9 languages
 *
 * Languages: en, uk, ru, de, fr, ar, es, zh, pt
 * Covers: nav, hero, daily, portrait, academy, common UI
 */

export type Locale = "en" | "uk" | "ru" | "de" | "fr" | "ar" | "es" | "zh" | "pt";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  ar: "العربية",
  es: "Español",
  zh: "中文",
  pt: "Português",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧", uk: "🇺🇦", ru: "🇷🇺", de: "🇩🇪",
  fr: "🇫🇷", ar: "🇸🇦", es: "🇪🇸", zh: "🇨🇳", pt: "🇧🇷",
};

export interface Translations {
  // Nav
  nav_academy: string;
  nav_portrait: string;
  nav_cosmos: string;
  nav_daily: string;
  nav_signup: string;
  nav_profile: string;

  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_enter_birthday: string;
  hero_portrait_cta: string;
  hero_ask_cta: string;
  hero_readings_given: string;
  hero_average_rating: string;
  hero_accuracy: string;

  // Cosmic Profile
  profile_your_cosmic_traits: string;
  profile_cosmic_energy: string;
  profile_best_match: string;
  profile_lucky_numbers: string;
  profile_lucky_day: string;
  profile_lucky_color: string;
  profile_gemstone: string;
  profile_todays_reading: string;
  profile_celestial_portrait: string;
  profile_share: string;
  profile_try_another: string;

  // Daily
  daily_title: string;
  daily_select_sign: string;
  daily_do: string;
  daily_dont: string;
  daily_by_life_area: string;
  daily_power: string;
  daily_pressure: string;
  daily_todays_message: string;
  daily_get_portrait: string;

  // Portrait
  portrait_title: string;
  portrait_subtitle: string;
  portrait_name: string;
  portrait_birth_date: string;
  portrait_birth_time: string;
  portrait_birth_city: string;
  portrait_idk_time: string;
  portrait_using_noon: string;
  portrait_generate: string;
  portrait_download: string;
  portrait_chart_decode: string;
  portrait_new: string;

  // Academy
  academy_title: string;
  academy_subtitle: string;
  academy_courses: string;
  academy_lessons: string;
  academy_tracks: string;
  academy_weeks: string;
  academy_start_learning: string;
  academy_card_of_day: string;
  academy_tarot_encyclopedia: string;
  academy_aspect_guide: string;

  // Chart
  chart_title: string;
  chart_compute: string;
  chart_wheel: string;
  chart_table: string;
  chart_new: string;
  chart_click_planet: string;

  // Ask
  ask_title: string;
  ask_subtitle: string;
  ask_placeholder: string;
  ask_speaking: string;
  ask_send: string;

  // Cosmos
  cosmos_title: string;
  cosmos_subtitle: string;
  cosmos_current_moon: string;
  cosmos_planetary_positions: string;
  cosmos_upcoming_events: string;
  cosmos_view_all: string;

  // Common
  common_home: string;
  common_back: string;
  common_sign_in: string;
  common_sign_up: string;
  common_sign_out: string;
  common_loading: string;
  common_element: string;
  common_modality: string;
  common_ruler: string;

  // Signs
  sign_aries: string; sign_taurus: string; sign_gemini: string; sign_cancer: string;
  sign_leo: string; sign_virgo: string; sign_libra: string; sign_scorpio: string;
  sign_sagittarius: string; sign_capricorn: string; sign_aquarius: string; sign_pisces: string;

  // Elements
  el_fire: string; el_water: string; el_air: string; el_earth: string;

  // Features
  feat_eyebrow: string; feat_title: string;
  feat_1_title: string; feat_1_desc: string;
  feat_2_title: string; feat_2_desc: string;
  feat_3_title: string; feat_3_desc: string;
  feat_4_title: string; feat_4_desc: string;
  feat_5_title: string; feat_5_desc: string;
  feat_6_title: string; feat_6_desc: string;

  // How It Works
  how_eyebrow: string; how_title: string;
  how_1_title: string; how_1_desc: string;
  how_2_title: string; how_2_desc: string;
  how_3_title: string; how_3_desc: string;

  // Daily Horoscope (landing)
  dh_eyebrow: string; dh_title: string;
  dh_select: string; dh_full_reading: string; dh_about: string;
  dh_reading_text: string; dh_sign_tag: string;

  // Testimonials
  test_eyebrow: string; test_title: string;
  test_1_quote: string; test_1_name: string; test_1_sign: string;
  test_2_quote: string; test_2_name: string; test_2_sign: string;
  test_3_quote: string; test_3_name: string; test_3_sign: string;

  // Pricing
  price_eyebrow: string; price_title: string;
  price_free: string; price_free_desc: string; price_forever: string;
  price_free_f1: string; price_free_f2: string; price_free_f3: string;
  price_free_f4: string; price_free_f5: string; price_free_f6: string;
  price_start_free: string;
  price_vip: string; price_vip_desc: string; price_popular: string;
  price_month: string; price_annual: string;
  price_vip_f1: string; price_vip_f2: string; price_vip_f3: string;
  price_vip_f4: string; price_vip_f5: string; price_vip_f6: string;
  price_vip_f7: string; price_vip_f8: string; price_vip_f9: string;
  price_start_vip: string; price_pay: string;
  price_individual: string;
  price_i1: string; price_i2: string; price_i3: string; price_i4: string; price_i5: string;

  // CTA
  cta_title: string; cta_subtitle: string; cta_button: string; cta_note: string;

  // Footer
  foot_desc: string; foot_explore: string; foot_connect: string;
  foot_copyright: string; foot_data: string;
  foot_tg_bot: string; foot_tg_channel: string;

  // Compatibility
  compat_title: string; compat_subtitle: string;
  compat_person1: string; compat_person2: string;
  compat_overall: string;
  compat_love: string; compat_comm: string; compat_trust: string; compat_passion: string;
  compat_v1: string; compat_v2: string; compat_v3: string; compat_v4: string;
}

const en: Translations = {
  nav_academy: "Academy", nav_portrait: "Portrait", nav_cosmos: "Cosmos", nav_daily: "Daily",
  nav_signup: "Sign Up", nav_profile: "My Profile",
  hero_title: "Written in Your Stars",
  hero_subtitle: "Personalised cosmic readings calculated from your exact planetary positions. Not a template — real cosmic insight.",
  hero_enter_birthday: "Enter your birthday",
  hero_portrait_cta: "Celestial Portrait", hero_ask_cta: "Ask the Stars",
  hero_readings_given: "Readings Given", hero_average_rating: "Average Rating", hero_accuracy: "Accuracy Rating",
  profile_your_cosmic_traits: "Your Cosmic Traits", profile_cosmic_energy: "Cosmic Energy Today",
  profile_best_match: "Best Cosmic Match", profile_lucky_numbers: "Lucky Numbers",
  profile_lucky_day: "Lucky Day", profile_lucky_color: "Lucky Color", profile_gemstone: "Gemstone",
  profile_todays_reading: "Today's Reading", profile_celestial_portrait: "Celestial Portrait",
  profile_share: "Share Cosmic ID", profile_try_another: "Try another birthday",
  daily_title: "Your Day", daily_select_sign: "Select your sign to reveal today's reading",
  daily_do: "Do", daily_dont: "Don't", daily_by_life_area: "By Life Area",
  daily_power: "Power", daily_pressure: "Pressure", daily_todays_message: "Today's Message",
  daily_get_portrait: "Get Your Full Portrait",
  portrait_title: "Your Celestial Portrait",
  portrait_subtitle: "Enter your complete birth data for a mathematically unique cosmic artwork with full natal chart decode.",
  portrait_name: "Your Name (optional)", portrait_birth_date: "Birth Date",
  portrait_birth_time: "Birth Time", portrait_birth_city: "Birth City",
  portrait_idk_time: "I don't know my birth time", portrait_using_noon: "Using noon as default",
  portrait_generate: "Generate My Portrait", portrait_download: "Download Portrait",
  portrait_chart_decode: "Full Chart Decode", portrait_new: "New Portrait",
  academy_title: "Olivia Arcana Academy", academy_subtitle: "Master the language of the cosmos",
  academy_courses: "Courses", academy_lessons: "Lessons", academy_tracks: "Tracks", academy_weeks: "Weeks",
  academy_start_learning: "Start Learning Free",
  academy_card_of_day: "Card of the Day", academy_tarot_encyclopedia: "Tarot Encyclopedia",
  academy_aspect_guide: "Aspect Guide",
  chart_title: "Your Birth Chart", chart_compute: "Compute My Chart",
  chart_wheel: "Chart Wheel", chart_table: "Table View", chart_new: "New Chart",
  chart_click_planet: "Click a planet to explore its meaning in your chart",
  ask_title: "Ask the Stars", ask_subtitle: "Ask any question — receive cosmic guidance",
  ask_placeholder: "Ask the cosmos anything...", ask_speaking: "The stars are speaking...",
  ask_send: "Ask",
  cosmos_title: "The Living Cosmos", cosmos_subtitle: "Real-time celestial positions and upcoming astrological events",
  cosmos_current_moon: "Current Moon", cosmos_planetary_positions: "Planetary Positions — Live",
  cosmos_upcoming_events: "Upcoming Events", cosmos_view_all: "View All Events",
  common_home: "Home", common_back: "Back", common_sign_in: "Sign In", common_sign_up: "Create Account",
  common_sign_out: "Sign Out", common_loading: "Loading...",
  common_element: "Element", common_modality: "Modality", common_ruler: "Ruler",
  sign_aries: "Aries", sign_taurus: "Taurus", sign_gemini: "Gemini", sign_cancer: "Cancer",
  sign_leo: "Leo", sign_virgo: "Virgo", sign_libra: "Libra", sign_scorpio: "Scorpio",
  sign_sagittarius: "Sagittarius", sign_capricorn: "Capricorn", sign_aquarius: "Aquarius", sign_pisces: "Pisces",
  el_fire: "Fire", el_water: "Water", el_air: "Air", el_earth: "Earth",
  // Features
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris \u2014 real planetary positions at the exact moment of your birth. Not a sun-sign template.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today\u2019s real planetary transits. Not generic \u2014 deeply personal.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data for layered insight.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility, and where the sparks \u2014 and friction \u2014 live.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart. Saturn hitting your 10th house? You\u2019ll know first.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5\u20138 minute video of Olivia reading your chart and cards \u2014 filmed just for you. The most intimate reading experience available.",
  // How It Works
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions using NASA\u2019s JPL ephemeris.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart \u2014 Sun, Moon, Rising, all planets, houses, and aspects. The cosmic blueprint of who you are.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today\u2019s real transits onto YOUR chart. Personal, timely, and grounded in actual planetary positions.",
  // Daily Horoscope
  dh_eyebrow: "Daily Horoscope", dh_title: "Today\u2019s Cosmic Weather",
  dh_select: "Select your sign above for today\u2019s preview \u2014 or get your full personal reading calculated from your exact birth chart.",
  dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today\u2019s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart, creating opportunities for growth and self-discovery. For your full personalized reading based on YOUR exact birth chart \u2014 not just your sun sign \u2014 start a conversation with Olivia.",
  dh_sign_tag: "Sign",
  // Testimonials
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "I\u2019ve tried every astrology app out there. Olivia is the only one that references my ACTUAL chart \u2014 not just my sun sign. The readings feel like they were written for me specifically.",
  test_1_name: "Sarah M.", test_1_sign: "\u264F Scorpio Sun, \u2653 Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate. It identified tension points in my relationship that we\u2019ve been working through for years. Now I understand the cosmic WHY behind it.",
  test_2_name: "Marcus T.", test_2_sign: "\u264C Leo Sun, \u264E Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia\u2019s daily reading. It\u2019s become my meditation. The transit alerts saved me during Mercury retrograde \u2014 I actually prepared for once.",
  test_3_name: "Elena K.", test_3_sign: "\u2652 Aquarius Sun, \u264B Cancer Moon",
  // Pricing
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia",
  price_vip_f2: "Daily personal reading (YOUR chart + today\u2019s transits)",
  price_vip_f3: "Real-time transit alerts on your natal points",
  price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading included",
  price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports",
  price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response \u2014 never wait in line",
  price_start_vip: "Start VIP", price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross",
  price_i4: "Year-Ahead", price_i5: "Video Reading",
  // CTA
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born. It\u2019s time to read it.",
  cta_button: "Get Your Free Reading",
  cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  // Footer
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data. Your chart. Your truth.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.",
  foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  // Compatibility
  compat_title: "Cosmic Compatibility",
  compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2",
  compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars. This connection transcends the ordinary.",
  compat_v2: "Strong gravitational pull. Your energies complement and elevate each other.",
  compat_v3: "Intriguing tensions create growth. This pairing challenges you to evolve.",
  compat_v4: "Different orbits, but opposites can spark transformation. Requires conscious effort.",
};

const uk: Translations = {
  nav_academy: "Академія", nav_portrait: "Портрет", nav_cosmos: "Космос", nav_daily: "Щоденно",
  nav_signup: "Реєстрація", nav_profile: "Мій профіль",
  hero_title: "Написано у ваших зірках",
  hero_subtitle: "Персоналізовані космічні читання, розраховані за вашими точними планетарними позиціями. Не шаблон — справжній космічний інсайт.",
  hero_enter_birthday: "Введіть дату народження",
  hero_portrait_cta: "Небесний портрет", hero_ask_cta: "Запитай зірки",
  hero_readings_given: "Читань проведено", hero_average_rating: "Середній рейтинг", hero_accuracy: "Точність",
  profile_your_cosmic_traits: "Ваші космічні риси", profile_cosmic_energy: "Космічна енергія сьогодні",
  profile_best_match: "Найкраща космічна пара", profile_lucky_numbers: "Щасливі числа",
  profile_lucky_day: "Щасливий день", profile_lucky_color: "Щасливий колір", profile_gemstone: "Камінь",
  profile_todays_reading: "Читання на сьогодні", profile_celestial_portrait: "Небесний портрет",
  profile_share: "Поділитися", profile_try_another: "Спробувати іншу дату",
  daily_title: "Ваш день", daily_select_sign: "Оберіть знак, щоб побачити прогноз на сьогодні",
  daily_do: "Робіть", daily_dont: "Не робіть", daily_by_life_area: "За сферами життя",
  daily_power: "Сила", daily_pressure: "Тиск", daily_todays_message: "Послання дня",
  daily_get_portrait: "Отримати повний портрет",
  portrait_title: "Ваш небесний портрет",
  portrait_subtitle: "Введіть повні дані народження для математично унікального космічного твору мистецтва з повною розшифровкою натальної карти.",
  portrait_name: "Ваше ім'я (необов'язково)", portrait_birth_date: "Дата народження",
  portrait_birth_time: "Час народження", portrait_birth_city: "Місто народження",
  portrait_idk_time: "Не знаю час народження", portrait_using_noon: "Використовується полудень",
  portrait_generate: "Створити портрет", portrait_download: "Завантажити портрет",
  portrait_chart_decode: "Повна розшифровка", portrait_new: "Новий портрет",
  academy_title: "Академія Олівія Аркана", academy_subtitle: "Опануйте мову космосу",
  academy_courses: "Курсів", academy_lessons: "Уроків", academy_tracks: "Напрямків", academy_weeks: "Тижнів",
  academy_start_learning: "Почати навчання безкоштовно",
  academy_card_of_day: "Карта дня", academy_tarot_encyclopedia: "Енциклопедія Таро",
  academy_aspect_guide: "Гід по аспектах",
  chart_title: "Ваша натальна карта", chart_compute: "Розрахувати карту",
  chart_wheel: "Колесо карти", chart_table: "Таблиця", chart_new: "Нова карта",
  chart_click_planet: "Натисніть на планету, щоб дослідити її значення у вашій карті",
  ask_title: "Запитай зірки", ask_subtitle: "Задайте будь-яке питання — отримайте космічну пораду",
  ask_placeholder: "Запитайте космос про що завгодно...", ask_speaking: "Зірки говорять...",
  ask_send: "Запитати",
  cosmos_title: "Живий космос", cosmos_subtitle: "Позиції планет у реальному часі та майбутні астрологічні події",
  cosmos_current_moon: "Поточний Місяць", cosmos_planetary_positions: "Позиції планет — наживо",
  cosmos_upcoming_events: "Найближчі події", cosmos_view_all: "Переглянути всі події",
  common_home: "Головна", common_back: "Назад", common_sign_in: "Увійти", common_sign_up: "Створити акаунт",
  common_sign_out: "Вийти", common_loading: "Завантаження...",
  common_element: "Стихія", common_modality: "Модальність", common_ruler: "Управитель",
  sign_aries: "Овен", sign_taurus: "Телець", sign_gemini: "Близнюки", sign_cancer: "Рак",
  sign_leo: "Лев", sign_virgo: "Діва", sign_libra: "Терези", sign_scorpio: "Скорпіон",
  sign_sagittarius: "Стрілець", sign_capricorn: "Козеріг", sign_aquarius: "Водолій", sign_pisces: "Риби",
  el_fire: "Вогонь", el_water: "Вода", el_air: "Повітря", el_earth: "Земля",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const ru: Translations = {
  nav_academy: "Академия", nav_portrait: "Портрет", nav_cosmos: "Космос", nav_daily: "Ежедневно",
  nav_signup: "Регистрация", nav_profile: "Мой профиль",
  hero_title: "Написано в ваших звёздах",
  hero_subtitle: "Персонализированные космические чтения, рассчитанные по вашим точным планетарным позициям. Не шаблон — настоящий космический инсайт.",
  hero_enter_birthday: "Введите дату рождения",
  hero_portrait_cta: "Небесный портрет", hero_ask_cta: "Спроси звёзды",
  hero_readings_given: "Чтений проведено", hero_average_rating: "Средний рейтинг", hero_accuracy: "Точность",
  profile_your_cosmic_traits: "Ваши космические черты", profile_cosmic_energy: "Космическая энергия сегодня",
  profile_best_match: "Лучшая космическая пара", profile_lucky_numbers: "Счастливые числа",
  profile_lucky_day: "Счастливый день", profile_lucky_color: "Счастливый цвет", profile_gemstone: "Камень",
  profile_todays_reading: "Чтение на сегодня", profile_celestial_portrait: "Небесный портрет",
  profile_share: "Поделиться", profile_try_another: "Попробовать другую дату",
  daily_title: "Ваш день", daily_select_sign: "Выберите знак, чтобы увидеть прогноз на сегодня",
  daily_do: "Делайте", daily_dont: "Не делайте", daily_by_life_area: "По сферам жизни",
  daily_power: "Сила", daily_pressure: "Давление", daily_todays_message: "Послание дня",
  daily_get_portrait: "Получить полный портрет",
  portrait_title: "Ваш небесный портрет",
  portrait_subtitle: "Введите полные данные рождения для математически уникального космического произведения с полной расшифровкой натальной карты.",
  portrait_name: "Ваше имя (необязательно)", portrait_birth_date: "Дата рождения",
  portrait_birth_time: "Время рождения", portrait_birth_city: "Город рождения",
  portrait_idk_time: "Не знаю время рождения", portrait_using_noon: "Используется полдень",
  portrait_generate: "Создать портрет", portrait_download: "Скачать портрет",
  portrait_chart_decode: "Полная расшифровка", portrait_new: "Новый портрет",
  academy_title: "Академия Оливия Аркана", academy_subtitle: "Овладейте языком космоса",
  academy_courses: "Курсов", academy_lessons: "Уроков", academy_tracks: "Направлений", academy_weeks: "Недель",
  academy_start_learning: "Начать обучение бесплатно",
  academy_card_of_day: "Карта дня", academy_tarot_encyclopedia: "Энциклопедия Таро",
  academy_aspect_guide: "Гид по аспектам",
  chart_title: "Ваша натальная карта", chart_compute: "Рассчитать карту",
  chart_wheel: "Колесо карты", chart_table: "Таблица", chart_new: "Новая карта",
  chart_click_planet: "Нажмите на планету, чтобы исследовать её значение в вашей карте",
  ask_title: "Спроси звёзды", ask_subtitle: "Задайте любой вопрос — получите космическое руководство",
  ask_placeholder: "Спросите космос о чём угодно...", ask_speaking: "Звёзды говорят...",
  ask_send: "Спросить",
  cosmos_title: "Живой космос", cosmos_subtitle: "Позиции планет в реальном времени и предстоящие астрологические события",
  cosmos_current_moon: "Текущая Луна", cosmos_planetary_positions: "Позиции планет — в реальном времени",
  cosmos_upcoming_events: "Ближайшие события", cosmos_view_all: "Смотреть все события",
  common_home: "Главная", common_back: "Назад", common_sign_in: "Войти", common_sign_up: "Создать аккаунт",
  common_sign_out: "Выйти", common_loading: "Загрузка...",
  common_element: "Стихия", common_modality: "Модальность", common_ruler: "Управитель",
  sign_aries: "Овен", sign_taurus: "Телец", sign_gemini: "Близнецы", sign_cancer: "Рак",
  sign_leo: "Лев", sign_virgo: "Дева", sign_libra: "Весы", sign_scorpio: "Скорпион",
  sign_sagittarius: "Стрелец", sign_capricorn: "Козерог", sign_aquarius: "Водолей", sign_pisces: "Рыбы",
  el_fire: "Огонь", el_water: "Вода", el_air: "Воздух", el_earth: "Земля",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const de: Translations = {
  nav_academy: "Akademie", nav_portrait: "Porträt", nav_cosmos: "Kosmos", nav_daily: "Täglich",
  nav_signup: "Registrieren", nav_profile: "Mein Profil",
  hero_title: "In deinen Sternen geschrieben",
  hero_subtitle: "Personalisierte kosmische Deutungen, berechnet aus deinen exakten Planetenpositionen. Keine Vorlage — echte kosmische Einsicht.",
  hero_enter_birthday: "Geburtstag eingeben",
  hero_portrait_cta: "Himmlisches Porträt", hero_ask_cta: "Frag die Sterne",
  hero_readings_given: "Deutungen", hero_average_rating: "Bewertung", hero_accuracy: "Genauigkeit",
  profile_your_cosmic_traits: "Deine kosmischen Eigenschaften", profile_cosmic_energy: "Kosmische Energie heute",
  profile_best_match: "Bestes kosmisches Match", profile_lucky_numbers: "Glückszahlen",
  profile_lucky_day: "Glückstag", profile_lucky_color: "Glücksfarbe", profile_gemstone: "Edelstein",
  profile_todays_reading: "Heutige Deutung", profile_celestial_portrait: "Himmlisches Porträt",
  profile_share: "Teilen", profile_try_another: "Anderes Datum versuchen",
  daily_title: "Dein Tag", daily_select_sign: "Wähle dein Sternzeichen für die heutige Deutung",
  daily_do: "Tu", daily_dont: "Tu nicht", daily_by_life_area: "Nach Lebensbereich",
  daily_power: "Kraft", daily_pressure: "Druck", daily_todays_message: "Botschaft des Tages",
  daily_get_portrait: "Vollständiges Porträt erhalten",
  portrait_title: "Dein himmlisches Porträt",
  portrait_subtitle: "Gib deine vollständigen Geburtsdaten ein für ein mathematisch einzigartiges kosmisches Kunstwerk mit vollständiger Horoskop-Analyse.",
  portrait_name: "Dein Name (optional)", portrait_birth_date: "Geburtsdatum",
  portrait_birth_time: "Geburtszeit", portrait_birth_city: "Geburtsstadt",
  portrait_idk_time: "Ich kenne meine Geburtszeit nicht", portrait_using_noon: "Mittag wird verwendet",
  portrait_generate: "Porträt erstellen", portrait_download: "Porträt herunterladen",
  portrait_chart_decode: "Vollständige Analyse", portrait_new: "Neues Porträt",
  academy_title: "Olivia Arcana Akademie", academy_subtitle: "Meistere die Sprache des Kosmos",
  academy_courses: "Kurse", academy_lessons: "Lektionen", academy_tracks: "Bereiche", academy_weeks: "Wochen",
  academy_start_learning: "Kostenlos lernen",
  academy_card_of_day: "Karte des Tages", academy_tarot_encyclopedia: "Tarot-Enzyklopädie",
  academy_aspect_guide: "Aspekte-Guide",
  chart_title: "Dein Geburtshoroskop", chart_compute: "Horoskop berechnen",
  chart_wheel: "Horoskop-Rad", chart_table: "Tabellenansicht", chart_new: "Neues Horoskop",
  chart_click_planet: "Klicke auf einen Planeten, um seine Bedeutung in deinem Horoskop zu erkunden",
  ask_title: "Frag die Sterne", ask_subtitle: "Stelle jede Frage — erhalte kosmische Führung",
  ask_placeholder: "Frage den Kosmos...", ask_speaking: "Die Sterne sprechen...",
  ask_send: "Fragen",
  cosmos_title: "Der lebendige Kosmos", cosmos_subtitle: "Planetenpositionen in Echtzeit und kommende astrologische Ereignisse",
  cosmos_current_moon: "Aktueller Mond", cosmos_planetary_positions: "Planetenpositionen — Live",
  cosmos_upcoming_events: "Kommende Ereignisse", cosmos_view_all: "Alle Ereignisse anzeigen",
  common_home: "Startseite", common_back: "Zurück", common_sign_in: "Anmelden", common_sign_up: "Konto erstellen",
  common_sign_out: "Abmelden", common_loading: "Laden...",
  common_element: "Element", common_modality: "Modalität", common_ruler: "Herrscher",
  sign_aries: "Widder", sign_taurus: "Stier", sign_gemini: "Zwillinge", sign_cancer: "Krebs",
  sign_leo: "Löwe", sign_virgo: "Jungfrau", sign_libra: "Waage", sign_scorpio: "Skorpion",
  sign_sagittarius: "Schütze", sign_capricorn: "Steinbock", sign_aquarius: "Wassermann", sign_pisces: "Fische",
  el_fire: "Feuer", el_water: "Wasser", el_air: "Luft", el_earth: "Erde",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const fr: Translations = {
  nav_academy: "Académie", nav_portrait: "Portrait", nav_cosmos: "Cosmos", nav_daily: "Quotidien",
  nav_signup: "S'inscrire", nav_profile: "Mon profil",
  hero_title: "Écrit dans vos étoiles",
  hero_subtitle: "Lectures cosmiques personnalisées calculées à partir de vos positions planétaires exactes. Pas un modèle — une vraie vision cosmique.",
  hero_enter_birthday: "Entrez votre date de naissance",
  hero_portrait_cta: "Portrait céleste", hero_ask_cta: "Demandez aux étoiles",
  hero_readings_given: "Lectures données", hero_average_rating: "Note moyenne", hero_accuracy: "Précision",
  profile_your_cosmic_traits: "Vos traits cosmiques", profile_cosmic_energy: "Énergie cosmique aujourd'hui",
  profile_best_match: "Meilleur match cosmique", profile_lucky_numbers: "Chiffres porte-bonheur",
  profile_lucky_day: "Jour de chance", profile_lucky_color: "Couleur porte-bonheur", profile_gemstone: "Pierre précieuse",
  profile_todays_reading: "Lecture du jour", profile_celestial_portrait: "Portrait céleste",
  profile_share: "Partager", profile_try_another: "Essayer une autre date",
  daily_title: "Votre journée", daily_select_sign: "Choisissez votre signe pour révéler la lecture du jour",
  daily_do: "Faites", daily_dont: "Ne faites pas", daily_by_life_area: "Par domaine de vie",
  daily_power: "Puissance", daily_pressure: "Pression", daily_todays_message: "Message du jour",
  daily_get_portrait: "Obtenir votre portrait complet",
  portrait_title: "Votre portrait céleste",
  portrait_subtitle: "Entrez vos données de naissance complètes pour une œuvre cosmique mathématiquement unique avec décodage complet du thème natal.",
  portrait_name: "Votre nom (facultatif)", portrait_birth_date: "Date de naissance",
  portrait_birth_time: "Heure de naissance", portrait_birth_city: "Ville de naissance",
  portrait_idk_time: "Je ne connais pas mon heure de naissance", portrait_using_noon: "Midi utilisé par défaut",
  portrait_generate: "Générer mon portrait", portrait_download: "Télécharger le portrait",
  portrait_chart_decode: "Décodage complet", portrait_new: "Nouveau portrait",
  academy_title: "Académie Olivia Arcana", academy_subtitle: "Maîtrisez le langage du cosmos",
  academy_courses: "Cours", academy_lessons: "Leçons", academy_tracks: "Parcours", academy_weeks: "Semaines",
  academy_start_learning: "Commencer gratuitement",
  academy_card_of_day: "Carte du jour", academy_tarot_encyclopedia: "Encyclopédie du Tarot",
  academy_aspect_guide: "Guide des aspects",
  chart_title: "Votre thème natal", chart_compute: "Calculer le thème",
  chart_wheel: "Roue du thème", chart_table: "Vue tableau", chart_new: "Nouveau thème",
  chart_click_planet: "Cliquez sur une planète pour explorer sa signification dans votre thème",
  ask_title: "Demandez aux étoiles", ask_subtitle: "Posez n'importe quelle question — recevez une guidance cosmique",
  ask_placeholder: "Demandez au cosmos...", ask_speaking: "Les étoiles parlent...",
  ask_send: "Demander",
  cosmos_title: "Le cosmos vivant", cosmos_subtitle: "Positions planétaires en temps réel et événements astrologiques à venir",
  cosmos_current_moon: "Lune actuelle", cosmos_planetary_positions: "Positions planétaires — en direct",
  cosmos_upcoming_events: "Événements à venir", cosmos_view_all: "Voir tous les événements",
  common_home: "Accueil", common_back: "Retour", common_sign_in: "Se connecter", common_sign_up: "Créer un compte",
  common_sign_out: "Se déconnecter", common_loading: "Chargement...",
  common_element: "Élément", common_modality: "Modalité", common_ruler: "Maître",
  sign_aries: "Bélier", sign_taurus: "Taureau", sign_gemini: "Gémeaux", sign_cancer: "Cancer",
  sign_leo: "Lion", sign_virgo: "Vierge", sign_libra: "Balance", sign_scorpio: "Scorpion",
  sign_sagittarius: "Sagittaire", sign_capricorn: "Capricorne", sign_aquarius: "Verseau", sign_pisces: "Poissons",
  el_fire: "Feu", el_water: "Eau", el_air: "Air", el_earth: "Terre",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const ar: Translations = {
  nav_academy: "الأكاديمية", nav_portrait: "الصورة", nav_cosmos: "الكون", nav_daily: "يومي",
  nav_signup: "تسجيل", nav_profile: "ملفي",
  hero_title: "مكتوب في نجومك",
  hero_subtitle: "قراءات كونية مخصصة محسوبة من مواقعك الكوكبية الدقيقة. ليست قالبًا — بصيرة كونية حقيقية.",
  hero_enter_birthday: "أدخل تاريخ ميلادك",
  hero_portrait_cta: "الصورة السماوية", hero_ask_cta: "اسأل النجوم",
  hero_readings_given: "قراءات أجريت", hero_average_rating: "التقييم المتوسط", hero_accuracy: "الدقة",
  profile_your_cosmic_traits: "سماتك الكونية", profile_cosmic_energy: "الطاقة الكونية اليوم",
  profile_best_match: "أفضل توافق كوني", profile_lucky_numbers: "أرقام الحظ",
  profile_lucky_day: "يوم الحظ", profile_lucky_color: "لون الحظ", profile_gemstone: "الحجر الكريم",
  profile_todays_reading: "قراءة اليوم", profile_celestial_portrait: "الصورة السماوية",
  profile_share: "مشاركة", profile_try_another: "جرب تاريخ آخر",
  daily_title: "يومك", daily_select_sign: "اختر برجك لكشف قراءة اليوم",
  daily_do: "افعل", daily_dont: "لا تفعل", daily_by_life_area: "حسب مجال الحياة",
  daily_power: "القوة", daily_pressure: "الضغط", daily_todays_message: "رسالة اليوم",
  daily_get_portrait: "احصل على صورتك الكاملة",
  portrait_title: "صورتك السماوية",
  portrait_subtitle: "أدخل بيانات ميلادك الكاملة للحصول على عمل فني كوني فريد رياضيًا مع فك تشفير كامل لخريطة الميلاد.",
  portrait_name: "اسمك (اختياري)", portrait_birth_date: "تاريخ الميلاد",
  portrait_birth_time: "وقت الميلاد", portrait_birth_city: "مدينة الميلاد",
  portrait_idk_time: "لا أعرف وقت ميلادي", portrait_using_noon: "يُستخدم الظهر",
  portrait_generate: "إنشاء صورتي", portrait_download: "تحميل الصورة",
  portrait_chart_decode: "فك التشفير الكامل", portrait_new: "صورة جديدة",
  academy_title: "أكاديمية أوليفيا أركانا", academy_subtitle: "أتقن لغة الكون",
  academy_courses: "دورات", academy_lessons: "دروس", academy_tracks: "مسارات", academy_weeks: "أسابيع",
  academy_start_learning: "ابدأ التعلم مجانًا",
  academy_card_of_day: "بطاقة اليوم", academy_tarot_encyclopedia: "موسوعة التاروت",
  academy_aspect_guide: "دليل الجوانب",
  chart_title: "خريطة ميلادك", chart_compute: "حساب الخريطة",
  chart_wheel: "عجلة الخريطة", chart_table: "عرض الجدول", chart_new: "خريطة جديدة",
  chart_click_planet: "انقر على كوكب لاستكشاف معناه في خريطتك",
  ask_title: "اسأل النجوم", ask_subtitle: "اطرح أي سؤال — احصل على إرشاد كوني",
  ask_placeholder: "اسأل الكون أي شيء...", ask_speaking: "النجوم تتحدث...",
  ask_send: "اسأل",
  cosmos_title: "الكون الحي", cosmos_subtitle: "مواقع الكواكب في الوقت الفعلي والأحداث الفلكية القادمة",
  cosmos_current_moon: "القمر الحالي", cosmos_planetary_positions: "مواقع الكواكب — مباشر",
  cosmos_upcoming_events: "الأحداث القادمة", cosmos_view_all: "عرض جميع الأحداث",
  common_home: "الرئيسية", common_back: "رجوع", common_sign_in: "تسجيل الدخول", common_sign_up: "إنشاء حساب",
  common_sign_out: "تسجيل الخروج", common_loading: "جاري التحميل...",
  common_element: "العنصر", common_modality: "النمط", common_ruler: "الحاكم",
  sign_aries: "الحمل", sign_taurus: "الثور", sign_gemini: "الجوزاء", sign_cancer: "السرطان",
  sign_leo: "الأسد", sign_virgo: "العذراء", sign_libra: "الميزان", sign_scorpio: "العقرب",
  sign_sagittarius: "القوس", sign_capricorn: "الجدي", sign_aquarius: "الدلو", sign_pisces: "الحوت",
  el_fire: "نار", el_water: "ماء", el_air: "هواء", el_earth: "أرض",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const es: Translations = {
  nav_academy: "Academia", nav_portrait: "Retrato", nav_cosmos: "Cosmos", nav_daily: "Diario",
  nav_signup: "Registrarse", nav_profile: "Mi perfil",
  hero_title: "Escrito en tus estrellas",
  hero_subtitle: "Lecturas cósmicas personalizadas calculadas a partir de tus posiciones planetarias exactas. No es una plantilla — visión cósmica real.",
  hero_enter_birthday: "Ingresa tu fecha de nacimiento",
  hero_portrait_cta: "Retrato celestial", hero_ask_cta: "Pregunta a las estrellas",
  hero_readings_given: "Lecturas realizadas", hero_average_rating: "Calificación promedio", hero_accuracy: "Precisión",
  profile_your_cosmic_traits: "Tus rasgos cósmicos", profile_cosmic_energy: "Energía cósmica hoy",
  profile_best_match: "Mejor coincidencia cósmica", profile_lucky_numbers: "Números de la suerte",
  profile_lucky_day: "Día de la suerte", profile_lucky_color: "Color de la suerte", profile_gemstone: "Piedra preciosa",
  profile_todays_reading: "Lectura de hoy", profile_celestial_portrait: "Retrato celestial",
  profile_share: "Compartir", profile_try_another: "Probar otra fecha",
  daily_title: "Tu día", daily_select_sign: "Selecciona tu signo para revelar la lectura de hoy",
  daily_do: "Haz", daily_dont: "No hagas", daily_by_life_area: "Por área de vida",
  daily_power: "Poder", daily_pressure: "Presión", daily_todays_message: "Mensaje del día",
  daily_get_portrait: "Obtener tu retrato completo",
  portrait_title: "Tu retrato celestial",
  portrait_subtitle: "Ingresa tus datos de nacimiento completos para una obra cósmica matemáticamente única con decodificación completa de tu carta natal.",
  portrait_name: "Tu nombre (opcional)", portrait_birth_date: "Fecha de nacimiento",
  portrait_birth_time: "Hora de nacimiento", portrait_birth_city: "Ciudad de nacimiento",
  portrait_idk_time: "No sé mi hora de nacimiento", portrait_using_noon: "Se usa mediodía",
  portrait_generate: "Generar mi retrato", portrait_download: "Descargar retrato",
  portrait_chart_decode: "Decodificación completa", portrait_new: "Nuevo retrato",
  academy_title: "Academia Olivia Arcana", academy_subtitle: "Domina el lenguaje del cosmos",
  academy_courses: "Cursos", academy_lessons: "Lecciones", academy_tracks: "Pistas", academy_weeks: "Semanas",
  academy_start_learning: "Empezar a aprender gratis",
  academy_card_of_day: "Carta del día", academy_tarot_encyclopedia: "Enciclopedia del Tarot",
  academy_aspect_guide: "Guía de aspectos",
  chart_title: "Tu carta natal", chart_compute: "Calcular carta",
  chart_wheel: "Rueda de la carta", chart_table: "Vista de tabla", chart_new: "Nueva carta",
  chart_click_planet: "Haz clic en un planeta para explorar su significado en tu carta",
  ask_title: "Pregunta a las estrellas", ask_subtitle: "Haz cualquier pregunta — recibe guía cósmica",
  ask_placeholder: "Pregunta al cosmos...", ask_speaking: "Las estrellas hablan...",
  ask_send: "Preguntar",
  cosmos_title: "El cosmos vivo", cosmos_subtitle: "Posiciones planetarias en tiempo real y próximos eventos astrológicos",
  cosmos_current_moon: "Luna actual", cosmos_planetary_positions: "Posiciones planetarias — en vivo",
  cosmos_upcoming_events: "Próximos eventos", cosmos_view_all: "Ver todos los eventos",
  common_home: "Inicio", common_back: "Volver", common_sign_in: "Iniciar sesión", common_sign_up: "Crear cuenta",
  common_sign_out: "Cerrar sesión", common_loading: "Cargando...",
  common_element: "Elemento", common_modality: "Modalidad", common_ruler: "Regente",
  sign_aries: "Aries", sign_taurus: "Tauro", sign_gemini: "Géminis", sign_cancer: "Cáncer",
  sign_leo: "Leo", sign_virgo: "Virgo", sign_libra: "Libra", sign_scorpio: "Escorpio",
  sign_sagittarius: "Sagitario", sign_capricorn: "Capricornio", sign_aquarius: "Acuario", sign_pisces: "Piscis",
  el_fire: "Fuego", el_water: "Agua", el_air: "Aire", el_earth: "Tierra",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const zh: Translations = {
  nav_academy: "学院", nav_portrait: "星图画像", nav_cosmos: "宇宙", nav_daily: "每日",
  nav_signup: "注册", nav_profile: "我的资料",
  hero_title: "写在你的星辰中",
  hero_subtitle: "根据你精确的行星位置计算的个性化宇宙解读。不是模板——真正的宇宙洞察。",
  hero_enter_birthday: "输入你的生日",
  hero_portrait_cta: "天体肖像", hero_ask_cta: "问星星",
  hero_readings_given: "已完成解读", hero_average_rating: "平均评分", hero_accuracy: "准确率",
  profile_your_cosmic_traits: "你的宇宙特质", profile_cosmic_energy: "今日宇宙能量",
  profile_best_match: "最佳宇宙匹配", profile_lucky_numbers: "幸运数字",
  profile_lucky_day: "幸运日", profile_lucky_color: "幸运颜色", profile_gemstone: "宝石",
  profile_todays_reading: "今日解读", profile_celestial_portrait: "天体肖像",
  profile_share: "分享", profile_try_another: "尝试另一个日期",
  daily_title: "你的一天", daily_select_sign: "选择你的星座以查看今日解读",
  daily_do: "要做", daily_dont: "不要做", daily_by_life_area: "按生活领域",
  daily_power: "力量", daily_pressure: "压力", daily_todays_message: "今日信息",
  daily_get_portrait: "获取完整肖像",
  portrait_title: "你的天体肖像",
  portrait_subtitle: "输入完整的出生数据，获得数学上独一无二的宇宙艺术作品，附带完整的星盘解读。",
  portrait_name: "你的名字（可选）", portrait_birth_date: "出生日期",
  portrait_birth_time: "出生时间", portrait_birth_city: "出生城市",
  portrait_idk_time: "我不知道出生时间", portrait_using_noon: "使用正午",
  portrait_generate: "生成我的肖像", portrait_download: "下载肖像",
  portrait_chart_decode: "完整解读", portrait_new: "新肖像",
  academy_title: "奥利维亚·阿卡纳学院", academy_subtitle: "掌握宇宙的语言",
  academy_courses: "课程", academy_lessons: "课时", academy_tracks: "专题", academy_weeks: "周",
  academy_start_learning: "免费开始学习",
  academy_card_of_day: "每日一牌", academy_tarot_encyclopedia: "塔罗百科",
  academy_aspect_guide: "相位指南",
  chart_title: "你的星盘", chart_compute: "计算星盘",
  chart_wheel: "星盘轮", chart_table: "表格视图", chart_new: "新星盘",
  chart_click_planet: "点击行星探索它在你星盘中的含义",
  ask_title: "问星星", ask_subtitle: "提出任何问题——接收宇宙指引",
  ask_placeholder: "向宇宙提问...", ask_speaking: "星星在说话...",
  ask_send: "提问",
  cosmos_title: "活的宇宙", cosmos_subtitle: "实时行星位置和即将到来的占星事件",
  cosmos_current_moon: "当前月相", cosmos_planetary_positions: "行星位置——实时",
  cosmos_upcoming_events: "即将到来的事件", cosmos_view_all: "查看所有事件",
  common_home: "首页", common_back: "返回", common_sign_in: "登录", common_sign_up: "创建账户",
  common_sign_out: "退出", common_loading: "加载中...",
  common_element: "元素", common_modality: "模式", common_ruler: "守护星",
  sign_aries: "白羊座", sign_taurus: "金牛座", sign_gemini: "双子座", sign_cancer: "巨蟹座",
  sign_leo: "狮子座", sign_virgo: "处女座", sign_libra: "天秤座", sign_scorpio: "天蝎座",
  sign_sagittarius: "射手座", sign_capricorn: "摩羯座", sign_aquarius: "水瓶座", sign_pisces: "双鱼座",
  el_fire: "火", el_water: "水", el_air: "风", el_earth: "土",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

const pt: Translations = {
  nav_academy: "Academia", nav_portrait: "Retrato", nav_cosmos: "Cosmos", nav_daily: "Diário",
  nav_signup: "Registrar", nav_profile: "Meu perfil",
  hero_title: "Escrito nas suas estrelas",
  hero_subtitle: "Leituras cósmicas personalizadas calculadas a partir das suas posições planetárias exatas. Não é um modelo — visão cósmica real.",
  hero_enter_birthday: "Digite sua data de nascimento",
  hero_portrait_cta: "Retrato celestial", hero_ask_cta: "Pergunte às estrelas",
  hero_readings_given: "Leituras realizadas", hero_average_rating: "Avaliação média", hero_accuracy: "Precisão",
  profile_your_cosmic_traits: "Seus traços cósmicos", profile_cosmic_energy: "Energia cósmica hoje",
  profile_best_match: "Melhor combinação cósmica", profile_lucky_numbers: "Números da sorte",
  profile_lucky_day: "Dia de sorte", profile_lucky_color: "Cor da sorte", profile_gemstone: "Pedra preciosa",
  profile_todays_reading: "Leitura de hoje", profile_celestial_portrait: "Retrato celestial",
  profile_share: "Compartilhar", profile_try_another: "Tentar outra data",
  daily_title: "Seu dia", daily_select_sign: "Selecione seu signo para revelar a leitura de hoje",
  daily_do: "Faça", daily_dont: "Não faça", daily_by_life_area: "Por área da vida",
  daily_power: "Poder", daily_pressure: "Pressão", daily_todays_message: "Mensagem do dia",
  daily_get_portrait: "Obter seu retrato completo",
  portrait_title: "Seu retrato celestial",
  portrait_subtitle: "Insira seus dados completos de nascimento para uma obra cósmica matematicamente única com decodificação completa do mapa natal.",
  portrait_name: "Seu nome (opcional)", portrait_birth_date: "Data de nascimento",
  portrait_birth_time: "Hora de nascimento", portrait_birth_city: "Cidade de nascimento",
  portrait_idk_time: "Não sei minha hora de nascimento", portrait_using_noon: "Usando meio-dia",
  portrait_generate: "Gerar meu retrato", portrait_download: "Baixar retrato",
  portrait_chart_decode: "Decodificação completa", portrait_new: "Novo retrato",
  academy_title: "Academia Olivia Arcana", academy_subtitle: "Domine a linguagem do cosmos",
  academy_courses: "Cursos", academy_lessons: "Aulas", academy_tracks: "Trilhas", academy_weeks: "Semanas",
  academy_start_learning: "Começar a aprender grátis",
  academy_card_of_day: "Carta do dia", academy_tarot_encyclopedia: "Enciclopédia do Tarot",
  academy_aspect_guide: "Guia de aspectos",
  chart_title: "Seu mapa natal", chart_compute: "Calcular mapa",
  chart_wheel: "Roda do mapa", chart_table: "Visualização em tabela", chart_new: "Novo mapa",
  chart_click_planet: "Clique em um planeta para explorar seu significado no seu mapa",
  ask_title: "Pergunte às estrelas", ask_subtitle: "Faça qualquer pergunta — receba orientação cósmica",
  ask_placeholder: "Pergunte ao cosmos...", ask_speaking: "As estrelas estão falando...",
  ask_send: "Perguntar",
  cosmos_title: "O cosmos vivo", cosmos_subtitle: "Posições planetárias em tempo real e próximos eventos astrológicos",
  cosmos_current_moon: "Lua atual", cosmos_planetary_positions: "Posições planetárias — ao vivo",
  cosmos_upcoming_events: "Próximos eventos", cosmos_view_all: "Ver todos os eventos",
  common_home: "Início", common_back: "Voltar", common_sign_in: "Entrar", common_sign_up: "Criar conta",
  common_sign_out: "Sair", common_loading: "Carregando...",
  common_element: "Elemento", common_modality: "Modalidade", common_ruler: "Regente",
  sign_aries: "Áries", sign_taurus: "Touro", sign_gemini: "Gêmeos", sign_cancer: "Câncer",
  sign_leo: "Leão", sign_virgo: "Virgem", sign_libra: "Libra", sign_scorpio: "Escorpião",
  sign_sagittarius: "Sagitário", sign_capricorn: "Capricórnio", sign_aquarius: "Aquário", sign_pisces: "Peixes",
  el_fire: "Fogo", el_water: "Água", el_air: "Ar", el_earth: "Terra",
  // Features (EN fallback — translate later)
  feat_eyebrow: "What Olivia Offers", feat_title: "Your Chart, Decoded",
  feat_1_title: "Personal Birth Chart", feat_1_desc: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth.",
  feat_2_title: "Daily Cosmic Guidance", feat_2_desc: "Every morning, a reading crafted specifically for YOUR chart based on today’s real planetary transits.",
  feat_3_title: "Tarot Readings", feat_3_desc: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data.",
  feat_4_title: "Cosmic Compatibility", feat_4_desc: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility.",
  feat_5_title: "Transit Alerts", feat_5_desc: "Real-time notifications when major planets cross sensitive points in YOUR chart.",
  feat_6_title: "Personal Video Reading", feat_6_desc: "A 5–8 minute video of Olivia reading your chart and cards — filmed just for you.",
  how_eyebrow: "How It Works", how_title: "Three Steps to Your Stars",
  how_1_title: "Share Your Birth Data", how_1_desc: "Date, time, and place of birth. Olivia calculates your exact planetary positions.",
  how_2_title: "Receive Your Chart", how_2_desc: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects.",
  how_3_title: "Get Daily Guidance", how_3_desc: "Every morning, Olivia overlays today’s real transits onto YOUR chart.",
  dh_eyebrow: "Daily Horoscope", dh_title: "Today’s Cosmic Weather",
  dh_select: "Select your sign above for today’s preview.", dh_full_reading: "Full Reading", dh_about: "About",
  dh_reading_text: "Today’s planetary alignments bring a shift in energy. The current transits are activating key areas of your chart.",
  dh_sign_tag: "Sign",
  test_eyebrow: "From Our Community", test_title: "Voices from the Stars",
  test_1_quote: "Olivia is the only app that references my ACTUAL chart.", test_1_name: "Sarah M.", test_1_sign: "♏ Scorpio Sun, ♓ Pisces Moon",
  test_2_quote: "The compatibility reading was scarily accurate.", test_2_name: "Marcus T.", test_2_sign: "♌ Leo Sun, ♎ Libra Rising",
  test_3_quote: "My morning routine: coffee, then Olivia’s daily reading.", test_3_name: "Elena K.", test_3_sign: "♒ Aquarius Sun, ♋ Cancer Moon",
  price_eyebrow: "Pricing", price_title: "Unlock Your Full Chart",
  price_free: "Free", price_free_desc: "Start exploring the cosmos", price_forever: "forever",
  price_free_f1: "5 messages per day with Olivia", price_free_f2: "Daily zodiac forecast (all 12 signs)",
  price_free_f3: "Tarot card of the day", price_free_f4: "3-card tarot spread (once daily)",
  price_free_f5: "Basic compatibility summary", price_free_f6: "Weekly cosmic weather",
  price_start_free: "Start Free",
  price_vip: "VIP", price_vip_desc: "The full cosmic experience", price_popular: "Most Popular",
  price_month: "/month", price_annual: "or $65/year (2 months free)",
  price_vip_f1: "Unlimited chat with Olivia", price_vip_f2: "Daily personal reading",
  price_vip_f3: "Real-time transit alerts", price_vip_f4: "Weekly personalized tarot pull",
  price_vip_f5: "Monthly Celtic Cross reading", price_vip_f6: "Full compatibility/synastry reports",
  price_vip_f7: "Eclipse & retrograde impact reports", price_vip_f8: "Birthday Solar Return reading",
  price_vip_f9: "Priority response", price_start_vip: "Start VIP",
  price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
  price_individual: "Or try individual premium readings:",
  price_i1: "Birth Chart", price_i2: "Compatibility", price_i3: "Celtic Cross", price_i4: "Year-Ahead", price_i5: "Video Reading",
  cta_title: "Your Stars Are Waiting",
  cta_subtitle: "The cosmos has been writing your story since the moment you were born.",
  cta_button: "Get Your Free Reading", cta_note: "Free birth chart reading. No payment required. Takes 2 minutes.",
  foot_desc: "Personalized astrology readings calculated from your exact planetary positions using NASA JPL ephemeris data.",
  foot_explore: "Explore", foot_connect: "Connect",
  foot_copyright: "The stars guide, you decide.", foot_data: "Astronomical data: NASA JPL DE440/DE441 Ephemeris",
  foot_tg_bot: "Telegram Bot", foot_tg_channel: "Telegram Channel",
  compat_title: "Cosmic Compatibility", compat_subtitle: "Enter two birthdays to reveal your celestial connection",
  compat_person1: "Person 1", compat_person2: "Person 2", compat_overall: "Overall Compatibility",
  compat_love: "Love", compat_comm: "Communication", compat_trust: "Trust", compat_passion: "Passion",
  compat_v1: "A cosmic match written in the stars.", compat_v2: "Strong gravitational pull.",
  compat_v3: "Intriguing tensions create growth.", compat_v4: "Different orbits, but opposites can spark transformation.",
};

export const TRANSLATIONS: Record<Locale, Translations> = { en, uk, ru, de, fr, ar, es, zh, pt };

/** Get translation for current locale */
export function t(locale: Locale, key: keyof Translations): string {
  return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
}

/** Get default locale from browser */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("olivia-locale") as Locale;
  if (stored && TRANSLATIONS[stored]) return stored;
  const browserLang = navigator.language.split("-")[0] as Locale;
  if (TRANSLATIONS[browserLang]) return browserLang;
  return "en";
}

/** Save locale preference */
export function setLocale(locale: Locale): void {
  localStorage.setItem("olivia-locale", locale);
}
