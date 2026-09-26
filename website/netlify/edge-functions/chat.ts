// Question preparation without invented astrology or canned fallback answers.
import { createHandler } from './_shared/reading-service.ts';
export default createHandler('chat', { env: name => Netlify.env.get(name), fetch, log: entry => console.warn(JSON.stringify(entry)) });
export const config = { path: '/api/chat' };
