// Shared sliding highlight for every rj-segmented control. A single indicator
// element sits behind the active option and animates to it on change; the CSS
// transition (_segmented.scss) does the easing. Button-based controls move the
// active state on click; anchor-based tab controls navigate away, so they just
// keep the load-time highlight under the active tab.
//
// The SLU guidance workbench renders its segmenteds in React and manages their
// indicators itself, so that subtree is skipped here.

function slide(seg) {
  const indicator = seg.querySelector(':scope > .rj-segmented__indicator');
  if (!indicator) return;
  const active = seg.querySelector(':scope > .rj-segmented__btn.is-active');
  if (!active) { indicator.style.opacity = '0'; return; }
  const cr = seg.getBoundingClientRect();
  if (cr.width === 0) return; // hidden (e.g. inside an inactive tab) — a
                              // ResizeObserver re-runs this once it's shown
  const br = active.getBoundingClientRect();
  if (seg.classList.contains('rj-segmented--vertical')) {
    indicator.style.width = '';
    indicator.style.height = `${br.height}px`;
    indicator.style.transform = `translateY(${br.top - cr.top - 3}px)`;
  } else {
    indicator.style.height = '';
    indicator.style.width = `${br.width}px`;
    indicator.style.transform = `translateX(${br.left - cr.left - 3}px)`;
  }
  indicator.style.opacity = '1';
}

export function initSegmented() {
  document.querySelectorAll('.rj-segmented').forEach((seg) => {
    if (seg.closest('#guidance-workbench-root')) return; // React-managed
    if (seg.dataset.segmentedReady) return;
    seg.dataset.segmentedReady = '1';

    if (!seg.querySelector(':scope > .rj-segmented__indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'rj-segmented__indicator';
      indicator.setAttribute('aria-hidden', 'true');
      seg.prepend(indicator);
    }

    const buttons = seg.querySelectorAll(':scope > .rj-segmented__btn');
    buttons.forEach((btn) => {
      if (btn.tagName === 'A') return; // tab links navigate; no in-page move
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.toggle('is-active', b === btn));
        slide(seg);
      });
    });

    requestAnimationFrame(() => slide(seg));
    if ('ResizeObserver' in window) new ResizeObserver(() => slide(seg)).observe(seg);
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.rj-segmented').forEach((seg) => {
      if (!seg.closest('#guidance-workbench-root')) slide(seg);
    });
  });
}
