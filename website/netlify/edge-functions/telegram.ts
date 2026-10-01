// @OliviaArcanaBot's webhook. Replies ride back in the response, so no bot token is needed here.
import { createTelegramHandler } from './_shared/telegram-bot.ts';
export default createTelegramHandler({ env: name => Netlify.env.get(name) });
export const config = { path: '/api/telegram' };
