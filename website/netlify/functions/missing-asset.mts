// Misses under the content-hashed paths. netlify.toml caches those paths for a
// year as immutable, and Netlify applies that rule to its own 404 page too, so a
// file that is briefly absent (a deploy race, or a rollback that brings an old
// hash back) could stay a 404 in browsers for a year. preferStatic keeps every
// real file on the CDN with its immutable header; this runs only when no file
// exists, and Netlify does not add netlify.toml headers to function responses.
export default () =>
  new Response('Not found\n', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });

export const config = {
  path: ['/experience/assets/*', '/_next/static/*'],
  preferStatic: true,
};
