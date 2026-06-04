// Generic single-page stepped-form (wizard) controller — the platform's
// pattern for a multi-step flow that still submits in one POST. All steps live
// in one <form>; this reveals them one at a time and drives a stepper. Without
// JS the steps render stacked and the form's submit button posts everything, so
// the flow degrades gracefully (progressive enhancement).
//
// Markup contract:
//   [data-wizard]                       the wrapper (gets .is-enhanced)
//   [data-wizard-nav] > [data-wizard-indicator="name"]   stepper items (in step order)
//   [data-wizard-step="name"]           each step section (one is .is-active)
//   [data-wizard-require-checked="msg"] step needs ≥1 checked checkbox; msg shown if not
//   [data-wizard-back] / [data-wizard-next] / [data-wizard-submit]   footer buttons (type=button/submit)
//   [data-wizard-goto="name"]           jumps to a named step (e.g. a Review "Edit" link)
// Review-summary slots (filled when their step is shown):
//   [data-wizard-summary-text="field"]  field's value (truncated)
//   [data-wizard-summary-list="field"]  "N: label, label" of checked inputs (their data-label)

function fieldsIn(step) {
  return Array.from(step.querySelectorAll('input, select, textarea'));
}

function truncate(text, max = 140) {
  const t = (text ?? '').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function setInlineError(step, message) {
  let note = step.querySelector('.rj-inline-error');
  if (!message) {
    if (note) note.remove();
    return;
  }
  if (!note) {
    note = document.createElement('p');
    note.className = 'rj-inline-error';
    step.appendChild(note);
  }
  note.textContent = message;
}

// True if the step is valid enough to advance past.
function validateStep(step) {
  const invalid = fieldsIn(step).find(f => !f.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    return false;
  }
  const requireMsg = step.getAttribute('data-wizard-require-checked');
  if (requireMsg != null) {
    const anyChecked = step.querySelector('input[type="checkbox"]:checked');
    if (!anyChecked) {
      setInlineError(step, requireMsg);
      return false;
    }
  }
  setInlineError(step, '');
  return true;
}

function fillSummary(form, step) {
  step.querySelectorAll('[data-wizard-summary-text]').forEach((slot) => {
    const field = form.querySelector(`[name="${slot.dataset.wizardSummaryText}"]`);
    slot.textContent = truncate(field ? field.value : '') || '—';
  });
  step.querySelectorAll('[data-wizard-summary-list]').forEach((slot) => {
    const name = slot.dataset.wizardSummaryList;
    const checked = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`));
    const labels = checked.map(c => c.dataset.label || c.value);
    slot.textContent = labels.length ? `${labels.length}: ${labels.join(', ')}` : 'None selected';
  });
}

function initWizard(wrapper) {
  const form = wrapper.querySelector('form');
  const steps = Array.from(wrapper.querySelectorAll('[data-wizard-step]'));
  const indicators = Array.from(wrapper.querySelectorAll('[data-wizard-indicator]'));
  if (!form || steps.length === 0) return;

  const back = wrapper.querySelector('[data-wizard-back]');
  const next = wrapper.querySelector('[data-wizard-next]');
  const submit = wrapper.querySelector('[data-wizard-submit]');
  const last = steps.length - 1;
  let current = 0;

  function show(index, { focus = false } = {}) {
    current = Math.max(0, Math.min(index, last));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === current));
    indicators.forEach((ind, i) => {
      ind.classList.toggle('is-active', i === current);
      ind.classList.toggle('is-done', i < current);
      if (i === current) ind.setAttribute('aria-current', 'step');
      else ind.removeAttribute('aria-current');
    });
    if (back) back.hidden = current === 0;
    if (next) next.hidden = current === last;
    if (submit) submit.hidden = current !== last;

    const step = steps[current];
    if (step.querySelector('[data-wizard-summary]') || step.matches('[data-wizard-step="review"]')) {
      fillSummary(form, step);
    }
    if (focus) {
      const first = step.querySelector('input:not([type="hidden"]), select, textarea, a');
      if (first) first.focus();
    }
  }

  if (next) next.addEventListener('click', () => {
    if (validateStep(steps[current])) show(current + 1, { focus: true });
  });
  if (back) back.addEventListener('click', () => show(current - 1, { focus: true }));

  wrapper.querySelectorAll('[data-wizard-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = steps.findIndex(s => s.dataset.wizardStep === btn.dataset.wizardGoto);
      if (target >= 0) show(target, { focus: true });
    });
  });

  wrapper.classList.add('is-enhanced');
  show(0);
}

export function initWizards() {
  document.querySelectorAll('[data-wizard]').forEach(initWizard);
}
