/* JSON the product fetches on first use, one language at a time (see build.py). */
const cache = new Map();

export function loadLazy(kind, language) {
  const url = globalThis.OLIVIA_ASSETS?.lazy?.[kind]?.[language === 'uk' ? 'uk' : 'en'];
  if (!url) return Promise.reject(new Error(`No ${kind} data in this build.`));
  if (!cache.has(url)) {
    cache.set(url, fetch(url)
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .catch(error => { cache.delete(url); throw error; }));
  }
  return cache.get(url);
}

/** A link into the website's lessons: relative on the site, absolute in the portable copy. */
export function learnHref(path, language) {
  return `${globalThis.OLIVIA_NATIVE === true ? '' : 'https://oliviaarcana.com'}${language === 'uk' ? '/uk' : ''}/learn/${path}/`;
}
