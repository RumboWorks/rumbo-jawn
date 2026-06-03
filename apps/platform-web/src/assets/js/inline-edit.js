// Generic inline-edit controller for list items — the platform's default
// low-friction edit pattern: a row shows read-only until you click Edit, then
// becomes an inline form, saves over fetch (no page load), and flips back.
//
// Markup contract (see docs/project-charter/coding-standards.md → Interaction
// patterns). A row is any element with [data-inline-edit] containing:
//   - [data-edit-display]            the read-only view
//   - form[data-edit-form]           the edit form (hidden until editing)
//   - [data-edit-start]              button that enters edit mode
//   - [data-edit-cancel]             button that leaves edit mode
// Optional sibling for removal:
//   - form[data-inline-remove]       a form whose submit removes the row
//
// Save/remove endpoints, when called with X-Requested-With: XMLHttpRequest,
// return JSON: { ok, rowHtml } for save, { ok, removed } for remove. Without
// JS the same forms submit normally and the server redirects.

import { initIcons } from './icons.js';

function rowOf(el) {
  return el.closest('[data-inline-edit]');
}

function setEditing(row, editing) {
  const display = row.querySelector('[data-edit-display]');
  const form = row.querySelector('[data-edit-form]');
  if (!display || !form) return;
  display.hidden = editing;
  form.hidden = !editing;
  if (editing) {
    const first = form.querySelector('input, textarea, select');
    if (first) first.focus();
  }
}

async function postForm(form) {
  // Serialize as application/x-www-form-urlencoded so Express's urlencoded
  // body parser reads it (a raw FormData would post multipart, which the
  // platform does not parse).
  const body = new URLSearchParams(new FormData(form));
  const res = await fetch(form.action, {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

function flashError(row, message) {
  let note = row.querySelector('.rj-inline-error');
  if (!note) {
    note = document.createElement('p');
    note.className = 'rj-inline-error';
    row.appendChild(note);
  }
  note.textContent = message;
}

document.addEventListener('click', (event) => {
  const start = event.target.closest('[data-edit-start]');
  if (start) {
    event.preventDefault();
    setEditing(rowOf(start), true);
    return;
  }
  const cancel = event.target.closest('[data-edit-cancel]');
  if (cancel) {
    event.preventDefault();
    const row = rowOf(cancel);
    const form = row.querySelector('[data-edit-form]');
    if (form) form.reset();
    setEditing(row, false);
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target;

  if (form.matches('[data-edit-form]')) {
    event.preventDefault();
    const row = rowOf(form);
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const data = await postForm(form);
      if (data.ok && data.rowHtml) {
        row.outerHTML = data.rowHtml; // re-rendered row returns in display mode
        initIcons();
      } else if (data.error) {
        flashError(row, data.error);
        if (submit) submit.disabled = false;
      }
    } catch (err) {
      flashError(row, err.message);
      if (submit) submit.disabled = false;
    }
    return;
  }

  if (form.matches('[data-inline-remove]')) {
    event.preventDefault();
    const row = rowOf(form);
    try {
      const data = await postForm(form);
      if (data.ok && data.removed) {
        row.classList.add('is-removing');
        setTimeout(() => row.remove(), 150);
      }
    } catch (err) {
      flashError(row, err.message);
    }
  }
});
