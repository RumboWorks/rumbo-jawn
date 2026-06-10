// Context-sensitive help drawer. Opens only on request (the "?" button in the
// page header), fetches articles for the page's context key (falling back to
// tool-level then platform-level content server-side), and renders them as
// accordions. Article HTML is sanitized server-side.

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

export function initHelp() {
  const drawer = document.getElementById('rj-help-drawer');
  if (!drawer) return;
  const body = document.getElementById('rj-help-drawer-body');

  async function loadHelp(key) {
    body.innerHTML = '<p class="rj-help-drawer__empty">Loading…</p>';
    try {
      const res = await fetch(`/help/api/context?key=${encodeURIComponent(key)}`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (!data.articles || data.articles.length === 0) {
        body.innerHTML = '<p class="rj-help-drawer__empty">No help has been written for this page yet. <a href="/help">Browse all topics</a>.</p>';
        return;
      }
      body.innerHTML = data.articles
        .map((article, index) => `
          <details class="rj-help-item"${index === 0 ? ' open' : ''}>
            <summary>${escapeHtml(article.title)}</summary>
            <div class="rj-help-item__body">${article.html}</div>
          </details>`)
        .join('');
    } catch {
      body.innerHTML = '<p class="rj-help-drawer__empty">Help could not be loaded. <a href="/help">Open the help pages</a> instead.</p>';
    }
  }

  document.querySelectorAll('[data-help-open]').forEach((button) => {
    button.addEventListener('click', () => {
      if (typeof drawer.showModal === 'function') drawer.showModal();
      else drawer.setAttribute('open', '');
      const key = button.dataset.helpContext || document.body.dataset.tool || '';
      loadHelp(key);
    });
  });

  drawer.querySelector('[data-help-close]')?.addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) drawer.close();
  });
}
