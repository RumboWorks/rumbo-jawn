import '../scss/main.scss';
import {
  createIcons,
  Activity, AlertTriangle, Braces, Brain, Building2, CheckCircle2,
  CircleAlert, CircleX, ClipboardList, Clock, Copy, Cpu, FileText, Globe, Info,
  Filter, LayoutDashboard, Loader, LogIn, LogOut,
  Mic2, Pencil, Plus, Save, SlidersHorizontal, Sparkles, Tag, User, Users, XCircle,
} from 'lucide';

// Replace all <i data-lucide="icon-name"> elements with inline SVGs.
// Add named imports above as new icons appear in Twig templates.
createIcons({
  icons: {
    Activity, AlertTriangle, Braces, Brain, Building2, CheckCircle2,
    CircleAlert, CircleX, ClipboardList, Clock, Copy, Cpu, FileText, Globe, Info,
    Filter, LayoutDashboard, Loader, LogIn, LogOut,
    Mic2, Pencil, Plus, Save, SlidersHorizontal, Sparkles, Tag, User, Users, XCircle,
  },
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
const select = document.getElementById('rj-theme-select');
if (select) {
  const current = document.documentElement.getAttribute('data-theme') || 'rumboworks';
  select.value = current;

  select.addEventListener('change', () => {
    const theme = select.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rj-theme', theme);
    document.querySelectorAll('#rj-theme-select').forEach(el => { el.value = theme; });
  });
}
