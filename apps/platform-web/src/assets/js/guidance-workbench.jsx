import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ---- Constants ----

const GUIDANCE_TASKS = [
  { value: 'write_new',         label: 'Writing something new' },
  { value: 'rewrite_existing',  label: 'Rewriting existing text' },
  { value: 'critique_existing', label: 'Critiquing existing text' },
];

const LENGTH_OPTIONS = {
  write_new: [
    { value: 'short_post',       label: 'Short post',        desc: '50–150 words' },
    { value: 'brief_piece',      label: 'Brief piece',       desc: '150–350 words' },
    { value: 'standard_article', label: 'Standard article',  desc: '350–700 words' },
    { value: 'full_length_piece',label: 'Full-length piece',  desc: '700+ words' },
  ],
  rewrite_existing: [
    { value: 'shorter',    label: 'Shorter',         desc: 'Compress while preserving message' },
    { value: 'about_same', label: 'About the same',  desc: 'Same length, better voice' },
    { value: 'longer',     label: 'Longer',          desc: 'Expand with context' },
  ],
  critique_existing: [
    { value: 'quick_take',        label: 'Quick take',         desc: 'Short overall reaction' },
    { value: 'summary_critique',  label: 'Summary critique',   desc: 'Strengths, weaknesses, top improvements' },
    { value: 'detailed_critique', label: 'Detailed critique',  desc: 'By category with recommendations' },
    { value: 'point_by_point',    label: 'Point-by-point',     desc: 'Specific issues organized by passage' },
  ],
};

const LENGTH_LABEL = {
  write_new:         'Target length',
  rewrite_existing:  'Rewrite length',
  critique_existing: 'Critique depth',
};

const DEFAULT_LENGTH = {
  write_new: 'standard_article',
  rewrite_existing: 'about_same',
  critique_existing: 'summary_critique',
};

const READING_LEVELS = [
  { value: 'easy_read',        label: 'Easy Read',         sub: 'Grade 2–3' },
  { value: 'plain_language',   label: 'Plain Language',    sub: 'Grade 4–5' },
  { value: 'general_adult',    label: 'General Adult',     sub: 'Grade 6–8' },
  { value: 'specialist_expert',label: 'Specialist / Expert',sub: 'Grade 8–10+' },
];

const FEEDBACK_CATEGORIES = [
  { value: 'sounds_right',     label: 'Sounds right' },
  { value: 'sounds_wrong',     label: 'Sounds wrong' },
  { value: 'too_generic',      label: 'Too generic' },
  { value: 'too_long',         label: 'Too long' },
  { value: 'missing_context',  label: 'Missing context' },
  { value: 'other',            label: 'Other' },
];

// ---- Assembly (mirrors server-side guidance-assembly.service.js) ----
// These content strings come from the server via __WORKBENCH_DATA__.guidance.guidanceBlocks
// and from the platform config embedded in bestPracticePacks / genericBlocks.
// For the task+length block and reading level block, content is built here client-side
// mirroring the config in guidance-blocks.config.js.

const READING_LEVEL_CONTENT = {
  easy_read: {
    heading: 'Reading level — Easy Read (grade 2–3)',
    content: `Write at a grade 2–3 reading level.
- Use very short sentences — under 15 words when possible.
- Use the most common, everyday words.
- Give concrete, specific examples.
- Use numbered or bulleted lists instead of paragraphs whenever possible.
- Read each sentence aloud — if it feels difficult to say, shorten it.`,
  },
  plain_language: {
    heading: 'Reading level — Plain Language (grade 4–5)',
    content: `Write at a plain-language reading level (approximately grade 4–5).
- Use short sentences and common words.
- Spell out acronyms the first time they appear.
- Use active voice.
- Explain any technical terms in plain language when they must appear.`,
  },
  general_adult: {
    heading: 'Reading level — General Adult (grade 6–8)',
    content: `Write for a general adult audience (approximately grade 6–8).
- Use clear, direct language appropriate for most adult readers.
- Prefer active voice and specific language over abstract generalities.`,
  },
  specialist_expert: {
    heading: 'Reading level — Specialist / Expert (grade 8–10+)',
    content: `Write for an informed or expert audience (grade 8–10+).
- Field-specific vocabulary and technical terms are appropriate when useful.
- Precision is valued over simplicity.
- Assume the reader has background knowledge.`,
  },
};

const TASK_LENGTH_CONTENT = {
  write_new: {
    short_post: { heading: 'Task — Write something new — Short post (50–150 words)', content: `Create a short, self-contained piece suitable for a social media post or brief announcement.\n- Aim for 50–150 words.\n- Lead with the most important point.\n- Make every word count.` },
    brief_piece: { heading: 'Task — Write something new — Brief piece (150–350 words)', content: `Write a brief piece of 150–350 words suitable for a short email, announcement, or introductory copy.\n- Open with a clear hook.\n- Close with a direct call to action.` },
    standard_article: { heading: 'Task — Write something new — Standard article (350–700 words)', content: `Write a standard-length piece of 350–700 words suitable for a newsletter article or web page section.\n- Use a clear structure: opening, supporting sections, conclusion.\n- Balance depth with readability.` },
    full_length_piece: { heading: 'Task — Write something new — Full-length piece (700+ words)', content: `Write a full-length piece of 700+ words suitable for a longer article or donor appeal.\n- Develop the topic with depth and context.\n- Use headings and clear sections.\n- Build to a strong conclusion with a clear call to action.` },
  },
  rewrite_existing: {
    shorter: { heading: 'Task — Rewrite existing text — Make it shorter', content: `Rewrite the provided text to be shorter while preserving the key message.\n- Cut filler phrases, redundant sentences, and unnecessary qualifiers.\n- Aim to reduce length by 25–40% without losing substance.` },
    about_same: { heading: 'Task — Rewrite existing text — About the same length', content: `Rewrite the provided text to better match this organization's voice while preserving roughly the same length.\n- Focus on word choice, sentence rhythm, and overall tone.` },
    longer: { heading: 'Task — Rewrite existing text — Make it longer', content: `Rewrite the provided text with additional context or explanation.\n- Add supporting detail and specific examples where useful.\n- Maintain the original message and purpose.` },
  },
  critique_existing: {
    quick_take: { heading: 'Task — Critique existing text — Quick take', content: `Give a brief overall reaction to the provided text (2–4 sentences).\n- Note the one or two most important things that are working.\n- Identify the single highest-priority issue to address.` },
    summary_critique: { heading: 'Task — Critique existing text — Summary critique', content: `Provide a summary critique covering:\n1. Overall voice and tone match\n2. Main strengths\n3. Main weaknesses\n4. The two or three highest-priority improvements` },
    detailed_critique: { heading: 'Task — Critique existing text — Detailed critique', content: `Provide a detailed critique organized by category:\n- Voice and tone alignment\n- Word choice and vocabulary\n- Sentence structure and rhythm\n- Clarity and readability\n- Overall effectiveness` },
    point_by_point: { heading: 'Task — Critique existing text — Point-by-point review', content: `Provide a point-by-point review.\n- Note specific phrases or passages that work well or need revision.\n- Quote the text you are commenting on, explain what to change, and say why.` },
  },
};

const GENERIC_BLOCK_CONTENT = {
  'ai-cliche-avoidance': {
    heading: 'Avoid AI clichés',
    content: `Avoid the following AI-generated clichés and overused phrases:\n- "In today's world" / "In today's fast-paced world"\n- "Dive deep" / "Deep dive"\n- "Leverage" (as a verb) / "Utilize" / "Synergy"\n- "Game-changer" / "Disruptive" / "Revolutionary"\n- "Robust" (used generically) / "Comprehensive"\n- Excessive em dashes and colons used for dramatic effect\n- Opening with "In conclusion" or "In summary"\n\nReplace these with plain, specific, direct language.`,
  },
  'plain-language-guidance': {
    heading: 'Plain-language principles',
    content: `Apply plain-language principles:\n- Use active voice: "We protect watersheds" not "Watersheds are protected."\n- Choose common words: "use" not "utilize," "help" not "facilitate."\n- Keep sentences under 25 words when possible.\n- Spell out acronyms on first use.\n- Lead with the main point before the explanation.`,
  },
  'inclusive-language-guidance': {
    heading: 'Inclusive language',
    content: `Use inclusive language:\n- Default to people-first language.\n- Use gender-neutral language: singular "they/them," "people" instead of "guys."\n- Avoid language implying a single default experience.\n- Name communities directly rather than using euphemisms.`,
  },
};

function assembleBlocks(guidance, selections, includedBlocks) {
  const included = new Set(includedBlocks);
  const { guidanceTask = 'write_new', lengthDetail, readingLevel = 'general_adult', bestPracticePack = 'none' } = selections;
  const blocks = [];

  // 1. Org-specific voice blocks (from AI)
  for (const b of guidance.guidanceBlocks ?? []) {
    if (included.has(b.id)) blocks.push({ ...b, source: b.source ?? 'voice' });
  }

  // 2. Task + length/detail block (always included, driven by selections)
  const effectiveLength = lengthDetail || DEFAULT_LENGTH[guidanceTask];
  const tlBlock = TASK_LENGTH_CONTENT[guidanceTask]?.[effectiveLength];
  if (tlBlock) blocks.push({ id: 'task-length', label: 'Guidance task', source: 'task', ...tlBlock });

  // 3. Reading level block
  if (included.has('reading-level')) {
    const rl = READING_LEVEL_CONTENT[readingLevel];
    if (rl) blocks.push({ id: 'reading-level', label: 'Reading level', source: 'reading', ...rl });
  }

  // 4. Generic blocks
  for (const [id, block] of Object.entries(GENERIC_BLOCK_CONTENT)) {
    if (included.has(id)) blocks.push({ id, label: block.heading, source: 'generic', ...block });
  }

  // 5. Best-practice pack
  if (bestPracticePack !== 'none' && included.has('best-practice-pack')) {
    const pack = (window.__WORKBENCH_DATA__?.bestPracticePacks ?? []).find(p => p.id === bestPracticePack);
    if (pack?.content) blocks.push({ id: 'best-practice-pack', label: pack.label, source: 'pack', heading: pack.heading, content: pack.content });
  }

  return blocks;
}

function getDefaultIncludedBlocks(guidance) {
  const ids = new Set();
  for (const b of guidance.guidanceBlocks ?? []) {
    if (b.defaultIncluded !== false) ids.add(b.id);
  }
  ids.add('reading-level');
  ids.add('ai-cliche-avoidance');
  return ids;
}

// ---- Color map (source → CSS variable name) ----
const SOURCE_COLOR = {
  voice:   'voice',
  task:    'task',
  reading: 'reading',
  length:  'length',
  pack:    'pack',
  generic: 'generic',
};

// ---- Sub-components ----

function ControlSection({ colorKey, title, children, isVoice }) {
  return (
    <div className={`slu-wb__ctrl-section slu-wb__ctrl-section--${colorKey}`}>
      <div className="slu-wb__ctrl-title">
        <span className={`slu-wb__ctrl-dot slu-wb__ctrl-dot--${colorKey}`} />
        <span className="slu-wb__ctrl-label">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="slu-wb__radio-group" role="radiogroup">
      {options.map(opt => (
        <label key={opt.value} className={`slu-wb__radio-opt${value === opt.value ? ' is-selected' : ''}`}>
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="slu-wb__radio-label">{opt.label}</span>
          {opt.desc && <span className="slu-wb__radio-desc">{opt.desc}</span>}
        </label>
      ))}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="slu-wb__segmented">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`slu-wb__seg-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
          title={opt.sub}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ id, label, checked, onChange }) {
  return (
    <label className="slu-wb__toggle-row">
      <span className="slu-wb__toggle-label">{label}</span>
      <span className={`slu-wb__switch${checked ? ' is-on' : ''}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
        <span className="slu-wb__knob" />
      </span>
    </label>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="slu-wb__stars" role="group" aria-label="Rating">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`slu-wb__star${(hover || value) >= n ? ' is-lit' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
}

function OutputBlock({ block }) {
  const source = SOURCE_COLOR[block.source] ?? 'generic';
  return (
    <section className={`slu-wb__out-block slu-wb__out-block--${source}`} data-source={block.source}>
      <div className="slu-wb__out-heading">
        <span className={`slu-wb__out-dot slu-wb__out-dot--${source}`} />
        <span>{block.heading ?? block.label}</span>
      </div>
      <div className="slu-wb__out-body">
        {block.content.split('\n').map((line, i) => {
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return null; // handled via pre-wrap, see below
          }
          return null;
        })}
        <pre className="slu-wb__out-pre">{block.content}</pre>
      </div>
    </section>
  );
}

function VoiceProfileDisplay({ voiceProfile }) {
  if (!voiceProfile) return null;
  return (
    <div className="slu-wb__voice-profile">
      {voiceProfile.summary && (
        <p className="slu-wb__voice-summary">{voiceProfile.summary}</p>
      )}
      {voiceProfile.toneAttributes?.length > 0 && (
        <div className="slu-wb__voice-tags">
          {voiceProfile.toneAttributes.map((tag, i) => (
            <span key={i} className="slu-wb__voice-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Debounce hook ----
function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ---- Main workbench component ----

function GuidanceWorkbench({ data }) {
  const { guidance, savedOptions, bestPracticePacks, genericBlocks } = data;

  const [guidanceTask, setGuidanceTask] = useState(savedOptions?.guidanceTask ?? 'write_new');
  const [lengthDetail, setLengthDetail] = useState(savedOptions?.lengthDetail ?? DEFAULT_LENGTH.write_new);
  const [readingLevel, setReadingLevel] = useState(savedOptions?.readingLevel ?? 'general_adult');
  const [bestPracticePack, setBestPracticePack] = useState(savedOptions?.bestPracticePack ?? 'none');
  const [includedBlocks, setIncludedBlocks] = useState(() => {
    if (savedOptions?.includedBlocks) return new Set(savedOptions.includedBlocks);
    return getDefaultIncludedBlocks(guidance);
  });

  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Sync length default when task changes
  const handleTaskChange = (task) => {
    setGuidanceTask(task);
    setLengthDetail(DEFAULT_LENGTH[task]);
  };

  const toggleBlock = (id) => {
    setIncludedBlocks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Assemble output from current selections
  const selections = { guidanceTask, lengthDetail, readingLevel, bestPracticePack };
  const assembledBlocks = assembleBlocks(guidance, selections, includedBlocks);

  // Auto-save options (debounced)
  const doSave = useCallback(() => {
    if (!data.optionsSaveUrl) return;
    fetch(data.optionsSaveUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guidanceTask, lengthDetail, readingLevel, bestPracticePack, includedBlocks: [...includedBlocks] }),
    }).catch(() => {});
  }, [guidanceTask, lengthDetail, readingLevel, bestPracticePack, includedBlocks]);

  const debouncedSave = useDebounce(doSave, 1200);
  useEffect(() => { debouncedSave(); }, [guidanceTask, lengthDetail, readingLevel, bestPracticePack, includedBlocks]);

  // Copy output
  const handleCopy = async () => {
    const text = assembledBlocks.map(b => `${b.heading ?? b.label}\n${'─'.repeat(30)}\n${b.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden textarea
      const ta = document.getElementById('slu-wb-copy-fallback');
      if (ta) { ta.value = text; ta.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    }
  };

  // Submit feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) { setFeedbackError('Please select a rating.'); return; }
    setFeedbackError('');
    try {
      const res = await fetch(data.feedbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment, category: feedbackCategory, options: selections }),
      });
      if (!res.ok) throw new Error();
      setFeedbackSubmitted(true);
    } catch {
      setFeedbackError('Could not save feedback. Please try again.');
    }
  };

  const orgName = guidance.organization?.name ?? data.orgName ?? 'Organization';
  const orgSummary = guidance.organization?.summary ?? '';

  return (
    <div className="slu-wb">
      {/* Controls panel */}
      <aside className="slu-wb__controls">
        <div className="slu-wb__controls-inner">

          {/* Our Voice — read-only display of AI profile */}
          <ControlSection colorKey="voice" title="Our Voice">
            <VoiceProfileDisplay voiceProfile={guidance.voiceProfile} />
          </ControlSection>

          {/* Guidance Task */}
          <ControlSection colorKey="task" title="Create guidance for…">
            <RadioGroup
              name="guidanceTask"
              options={GUIDANCE_TASKS}
              value={guidanceTask}
              onChange={handleTaskChange}
            />
          </ControlSection>

          {/* Adaptive Length/Detail */}
          <ControlSection colorKey="task" title={LENGTH_LABEL[guidanceTask]}>
            <RadioGroup
              name="lengthDetail"
              options={LENGTH_OPTIONS[guidanceTask]}
              value={lengthDetail}
              onChange={setLengthDetail}
            />
          </ControlSection>

          {/* Reading Level */}
          <ControlSection colorKey="reading" title="Reading level">
            <SegmentedControl
              options={READING_LEVELS}
              value={readingLevel}
              onChange={setReadingLevel}
            />
          </ControlSection>

          {/* Best-Practice Pack */}
          <ControlSection colorKey="pack" title="Add best-practice guidance for…">
            <RadioGroup
              name="bestPracticePack"
              options={bestPracticePacks.map(p => ({ value: p.id, label: p.label }))}
              value={bestPracticePack}
              onChange={setBestPracticePack}
            />
          </ControlSection>

          {/* Guidance Blocks toggles */}
          <ControlSection colorKey="generic" title="Guidance blocks">
            {/* Org-specific blocks */}
            {(guidance.guidanceBlocks ?? []).map(b => (
              <Toggle
                key={b.id}
                id={b.id}
                label={b.label}
                checked={includedBlocks.has(b.id)}
                onChange={() => toggleBlock(b.id)}
              />
            ))}
            {/* Reading level toggle */}
            <Toggle
              id="reading-level"
              label="Reading level guidance"
              checked={includedBlocks.has('reading-level')}
              onChange={() => toggleBlock('reading-level')}
            />
            {/* Generic blocks */}
            {genericBlocks.map(b => (
              <Toggle
                key={b.id}
                id={b.id}
                label={b.label}
                checked={includedBlocks.has(b.id)}
                onChange={() => toggleBlock(b.id)}
              />
            ))}
            {/* Best-practice pack toggle (only visible when a pack is selected) */}
            {bestPracticePack !== 'none' && (
              <Toggle
                id="best-practice-pack"
                label="Best-practice guidance"
                checked={includedBlocks.has('best-practice-pack')}
                onChange={() => toggleBlock('best-practice-pack')}
              />
            )}
          </ControlSection>

        </div>
      </aside>

      {/* Output panel */}
      <main className="slu-wb__output">
        <div className="slu-wb__output-inner">

          {/* Output actions bar */}
          <div className="slu-wb__out-actions">
            <span className="slu-wb__out-meta">
              {assembledBlocks.length} section{assembledBlocks.length !== 1 ? 's' : ''}
            </span>
            <div className="slu-wb__out-btns">
              <button type="button" className="rj-btn rj-btn--secondary rj-btn--sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy guidance'}
              </button>
              <a href={`${data.downloadUrlBase}?format=txt`} className="rj-btn rj-btn--ghost rj-btn--sm" download>
                .txt
              </a>
              <a href={`${data.downloadUrlBase}?format=md`} className="rj-btn rj-btn--ghost rj-btn--sm" download>
                .md
              </a>
            </div>
          </div>

          {/* No-AI note */}
          <p className="slu-wb__no-ai-note">
            Variants assembled from your analysis — no new AI cost when you adjust options.
          </p>

          {/* Assembled output */}
          {assembledBlocks.length === 0 ? (
            <div className="slu-wb__empty">
              <p>No guidance blocks are selected. Turn on blocks in the controls panel to build your output.</p>
            </div>
          ) : (
            <div className="slu-wb__out-blocks">
              {assembledBlocks.map((block, i) => (
                <OutputBlock key={`${block.id}-${i}`} block={block} />
              ))}
            </div>
          )}

          {/* Feedback section */}
          <div className="slu-wb__feedback-wrap">
            {!showFeedback && !feedbackSubmitted && (
              <button type="button" className="rj-btn rj-btn--ghost rj-btn--sm" onClick={() => setShowFeedback(true)}>
                Leave feedback
              </button>
            )}
            {showFeedback && !feedbackSubmitted && (
              <form className="slu-wb__feedback" onSubmit={handleFeedbackSubmit}>
                <p className="slu-wb__feedback-title">How did we do?</p>
                <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                <div className="slu-wb__feedback-cats">
                  {FEEDBACK_CATEGORIES.map(c => (
                    <label key={c.value} className={`slu-wb__fcat${feedbackCategory === c.value ? ' is-selected' : ''}`}>
                      <input type="radio" name="feedbackCategory" value={c.value} checked={feedbackCategory === c.value} onChange={() => setFeedbackCategory(c.value)} />
                      {c.label}
                    </label>
                  ))}
                </div>
                <textarea
                  className="rj-input slu-wb__feedback-text"
                  placeholder="Optional comments…"
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  rows={3}
                />
                {feedbackError && <p className="slu-wb__feedback-err">{feedbackError}</p>}
                <div className="slu-wb__feedback-actions">
                  <button type="submit" className="rj-btn rj-btn--primary rj-btn--sm">Submit</button>
                  <button type="button" className="rj-btn rj-btn--ghost rj-btn--sm" onClick={() => setShowFeedback(false)}>Cancel</button>
                </div>
              </form>
            )}
            {feedbackSubmitted && (
              <p className="slu-wb__feedback-thanks">Thanks for the feedback.</p>
            )}
          </div>

        </div>

        {/* Hidden fallback textarea for clipboard */}
        <textarea id="slu-wb-copy-fallback" style={{ position: 'absolute', left: '-9999px' }} readOnly />
      </main>
    </div>
  );
}

// ---- Mount ----

const root = document.getElementById('guidance-workbench-root');
const data = window.__WORKBENCH_DATA__;

if (root && data) {
  createRoot(root).render(<GuidanceWorkbench data={data} />);
}
