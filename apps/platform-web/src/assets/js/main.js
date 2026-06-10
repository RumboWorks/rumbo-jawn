import '../scss/main.scss';
import { applyLocalUiPreferences } from '@rumbo/design-system';
import { initIcons } from './icons.js';
import './inline-edit.js';
import { initHelp } from './help.js';
import { initReview } from './review.js';
import { initWizards } from './wizard.js';

// Replace all <i data-lucide="icon-name"> elements with inline SVGs.
// Add new icons to the map in icons.js as they appear in Twig templates.
initIcons();

// Eval review screen (no-op unless its root is present).
initReview();

// Stepped-form wizards (no-op unless a [data-wizard] is present).
initWizards();

// Context-sensitive help drawer (no-op unless the drawer is present).
initHelp();

applyLocalUiPreferences();

document.querySelectorAll('[data-tool-switcher-open]').forEach((button) => {
  const dialog = document.getElementById(button.getAttribute('aria-controls'));
  if (!dialog) return;
  button.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });
});

document.querySelectorAll('.rj-tool-switcher__dialog').forEach((dialog) => {
  dialog.querySelectorAll('[data-tool-switcher-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

function getSortableRows(table) {
  return Array.from(table.tBodies[0]?.rows ?? []).filter((row) => {
    if (row.cells.length === 0) return false;
    if (row.cells[0]?.colSpan > 1) return false;
    return !row.querySelector('.rj-table__empty');
  });
}

function getVisibleRows(rows) {
  return rows.filter(row => row.hidden !== true);
}

function pluralizeItems(count) {
  return count === 1 ? 'item' : 'items';
}

function updateTableCount(countNode, rows) {
  const visibleCount = getVisibleRows(rows).length;
  countNode.textContent = `${visibleCount} of ${rows.length} ${pluralizeItems(rows.length)}.`;
}

function getCellSortValue(row, columnIndex) {
  const cell = row.cells[columnIndex];
  return (cell?.dataset.sortValue || cell?.textContent || '').replace(/\s+/g, ' ').trim();
}

function compareCellValues(left, right) {
  const leftNumber = Number(left.replace(/[$,%]/g, '').replace(/,/g, ''));
  const rightNumber = Number(right.replace(/[$,%]/g, '').replace(/,/g, ''));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && left !== '' && right !== '') {
    return leftNumber - rightNumber;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
    return leftDate - rightDate;
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function applyTableSort(table, header, columnIndex) {
  const tbody = table.tBodies[0];
  if (!tbody) return;

  const nextDirection = header.classList.contains('is-sort-active')
    && header.dataset.sortDirection === 'asc'
    ? 'desc'
    : 'asc';

  table.querySelectorAll('th.rj-table__sort-head').forEach((cell) => {
    cell.classList.remove('is-sort-active', 'is-sort-asc', 'is-sort-desc');
    cell.removeAttribute('aria-sort');
    delete cell.dataset.sortDirection;
  });

  header.classList.add('is-sort-active', `is-sort-${nextDirection}`);
  header.dataset.sortDirection = nextDirection;
  header.setAttribute('aria-sort', nextDirection === 'asc' ? 'ascending' : 'descending');

  getSortableRows(table)
    .map((row, index) => ({ row, index, value: getCellSortValue(row, columnIndex) }))
    .sort((left, right) => {
      const result = compareCellValues(left.value, right.value);
      const directed = nextDirection === 'asc' ? result : -result;
      return directed || left.index - right.index;
    })
    .forEach(({ row }) => tbody.append(row));
}

function buildTableTools(table, rows) {
  const wrap = table.closest('.rj-table-wrap');
  const countNode = document.createElement('p');
  countNode.className = 'rj-table-tools__count';
  updateTableCount(countNode, rows);

  const tools = document.createElement('div');
  tools.className = 'rj-table-tools';

  if (rows.length > 10) {
    const filterLabel = document.createElement('label');
    filterLabel.className = 'rj-table-tools__filter';

    const filterText = document.createElement('span');
    filterText.textContent = 'Filter';

    const filterInput = document.createElement('input');
    filterInput.className = 'rj-input rj-table-tools__input';
    filterInput.type = 'search';
    filterInput.placeholder = 'Filter';
    filterInput.autocomplete = 'off';

    filterInput.addEventListener('input', () => {
      const query = filterInput.value.replace(/\s+/g, ' ').trim().toLowerCase();
      rows.forEach((row) => {
        const rowText = row.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        row.hidden = query !== '' && !rowText.includes(query);
      });
      updateTableCount(countNode, rows);
    });

    filterLabel.append(filterText, filterInput);
    tools.append(filterLabel);
  }

  tools.append(countNode);

  if (wrap) {
    wrap.before(tools);
  }
}

function enableClientSort(table) {
  const headers = Array.from(table.tHead?.rows[0]?.cells ?? []);
  const rows = getSortableRows(table);
  if (headers.length === 0 || rows.length < 2) return;

  headers.forEach((header, columnIndex) => {
    if (!header.textContent.trim()) return;
    header.classList.add('rj-table__sort-head');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-sort', 'none');

    header.addEventListener('click', () => applyTableSort(table, header, columnIndex));
    header.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      applyTableSort(table, header, columnIndex);
    });
  });
}

// Client-side filter + count: complete admin tables only. Server-managed lists
// provide their own search/count/pagination, so skip them.
document.querySelectorAll('.rj-admin-table').forEach((table) => {
  if (table.closest('[data-server-table]')) return;
  buildTableTools(table, getSortableRows(table));
});

// Click-to-sort for any complete data table. Excludes server-managed lists
// (sorting one page is misleading — they sort server-side, below) and the eval
// matrix (which manages its own sort + heat/rank rendering).
document.querySelectorAll('.rj-table').forEach((table) => {
  if (table.closest('[data-server-table]')) return;
  if (table.hasAttribute('data-eval-matrix')) return;
  if (table.hasAttribute('data-no-sort')) return;
  enableClientSort(table);
});

// Server-managed sortable headers: re-query the server with ?sort=&dir=, toggling
// direction on repeat clicks (or the column's default first), resetting to page 1
// and preserving the other query params.
document.querySelectorAll('[data-server-table] th[data-sort-key]').forEach((th) => {
  th.setAttribute('tabindex', '0');
  const sortBy = () => {
    const url = new URL(window.location.href);
    const key = th.dataset.sortKey;
    const curSort = url.searchParams.get('sort');
    const curDir = url.searchParams.get('dir') || 'asc';
    const dir = curSort === key
      ? (curDir === 'asc' ? 'desc' : 'asc')
      : (th.dataset.sortDefault || 'asc');
    url.searchParams.set('sort', key);
    url.searchParams.set('dir', dir);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  };
  th.addEventListener('click', sortBy);
  th.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    sortBy();
  });
});

// ---- Theme switcher ----
const themeSelect = document.getElementById('rj-theme-select');
if (themeSelect) {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  themeSelect.value = current;

  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rj-theme', theme);
    document.querySelectorAll('#rj-theme-select').forEach(el => { el.value = theme; });
  });
}

const densitySelect = document.getElementById('rj-density-select');
if (densitySelect) {
  densitySelect.value = document.documentElement.getAttribute('data-density') || 'comfortable';
  densitySelect.addEventListener('change', () => {
    const density = densitySelect.value;
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('rj-density', density);
  });
}

const orientationToggle = document.getElementById('rj-nav-orientation-toggle');
if (orientationToggle) {
  orientationToggle.addEventListener('click', async () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-nav-orientation') || 'horizontal';
    const orientation = current === 'horizontal' ? 'vertical' : 'horizontal';
    const response = await fetch('/account/preferences/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ orientation }),
    });
    if (response.ok) root.setAttribute('data-nav-orientation', orientation);
  });
}

function rankClass(value, values) {
  const higher = values.filter(v => v > value).length;
  const lower = values.filter(v => v < value).length;
  if (higher === 0) return 'rank-top';
  if (lower === 0) return 'rank-bottom';
  return 'rank-middle';
}

// Apply Score/Rank display to one matrix. In Rank mode each column (the Average
// column and every criterion) is ranked across models: the cell shows its
// competition rank (1 = best; ties share a rank, next rank skips) in place of
// the score, tinted by tier. Score mode restores the one-decimal values.
function setMatrixMode(matrix, isRank) {
  const rows = Array.from(matrix.querySelectorAll('tbody tr'));
  const colCount = rows[0] ? rows[0].cells.length : 0;
  let addedIcons = false;
  for (let col = 1; col < colCount; col++) {
    const isAvgCol = col === 1; // Average column leads the criteria columns.
    const colCells = rows.map(r => r.cells[col]).filter(c => c && c.hasAttribute('data-score'));
    const scores = colCells
      .map(c => (c.dataset.score === '' ? null : parseFloat(c.dataset.score)))
      .filter(v => v != null && Number.isFinite(v));
    colCells.forEach((cell) => {
      const span = cell.querySelector('.eval-matrix__score');
      const raw = cell.dataset.score;
      const v = raw === '' || raw == null ? null : parseFloat(raw);
      cell.classList.remove('rank-top', 'rank-middle', 'rank-bottom');
      cell.querySelectorAll('.eval-matrix__medal').forEach(el => el.remove());
      if (!isRank || v == null || !Number.isFinite(v)) {
        if (span) span.textContent = (v == null || !Number.isFinite(v)) ? '—' : v.toFixed(1);
        return;
      }
      const rank = 1 + scores.filter(s => s > v).length;
      if (span) span.textContent = rank;
      cell.classList.add(rankClass(v, scores));
      if (rank === 1) {
        // Trophy for the overall (Average) winner, award for each criterion winner.
        const icon = document.createElement('i');
        icon.className = 'eval-matrix__medal';
        icon.dataset.lucide = isAvgCol ? 'trophy' : 'award';
        cell.insertBefore(icon, cell.firstChild);
        addedIcons = true;
      }
    });
  }
  if (addedIcons) initIcons();
}

// One Score/Rank control drives every matrix in its [data-matrix-scope] — so the
// mode is shared across all the run tabs instead of resetting per panel.
document.querySelectorAll('[data-rank-switch]').forEach((rankSwitch) => {
  const scope = rankSwitch.closest('[data-matrix-scope]') || document;
  const matrices = Array.from(scope.querySelectorAll('[data-eval-matrix]'));
  rankSwitch.querySelectorAll('.rj-segmented__btn').forEach((button) => {
    button.addEventListener('click', () => {
      rankSwitch.querySelectorAll('.rj-segmented__btn').forEach(b => b.classList.toggle('is-active', b === button));
      const isRank = button.dataset.mode === 'rank';
      matrices.forEach(m => setMatrixMode(m, isRank));
    });
  });
});

// Per-table column sort (each matrix sorts independently).
document.querySelectorAll('[data-eval-matrix]').forEach((matrix) => {
  let sortCol = -1, sortDir = 1;
  matrix.querySelectorAll('thead th[data-sort-col]').forEach((th) => {
    th.addEventListener('click', () => {
      const col = parseInt(th.dataset.sortCol, 10);
      if (sortCol === col) sortDir = -sortDir;
      else { sortCol = col; sortDir = col === 0 ? 1 : -1; }
      matrix.querySelectorAll('thead th[data-sort-col]').forEach((h) => {
        h.classList.remove('is-sort-asc', 'is-sort-desc');
        if (parseInt(h.dataset.sortCol, 10) === sortCol) {
          h.classList.add(sortDir === 1 ? 'is-sort-asc' : 'is-sort-desc');
        }
      });
      const tbody = matrix.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        if (sortCol === 0) {
          const na = (a.cells[0].dataset.modelName || '').toLowerCase();
          const nb = (b.cells[0].dataset.modelName || '').toLowerCase();
          return na < nb ? -sortDir : na > nb ? sortDir : 0;
        }
        const sa = a.cells[sortCol]?.dataset.score;
        const sb = b.cells[sortCol]?.dataset.score;
        const va = sa === '' || sa == null ? null : parseFloat(sa);
        const vb = sb === '' || sb == null ? null : parseFloat(sb);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return (va - vb) * sortDir;
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
});

const drilldownDataNode = document.getElementById('eval-report-drilldowns');
const drilldownDialog = document.getElementById('eval-report-drilldown');
if (drilldownDataNode && drilldownDialog) {
  const drilldowns = JSON.parse(drilldownDataNode.textContent || '{}');
  document.querySelectorAll('.eval-heat--clickable').forEach((cell) => {
    cell.addEventListener('click', () => {
      const data = drilldowns[cell.dataset.modelId] || {};
      const scores = (data.scores || []).filter(s => s.criterionSnapshotId === cell.dataset.criterionId);
      const comments = data.comments || [];
      document.getElementById('eval-drilldown-body').innerHTML = `
        <h3>Response</h3><pre class="eval-prompt">${escapeHtml(data.responseText || 'No response')}</pre>
        <h3>Reviewer scores</h3><p>${scores.map(s => s.score).join(', ') || 'No scores'}</p>
        <h3>Comments</h3>${comments.map(c => `<blockquote>${escapeHtml(c.commentText)}</blockquote>`).join('') || '<p>No comments</p>'}`;
      drilldownDialog.showModal();
    });
  });
  drilldownDialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => drilldownDialog.close());
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

// Wires Formatted/Original toggles for any response-display blocks within a
// root (document on load, or freshly-injected modal content).
function wireResponseDisplay(root) {
  root.querySelectorAll('[data-response-display]').forEach((display) => {
    display.querySelectorAll('[data-response-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.responseView;
        display.querySelectorAll('[data-response-view]').forEach(b => b.classList.toggle('is-active', b === button));
        display.querySelectorAll('[data-response-pane]').forEach(pane => { pane.hidden = pane.dataset.responsePane !== view; });
      });
    });
  });
}
wireResponseDisplay(document);

// ---- Eval detail cross-run drilldown (date + model toggles) ----
const detailDrillNode = document.getElementById('eval-detail-drilldowns');
const detailDrillDialog = document.getElementById('eval-detail-drilldown');
if (detailDrillNode && detailDrillDialog) {
  const drilldowns = JSON.parse(detailDrillNode.textContent || '{}');
  const runList = JSON.parse(document.getElementById('eval-detail-runlist')?.textContent || '[]');
  const titleEl = document.getElementById('eval-detail-drilldown-title');
  const runsNav = document.getElementById('eval-detail-drilldown-runs');
  const modelsNav = document.getElementById('eval-detail-drilldown-models');
  const chipsEl = document.getElementById('eval-detail-drilldown-chips');
  const bodyEl = document.getElementById('eval-detail-drilldown-body');

  let curModel = null;
  let curRunId = null;

  const chipHeat = (avg) => {
    if (avg == null) return 'heat-0';
    if (avg >= 4.5) return 'heat-5';
    if (avg >= 3.5) return 'heat-4';
    if (avg >= 2.5) return 'heat-3';
    if (avg >= 1.5) return 'heat-2';
    return 'heat-1';
  };

  const currentEntry = () => (drilldowns[curModel]?.runs || []).find(r => r.id === curRunId) || null;

  function renderRuns() {
    runsNav.innerHTML = '';
    runList.forEach((run) => {
      const has = (drilldowns[curModel]?.runs || []).some(r => r.id === run.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eval-drilldown__run' + (run.id === curRunId ? ' is-active' : '') + (has ? '' : ' is-empty');
      btn.textContent = run.label;
      btn.addEventListener('click', () => { curRunId = run.id; renderRuns(); renderChips(); renderBody(); });
      runsNav.appendChild(btn);
    });
  }

  function renderModels() {
    modelsNav.innerHTML = '';
    Object.keys(drilldowns).forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eval-drilldown__model' + (name === curModel ? ' is-active' : '');
      btn.textContent = name;
      btn.title = name;
      btn.addEventListener('click', () => { curModel = name; renderModels(); renderRuns(); renderChips(); renderBody(); });
      modelsNav.appendChild(btn);
    });
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    const entry = currentEntry();
    if (!entry) return;
    const cells = [{ title: 'Average', average: entry.average, isAvg: true }, ...entry.criteria];
    cells.forEach((c) => {
      const chip = document.createElement('div');
      chip.className = 'eval-drilldown__chip eval-heat ' + chipHeat(c.average) + (c.isAvg ? ' eval-drilldown__chip--avg' : '');
      chip.innerHTML = `<span class="eval-drilldown__chip-name">${escapeHtml(c.title)}</span>`
        + `<span class="eval-drilldown__chip-val">${c.average == null ? '—' : Number(c.average).toFixed(1)}</span>`;
      chipsEl.appendChild(chip);
    });
  }

  function renderBody() {
    titleEl.textContent = curModel || 'Model';
    const entry = currentEntry();
    if (!entry) {
      bodyEl.innerHTML = '<p class="eval-drilldown__empty">No data for this run.</p>';
      return;
    }
    let html = '<section class="eval-drilldown__section"><h3>AI response</h3>';
    if (entry.responseHtml || entry.responseText) {
      html += `<div class="eval-response-display" data-response-display>
          <div class="eval-response-display__pane" data-response-pane="formatted">${entry.responseHtml || escapeHtml(entry.responseText || '')}</div>
          <pre class="eval-response-display__pane eval-prompt" data-response-pane="original" hidden>${escapeHtml(entry.responseText || '')}</pre>
          <div class="eval-response-display__tabs" role="tablist" aria-label="Response display mode">
            <button type="button" class="is-active" data-response-view="formatted">Formatted</button>
            <button type="button" data-response-view="original">Original</button>
          </div>
        </div>`;
    } else {
      html += '<p class="eval-drilldown__empty">No response submitted.</p>';
    }
    html += '</section><section class="eval-drilldown__section"><h3>Reviewer comments</h3>';
    if (entry.comments.length) {
      entry.comments.forEach((text) => { html += `<blockquote class="eval-drilldown__comment">${escapeHtml(text)}</blockquote>`; });
    } else {
      html += '<p class="eval-drilldown__empty">No comments.</p>';
    }
    html += '</section>';
    bodyEl.innerHTML = html;
    wireResponseDisplay(bodyEl);
  }

  function openDetailDrilldown(modelName, runId) {
    if (!drilldowns[modelName]) return;
    curModel = modelName;
    curRunId = (runId && runList.some(r => r.id === runId)) ? runId : (runList[0] && runList[0].id);
    renderRuns();
    renderModels();
    renderChips();
    renderBody();
    detailDrillDialog.showModal();
  }

  document.querySelectorAll('[data-detail-panel] .eval-heat--clickable').forEach((cell) => {
    cell.addEventListener('click', () => {
      const panel = cell.closest('[data-detail-panel]');
      const runId = panel ? panel.dataset.detailPanel.replace(/^run-/, '') : null;
      openDetailDrilldown(cell.dataset.modelName, runId);
    });
  });

  detailDrillDialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => detailDrillDialog.close());
  detailDrillDialog.addEventListener('click', (e) => { if (e.target === detailDrillDialog) detailDrillDialog.close(); });
}

document.querySelectorAll('[data-detail-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.detailTab;
    document.querySelectorAll('[data-detail-tab]').forEach(tab => tab.classList.toggle('is-active', tab === button));
    document.querySelectorAll('[data-detail-panel]').forEach(panel => { panel.hidden = panel.dataset.detailPanel !== key; });
    // The Score/Rank control only applies to matrices — hide it on the Trend tab.
    document.querySelectorAll('[data-matrix-footer]').forEach(footer => { footer.hidden = key === 'trend'; });
  });
});
