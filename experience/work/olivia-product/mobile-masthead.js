/** The phone masthead. The first-frame script draws it before the first paint; the phone shell adopts the same element. */
const MENU = {en: 'Explore', uk: 'Досліджуйте'};

export function mastheadMarkup(locale = 'en') {
 const menu = MENU[locale === 'uk' ? 'uk' : 'en'];
 return `<a class="mobile-signature" href="#home" aria-label="Olivia Arcana">Olivia <span>ARCANA</span></a><button type="button" class="mobile-menu-toggle" aria-label="${menu}" aria-haspopup="dialog" aria-controls="mobile-explore"><span>${menu}</span><i aria-hidden="true"><b></b><b></b></i></button>`;
}

export function createMasthead(doc, locale = 'en') {
 const header = doc.createElement('header');
 header.className = 'mobile-masthead';
 header.dataset.noTranslate = 'true';
 header.innerHTML = mastheadMarkup(locale);
 return header;
}
