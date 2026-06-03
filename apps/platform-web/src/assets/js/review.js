// Eval review screen — tabbed, one response at a time. Ratings autosave on
// change; comments autosave debounced. Vanilla, progressive: only runs when
// #eval-review is present. Endpoints return { ok } JSON.

function post(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
    body: new URLSearchParams(payload),
  }).then(r => r.json());
}

export function initReview() {
  const root = document.getElementById('eval-review');
  if (!root) return;

  const ratingsUrl = root.dataset.ratingsUrl;
  const commentsUrl = root.dataset.commentsUrl;
  const totalExpected = parseInt(root.dataset.totalExpected, 10) || 0;
  const statusEl = document.getElementById('eval-autosave');
  const progressEl = document.getElementById('review-progress');
  const commentTimers = {};

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }
  function save(url, payload) {
    setStatus('Saving…');
    post(url, payload)
      .then(d => {
        if (d && d.ok) { setStatus('Saved'); setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1500); }
        else setStatus('Save failed' + (d && d.error ? ' — ' + d.error : ''), true);
      })
      .catch(() => setStatus('Save failed — check your connection', true));
  }

  // Tabs
  root.querySelectorAll('[data-response-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.responseTab;
      root.querySelectorAll('[data-response-tab]').forEach(t => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      root.querySelectorAll('[data-response-panel]').forEach(p => {
        const active = p.dataset.responsePanel === id;
        p.classList.toggle('is-active', active);
        p.hidden = !active;
      });
    });
  });

  function refreshCheck(responseId) {
    const check = root.querySelector(`[data-check-for="${responseId}"]`);
    if (!check) return;
    const need = parseInt(check.dataset.criteria, 10);
    const have = root.querySelectorAll(`.eval-criterion[data-response-id="${responseId}"] input[type="radio"]:checked`).length;
    check.textContent = have >= need && need > 0 ? '✓' : '';
  }
  function refreshProgress() {
    const have = root.querySelectorAll('.eval-scores input[type="radio"]:checked').length;
    if (progressEl) progressEl.textContent = `${have} / ${totalExpected} scores given`;
  }

  // Ratings
  root.querySelectorAll('.eval-scores input[type="radio"]').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.eval-scores').querySelectorAll('.eval-scores__label').forEach(l => l.classList.remove('is-selected'));
      input.nextElementSibling.classList.add('is-selected');
      refreshCheck(input.dataset.responseId);
      refreshProgress();
      save(ratingsUrl, {
        responseId: input.dataset.responseId,
        criterionSnapshotId: input.dataset.criterionId,
        score: input.value,
      });
    });
  });

  // Comments (debounced)
  root.querySelectorAll('[data-comment-for]').forEach(ta => {
    ta.addEventListener('input', () => {
      const id = ta.dataset.commentFor;
      clearTimeout(commentTimers[id]);
      commentTimers[id] = setTimeout(() => save(commentsUrl, { responseId: id, commentText: ta.value }), 700);
    });
  });

  // Submit (confirm)
  const submitBtn = document.getElementById('review-submit');
  const submitForm = document.getElementById('review-submit-form');
  if (submitBtn && submitForm) {
    submitBtn.addEventListener('click', () => {
      const have = root.querySelectorAll('.eval-scores input[type="radio"]:checked').length;
      const msg = have < totalExpected
        ? `You've scored ${have} of ${totalExpected}. Unscored criteria are excluded from the report. Submit anyway?`
        : 'Submit your review? Your scores and comments will be locked.';
      if (window.confirm(msg)) submitForm.submit();
    });
  }

  // Initialise selected styling + checks
  root.querySelectorAll('.eval-scores input[type="radio"]:checked').forEach(input => {
    input.nextElementSibling.classList.add('is-selected');
    refreshCheck(input.dataset.responseId);
  });
}
