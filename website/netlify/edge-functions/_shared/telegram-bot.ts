/* Replies for @OliviaArcanaBot. Telegram posts each update to /api/telegram and
   the reply travels back in the webhook response ("Making requests when getting
   updates" in the Bot API), so this service holds no bot token. A message is read
   only to choose a reply; it is never stored or logged. */
import { needsSupport } from './support-patterns.js';

export type BotLocale = 'en' | 'uk';
type Button = { text: string; web_app: { url: string } } | { text: string; url: string };
export type BotReply = {
  method: 'sendMessage';
  chat_id: number;
  text: string;
  reply_markup?: { inline_keyboard: Button[][] };
  link_preview_options: { is_disabled: true };
};

const SITE = 'https://oliviaarcana.com';
const BOT_USERNAME = 'oliviaarcanabot';
/** The Mini App entry; launch.js reads `startapp` to choose the first screen. */
const miniApp = (start = '') => `${SITE}/tg/${start ? `?startapp=${start}` : ''}`;

// There is no Ukrainian contact or privacy page yet (src/app/uk/), so both locales link the English pages.
const CONTACT = `${SITE}/contact/`;
const PRIVACY = `${SITE}/privacy/`;

const COPY = {
  en: {
    welcome: 'Welcome to Olivia Arcana, a personal practice of tarot. You bring a question, choose your own cards from all 78 and read what they suggest to you. Olivia never predicts, and your almanac stays on your device.',
    today: 'Choose one card from all 78 and read it in your own words.',
    spreads: 'A three-card spread for clarity: the situation, what complicates it and a helpful next step.',
    journal: 'Your almanac lives inside the Mini App; your readings and notes stay on your device.',
    help: [
      'How Olivia works:',
      'You choose a card yourself, from all 78.',
      'You read it in your own words first.',
      'If you wish, a personal interpretation can follow: it is created with AI, labelled as such and can contain mistakes.',
      'Nothing here predicts, promises or counts streaks.',
      'Your almanac stays on your device.',
      '',
      `Write to us: ${CONTACT}`,
    ].join('\n'),
    privacy: `This bot does not store your messages, and the Mini App keeps your readings on your device. Privacy policy: ${PRIVACY}`,
    contact: `You can write to Olivia Arcana through the contact page: ${CONTACT}`,
    unread: 'Olivia doesn’t read messages here yet. Your cards and almanac are in the Mini App.',
    site: `${SITE}/`,
    buttons: {
      today: 'Choose today’s card', question: 'Ask a question', spreads: 'Lay out three cards',
      journal: 'Open my almanac', card: 'Open this card', open: 'Open Olivia Arcana', site: 'Visit the website',
    },
  },
  uk: {
    welcome: 'Вітаємо в Olivia Arcana — особистій практиці таро. Ви ставите запитання, самі обираєте карти з усіх 78 і читаєте, що вони вам підказують. Olivia нічого не передбачає, а ваш альманах зберігається на вашому пристрої.',
    today: 'Оберіть одну карту з усіх 78 і прочитайте її своїми словами.',
    spreads: 'Розклад на три карти для ясності: ситуація, що її ускладнює, і корисний наступний крок.',
    journal: 'Ваш альманах — у міні-застосунку; читання й нотатки залишаються на вашому пристрої.',
    help: [
      'Як працює Olivia:',
      'Ви самі обираєте карту з усіх 78.',
      'Спершу ви читаєте її своїми словами.',
      'За бажанням можна отримати особисте тлумачення: його створює ШІ, воно позначене окремо й може містити помилки.',
      'Olivia нічого не передбачає, не обіцяє й не рахує днів поспіль.',
      'Ваш альманах зберігається на вашому пристрої.',
      '',
      `Написати нам (сторінка англійською): ${CONTACT}`,
    ].join('\n'),
    privacy: `Бот не зберігає ваших повідомлень, а читання в міні-застосунку залишаються на вашому пристрої. Політика конфіденційності (англійською): ${PRIVACY}`,
    contact: `Написати Olivia Arcana можна через сторінку контактів (англійською): ${CONTACT}`,
    unread: 'Olivia поки що не читає повідомлень тут. Ваші карти й альманах — у міні-застосунку.',
    site: `${SITE}/uk/`,
    buttons: {
      today: 'Обрати карту дня', question: 'Поставити запитання', spreads: 'Розкласти три карти',
      journal: 'Відкрити мій альманах', card: 'Відкрити цю карту', open: 'Відкрити Olivia Arcana', site: 'Перейти на сайт',
    },
  },
};

// The same words the product's support note shows (COPY in
// experience/work/olivia-product/support-note.js); keep them in step with it.
// English swaps that note's dash for brackets, per the English copy rules.
type SupportCopy = { title: string; body: string; lines: [label: string, numbers: string[], detail: string][]; elsewhere: string };
const SUPPORT: Record<BotLocale, SupportCopy> = {
  en: {
    title: 'You don’t have to hold this alone',
    body: 'If you are thinking about harming yourself, or you are not safe, please reach out to someone now. The cards can wait.',
    lines: [
      ['Emergency', ['112', '911', '999'], '112 in Europe and Ukraine, 911 in the US and Canada, 999 in the UK'],
      ['Lifeline Ukraine', ['7333'], 'free, day and night'],
      ['Samaritans, UK and Ireland', ['116 123'], 'free, day and night'],
      ['US and Canada', ['988'], 'call or text'],
    ],
    elsewhere: 'Other countries:',
  },
  uk: {
    title: 'Вам не треба нести це наодинці',
    body: 'Якщо ви думаєте про те, щоб заподіяти собі шкоду, або вам загрожує небезпека, будь ласка, зверніться до когось просто зараз. Карти можуть зачекати.',
    lines: [
      ['Екстрена допомога', ['112'], 'в Україні та Європі'],
      ['Lifeline Ukraine', ['7333'], 'цілодобово й безкоштовно'],
    ],
    elsewhere: 'Інші країни:',
  },
};

function supportText(locale: BotLocale) {
  const copy = SUPPORT[locale];
  const lines = copy.lines.map(([label, numbers, detail]) => `${label}: ${numbers.join(' · ')}${locale === 'uk' ? ` — ${detail}` : ` (${detail})`}`);
  return [copy.title, '', copy.body, '', ...lines, `${copy.elsewhere} https://findahelpline.com`].join('\n');
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Ukrainian for a Ukrainian Telegram; English for everyone else. */
export function botLocale(languageCode: unknown): BotLocale {
  return typeof languageCode === 'string' && /^uk(-|$)/i.test(languageCode) ? 'uk' : 'en';
}

const COMMAND = /^\/([a-z0-9_]{1,32})(?:@([a-z0-9_]{1,64}))?(?:\s+([\s\S]*))?$/i;
const CARD_PAYLOAD = /^card_(\d{1,2})$/;

/** The Bot API call answering one update, or null when the update needs no reply. */
export function replyTo(update: unknown): BotReply | null {
  const message = record(record(update)?.message);
  const chat = record(message?.chat);
  const from = record(message?.from);
  if (!message || !chat || chat.type !== 'private' || typeof chat.id !== 'number' || !Number.isSafeInteger(chat.id)) return null;
  const chatId = chat.id;
  if (from?.is_bot === true) return null;
  const text = typeof message.text === 'string' ? message.text : typeof message.caption === 'string' ? message.caption : null;
  if (text === null) return null;
  const locale = botLocale(from?.language_code);
  const copy = COPY[locale];
  const b = copy.buttons;
  const app = (label: string, start = ''): Button => ({ text: label, web_app: { url: miniApp(start) } });
  const send = (body: string, rows?: Button[][]): BotReply => ({
    method: 'sendMessage', chat_id: chatId, text: body,
    ...(rows ? { reply_markup: { inline_keyboard: rows } } : {}),
    link_preview_options: { is_disabled: true },
  });
  const welcomeRows = (): Button[][] => [
    [app(b.today, 'today')], [app(b.question, 'question')], [app(b.spreads, 'spreads')], [{ text: b.site, url: copy.site }],
  ];

  // Safety comes first, whatever else the message is.
  if (needsSupport(text)) return send(supportText(locale));

  const command = COMMAND.exec(text.trim());
  if (!command) return send(copy.unread, [[app(b.open)]]);
  const [, name, target, rest = ''] = command;
  if (target && target.toLowerCase() !== BOT_USERNAME) return null;
  switch (name.toLowerCase()) {
    case 'start': {
      // Payloads come from t.me/OliviaArcanaBot?start=… links on the website.
      // Payment links (pay_*, cancel, paused) get the ordinary welcome: nothing is sold here.
      const payload = rest.trim().slice(0, 64);
      if (payload === 'contact') return send(copy.contact, [[app(b.open)]]);
      const card = CARD_PAYLOAD.exec(payload);
      if (card && Number(card[1]) < 78) return send(copy.welcome, [[app(b.card, `card_${Number(card[1])}`)], ...welcomeRows()]);
      return send(copy.welcome, welcomeRows());
    }
    case 'today': return send(copy.today, [[app(b.today, 'today')]]);
    case 'spreads': return send(copy.spreads, [[app(b.spreads, 'spreads')]]);
    case 'journal': return send(copy.journal, [[app(b.journal, 'journal')]]);
    case 'privacy': return send(copy.privacy);
    default: return send(copy.help, [[app(b.open)]]);
  }
}

// Telegram delivers one update per request; its largest updates are a few kilobytes.
const MAX_BODY = 65536;
class TooLarge extends Error {}

async function readUpdate(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) throw new TooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY) { await reader.cancel(); throw new TooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Compares without stopping at the first differing byte. */
function sameSecret(given: string, expected: string) {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

const empty = (status: number, headers?: Record<string, string>) => new Response(null, { status, headers });

export function createTelegramHandler(dependencies: { env: (name: string) => string | undefined }) {
  return async (request: Request): Promise<Response> => {
    const secret = dependencies.env('TELEGRAM_WEBHOOK_SECRET')?.trim();
    const given = request.headers.get('x-telegram-bot-api-secret-token');
    if (!secret || given === null || !sameSecret(given, secret)) return empty(401);
    if (request.method !== 'POST') return empty(405, { Allow: 'POST' });
    if (!/^application\/json(\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return empty(415);
    let update: unknown;
    try { update = await readUpdate(request); }
    catch (error) { return empty(error instanceof TooLarge ? 413 : 400); }
    let reply: BotReply | null = null;
    // An update this bot cannot answer is still acknowledged, so Telegram does not resend it.
    try { reply = replyTo(update); } catch { reply = null; }
    if (!reply) return empty(200);
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  };
}
