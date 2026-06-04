import '../scss/main.scss';
import { applyLocalUiPreferences } from '@rumbo/design-system';
import { initIcons } from './icons.js';
import './inline-edit.js';
import { initReview } from './review.js';
import { initWizards } from './wizard.js';

// Replace all <i data-lucide="icon-name"> elements with inline SVGs.
// Add new icons to the map in icons.js as they appear in Twig templates.
initIcons();

// Eval review screen (no-op unless its root is present).
initReview();

// Stepped-form wizards (no-op unless a [data-wizard] is present).
initWizards();
applyLocalUiPreferences();

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

document.querySelectorAll('.rj-admin-table').forEach((table) => {
  const headers = Array.from(table.tHead?.rows[0]?.cells ?? []);
  const rows = getSortableRows(table);
  buildTableTools(table, rows);
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

document.querySelectorAll('[data-eval-matrix]').forEach((matrix) => {
  const cells = Array.from(matrix.querySelectorAll('.eval-heat[data-score]'));
  document.querySelectorAll('[data-score-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const rank = button.dataset.scoreMode === 'rank';
      const values = cells.map(cell => Number(cell.dataset.score)).filter(Number.isFinite);
      cells.forEach((cell) => {
        cell.classList.remove('rank-top', 'rank-middle', 'rank-bottom');
        const value = Number(cell.dataset.score);
        if (rank && Number.isFinite(value)) cell.classList.add(rankClass(value, values));
      });
      button.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === button));
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

document.querySelectorAll('[data-response-display]').forEach((display) => {
  display.querySelectorAll('[data-response-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.responseView;
      display.querySelectorAll('[data-response-view]').forEach(b => b.classList.toggle('is-active', b === button));
      display.querySelectorAll('[data-response-pane]').forEach(pane => { pane.hidden = pane.dataset.responsePane !== view; });
    });
  });
});

document.querySelectorAll('[data-detail-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.detailTab;
    document.querySelectorAll('[data-detail-tab]').forEach(tab => tab.classList.toggle('is-active', tab === button));
    document.querySelectorAll('[data-detail-panel]').forEach(panel => { panel.hidden = panel.dataset.detailPanel !== key; });
  });
});
