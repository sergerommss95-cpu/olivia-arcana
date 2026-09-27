import { createHandler } from './_shared/reading-service.ts';
export default createHandler('reading', { env: name => Netlify.env.get(name), fetch, log: entry => console.warn(JSON.stringify(entry)) });
export const config = { path: '/api/reading' };
