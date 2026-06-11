// Styled confirmation modal replacing window.confirm(). Two ways in:
//
//   1. Markup — put data-confirm="message" on a submit <button> (or an <a>).
//      Submitting/clicking opens the modal; the action only proceeds on OK.
//      Optional: data-confirm-title, data-confirm-confirm (button label),
//      data-confirm-danger (red confirm button), and a typed-confirmation
//      gate via data-confirm-match (+ -match-label, + -match-name to inject
//      the typed value back into the form as a hidden field on submit).
//
//   2. Programmatic — `confirmModal({ message, ... })` returns a Promise that
//      resolves to { ok, value }. Falls back to window.confirm if the dialog
//      element isn't on the page.

function refs() {
  const dialog = document.getElementById('rj-confirm');
  if (!dialog) return null;
  return {
    dialog,
    title: dialog.querySelector('[data-confirm-title-el]'),
    message: dialog.querySelector('[data-confirm-message-el]'),
    matchWrap: dialog.querySelector('[data-confirm-match-wrap]'),
    matchLabel: dialog.querySelector('[data-confirm-match-label-el]'),
    matchInput: dialog.querySelector('[data-confirm-match-input]'),
    ok: dialog.querySelector('[data-confirm-ok]'),
    cancel: dialog.querySelector('[data-confirm-cancel]'),
  };
}

export function confirmModal({ message, title, confirmLabel, danger = false, match = null, matchLabel = null } = {}) {
  const r = refs();
  if (!r) return Promise.resolve({ ok: window.confirm(message || 'Are you sure?'), value: null });

  return new Promise((resolve) => {
    r.title.textContent = title || 'Are you sure?';
    r.message.textContent = message || '';
    r.ok.textContent = confirmLabel || 'Confirm';
    r.ok.classList.toggle('rj-btn--danger', Boolean(danger));
    r.ok.classList.toggle('rj-btn--primary', !danger);

    const needsMatch = Boolean(match);
    r.matchWrap.hidden = !needsMatch;
    r.matchInput.value = '';
    if (needsMatch) {
      r.matchLabel.textContent = matchLabel || `Type “${match}” to confirm`;
      r.ok.disabled = true;
    } else {
      r.ok.disabled = false;
    }

    const onInput = () => { r.ok.disabled = r.matchInput.value.trim() !== match; };
    const cleanup = () => {
      r.ok.removeEventListener('click', onOk);
      r.cancel.removeEventListener('click', onCancel);
      r.matchInput.removeEventListener('input', onInput);
      r.dialog.removeEventListener('cancel', onCancel);
      r.dialog.removeEventListener('click', onBackdrop);
    };
    const close = (result) => { cleanup(); if (r.dialog.open) r.dialog.close(); resolve(result); };
    const onOk = () => { if (!r.ok.disabled) close({ ok: true, value: needsMatch ? r.matchInput.value : null }); };
    const onCancel = (e) => { e.preventDefault(); close({ ok: false, value: null }); };
    const onBackdrop = (e) => { if (e.target === r.dialog) close({ ok: false, value: null }); };

    r.ok.addEventListener('click', onOk);
    r.cancel.addEventListener('click', onCancel);
    if (needsMatch) r.matchInput.addEventListener('input', onInput);
    r.dialog.addEventListener('cancel', onCancel);
    r.dialog.addEventListener('click', onBackdrop);

    r.dialog.showModal();
    if (needsMatch) r.matchInput.focus();
    else r.ok.focus();
  });
}

function optsFrom(el) {
  return {
    message: el.dataset.confirm,
    title: el.dataset.confirmTitle,
    confirmLabel: el.dataset.confirmConfirm,
    danger: el.hasAttribute('data-confirm-danger'),
    match: el.dataset.confirmMatch || null,
    matchLabel: el.dataset.confirmMatchLabel || null,
  };
}

function setHidden(form, name, value) {
  let input = form.querySelector(`input[type="hidden"][name="${name}"]`);
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}

export function initConfirms() {
  // Submit buttons carrying data-confirm. Intercept in the capture phase so we
  // beat any default submission; re-submit through the same button on OK.
  document.addEventListener('submit', (e) => {
    const btn = e.submitter;
    if (!btn || !btn.hasAttribute('data-confirm')) return;
    if (btn.dataset.confirmed === '1') { delete btn.dataset.confirmed; return; }
    e.preventDefault();
    const form = btn.form || e.target;
    confirmModal(optsFrom(btn)).then(({ ok, value }) => {
      if (!ok) return;
      const name = btn.dataset.confirmMatchName;
      if (name && value != null) setHidden(form, name, value);
      btn.dataset.confirmed = '1';
      form.requestSubmit(btn);
    });
  }, true);

  // Links carrying data-confirm.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-confirm]');
    if (!a) return;
    e.preventDefault();
    confirmModal(optsFrom(a)).then(({ ok }) => { if (ok) window.location.href = a.href; });
  });
}
