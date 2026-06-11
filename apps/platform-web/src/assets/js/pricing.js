// Public pricing page: the Annual/Monthly segmented toggle swaps each card's
// price display and repoints the CTAs and whole-card click target to the active
// interval's signup URL. The sliding highlight itself is handled generically by
// the shared segmented controller (segmented.js). Server-rendered markup
// defaults to the annual view, so no-JS visitors still see valid prices/links.

function applyInterval(interval) {
  document.querySelectorAll('[data-price-monthly]').forEach(el => { el.hidden = interval !== 'month'; });
  document.querySelectorAll('[data-price-annual]').forEach(el => { el.hidden = interval !== 'year'; });
  document.querySelectorAll('[data-tier-card]').forEach(card => {
    const href = interval === 'year' ? card.dataset.hrefYear : card.dataset.hrefMonth;
    const cta = card.querySelector('[data-tier-cta]');
    if (cta) cta.setAttribute('href', href);
    card.dataset.activeHref = href;
  });
}

export function initPricing() {
  const toggle = document.querySelector('[data-interval-toggle]');
  if (!toggle) return;

  // The active button (annual) is set in markup; sync the visible prices to it.
  const initial = toggle.querySelector('.rj-segmented__btn.is-active')?.dataset.interval || 'year';
  applyInterval(initial);

  // Price/CTA swap on change; the shared controller moves the highlight.
  toggle.querySelectorAll('[data-interval]').forEach(btn => {
    btn.addEventListener('click', () => applyInterval(btn.dataset.interval));
  });

  // Whole-tile click → the active interval's signup URL. Real clicks on the CTA
  // link (or any nested anchor) fall through to their own navigation.
  document.querySelectorAll('[data-tier-card]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const href = card.dataset.activeHref || card.dataset.hrefYear;
      if (href) window.location.href = href;
    });
  });
}
