import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ---- Constants ----

const GUIDANCE_TASKS = [
  { value: 'write_new',         label: 'Write',    desc: 'Create a new piece from scratch in your voice.' },
  { value: 'rewrite_existing',  label: 'Rewrite',  desc: 'Revise existing content while matching your voice.' },
  { value: 'critique_existing', label: 'Critique', desc: 'Critique existing content and suggest improvements.' },
];

const LENGTH_OPTIONS = {
  write_new: [
    { value: 'short_post',       label: 'Short',        desc: '50–150 words' },
    { value: 'brief_piece',      label: 'Brief',       desc: '150–350 words' },
    { value: 'standard_article', label: 'Standard',  desc: '350–700 words' },
    { value: 'full_length_piece',label: 'Full-length',  desc: '700+ words' },
  ],
  rewrite_existing: [
    { value: 'shorter',    label: 'Shorter',  desc: 'Compress while preserving message' },
    { value: 'about_same', label: 'Same',     desc: 'Same length, better voice' },
    { value: 'longer',     label: 'Longer',   desc: 'Expand with context' },
  ],
  critique_existing: [
    { value: 'quick_take',        label: 'Quick take',         desc: 'Short overall reaction' },
    { value: 'summary_critique',  label: 'Summary',   desc: 'Strengths, weaknesses, top improvements' },
    { value: 'detailed_critique', label: 'Detailed',  desc: 'By category with recommendations' },
    { value: 'point_by_point',    label: 'Point-by‑point',     desc: 'Specific issues organized by passage' },
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
  { value: 'specialist_expert',label: 'Specialist/ Expert',sub: 'Grade 8–10+' },
];

const FEEDBACK_CATEGORIES = [
  { value: 'sounds_right',     label: 'Sounds right' },
  { value: 'sounds_wrong',     label: 'Sounds wrong' },
  { value: 'too_generic',      label: 'Too generic' },
  { value: 'too_long',         label: 'Too long' },
  { value: 'missing_context',  label: 'Missing context' },
  { value: 'other',            label: 'Other' },
];

const GUIDANCE_VIEW_MODES = [
  { value: 'preview', label: 'Preview' },
  { value: 'full_guidance', label: 'Full Guidance' },
];

const PREVIEW_EXCLUDED_BLOCK_IDS = new Set(['vocabulary', 'what-to-avoid']);

// ---- Assembly (mirrors server-side guidance-assembly.service.js) ----

function assembleBlocks(guidance, guidancePackage, selections, includedBlocks) {
  const included = new Set(includedBlocks);
  const { guidanceTask = 'write_new', lengthDetail, readingLevel = 'general_adult', bestPracticePack = 'none' } = selections;
  const blocks = [];

  // 1. Org-specific voice blocks (from AI)
  for (const b of guidance.guidanceBlocks ?? []) {
    if (included.has(b.id)) {
      const voiceToneFields = b.id === 'voice-tone'
        ? {
            previewText: guidance.voiceTone?.previewSummary,
            fullText: guidance.voiceTone?.fullGuidance,
          }
        : {};
      blocks.push({ ...b, ...voiceToneFields, source: b.source ?? 'voice' });
    }
  }

  // 2. Task + length/detail block (always included, driven by selections)
  const effectiveLength = lengthDetail || DEFAULT_LENGTH[guidanceTask];
  const tlBlock = guidancePackage.taskLengthBlocks[guidanceTask]?.[effectiveLength];
  if (tlBlock) blocks.push({ ...tlBlock, id: 'task-length', label: 'Guidance task', source: 'task', guidanceTask });

  // 3. Reading level block
  if (included.has('reading-level')) {
    const rl = guidancePackage.readingLevelBlocks[readingLevel];
    if (rl) blocks.push({ ...rl, id: 'reading-level', label: 'Reading level', source: 'reading' });
  }

  // 4. Generic blocks
  for (const block of guidancePackage.genericBlocks) {
    if (included.has(block.id)) blocks.push({ ...block });
  }

  // 5. Best-practice pack
  if (bestPracticePack !== 'none' && included.has('best-practice-pack')) {
    const pack = (window.__WORKBENCH_DATA__?.bestPracticePacks ?? []).find(p => p.id === bestPracticePack);
    if (pack?.fullText) blocks.push({ id: 'best-practice-pack', label: pack.label, source: 'pack', heading: pack.heading, previewText: pack.previewText, fullText: pack.fullText });
  }

  return blocks;
}

function getDefaultIncludedBlocks(guidance, guidancePackage) {
  const ids = new Set();
  for (const b of guidance.guidanceBlocks ?? []) {
    if (b.defaultIncluded !== false) ids.add(b.id);
  }
  ids.add('reading-level');
  for (const b of guidancePackage.genericBlocks ?? []) {
    if (b.defaultIncluded) ids.add(b.id);
  }
  return ids;
}

function getGuidanceTokenContext(guidance) {
  const organization = guidance.organization ?? {};
  const tokens = {
    voiceTonePreviewSummary: guidance.voiceTone?.previewSummary,
    voiceToneFullGuidance: guidance.voiceTone?.fullGuidance,
  };

  if (typeof organization.name === 'string' && organization.name.trim()) tokens.organizationName = organization.name;
  if (typeof organization.shortName === 'string' && organization.shortName.trim()) tokens.organizationShortName = organization.shortName;
  if (typeof organization.detectedType === 'string' && organization.detectedType.trim()) tokens.detectedOrganizationType = organization.detectedType;

  return tokens;
}

function blockContent(block, mode, tokenContext) {
  const field = mode === 'preview' ? 'previewText' : 'fullText';
  if (typeof block[field] !== 'string' || !block[field].trim()) {
    throw new Error(`Missing ${field} for guidance block ${block.id}.`);
  }
  return renderTemplate(block[field], tokenContext);
}

function assemblePreviewBlocks(blocks, tokenContext) {
  return blocks
    .filter(block => !PREVIEW_EXCLUDED_BLOCK_IDS.has(block.id))
    .map(block => ({ ...block, content: blockContent(block, 'preview', tokenContext) }));
}

function assembleFullBlocks(blocks, tokenContext) {
  return blocks.map(block => ({ ...block, content: blockContent(block, 'full', tokenContext) }));
}

function orderDisplayBlocks(blocks) {
  const order = new Map([
    ['task-length', 10],
    ['voice-tone', 20],
    ['reading-level', 30],
    ['best-practice-pack', 40],
  ]);
  const sourceOrder = new Map([
    ['task', 10],
    ['voice', 20],
    ['reading', 30],
    ['pack', 40],
    ['generic', 50],
  ]);

  return blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const aOrder = order.get(a.block.id) ?? sourceOrder.get(a.block.source) ?? 90;
      const bOrder = order.get(b.block.id) ?? sourceOrder.get(b.block.source) ?? 90;
      return aOrder - bOrder || a.index - b.index;
    })
    .map(({ block }) => block);
}

function renderTemplate(template, tokens) {
  return template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, tokenName) => {
    if (!(tokenName in tokens) || tokens[tokenName] === undefined || tokens[tokenName] === null || tokens[tokenName] === '') {
      throw new Error(`Missing guidance template token: ${tokenName}`);
    }
    return String(tokens[tokenName]);
  });
}

function taskOpeningSentence(guidancePackage, tokenContext, guidanceTask) {
  const template = guidancePackage.outputTemplates?.taskOpenings?.[guidanceTask];
  if (!template) throw new Error(`Missing task opening template: ${guidanceTask}`);
  return renderTemplate(template, tokenContext);
}

function addTaskOpening(blocks, guidancePackage, tokenContext) {
  return blocks.map(block => {
    if (block.id !== 'task-length') return block;
    return { ...block, content: `${taskOpeningSentence(guidancePackage, tokenContext, block.guidanceTask)}\n\n${block.content}` };
  });
}

function renderFullGuidanceText(blocks) {
  return blocks.map(block => normalizeGuidanceText(block.content)).join('\n\n');
}

function normalizeGuidanceText(content) {
  return content
    .replace(/:\s+-\s+/g, ':\n- ')
    .replace(/\s+-\s+(?=(?:"|'|[A-Z][A-Za-z ]{1,40}:|[A-Za-z0-9]))/g, '\n- ');
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

function RadioGroup({ name, options, value, onChange, vertical }) {
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);
  const activeDesc = options.find(o => o.value === value)?.desc ?? '';

  const slideIndicator = useCallback(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const activeBtn = container.querySelector('.slu-wb__seg-btn.is-active');
    if (!activeBtn) { indicator.style.opacity = '0'; return; }
    const cr = container.getBoundingClientRect();
    const br = activeBtn.getBoundingClientRect();
    if (vertical) {
      indicator.style.height = `${br.height}px`;
      indicator.style.transform = `translateY(${br.top - cr.top}px)`;
    } else {
      indicator.style.width = `${br.width}px`;
      indicator.style.transform = `translateX(${br.left - cr.left}px)`;
    }
    indicator.style.opacity = '1';
  }, [vertical]);

  useEffect(() => { slideIndicator(); }, [value, slideIndicator]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(slideIndicator);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slideIndicator]);

  useEffect(() => {
    const raf = requestAnimationFrame(slideIndicator);
    return () => cancelAnimationFrame(raf);
  }, [slideIndicator]);

  const segmentedClass = 'slu-wb__segmented' + (vertical ? ' slu-wb__segmented--vertical' : '');

  return (
    <>
      <div className={segmentedClass} ref={containerRef} role="radiogroup">
        <span className="slu-wb__seg-indicator" ref={indicatorRef} aria-hidden="true" />
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`slu-wb__seg-btn${value === opt.value ? ' is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="slu-wb__seg-label">{opt.label}</span>
          </button>
        ))}
      </div>
      {activeDesc && <p className="slu-wb__seg-active-desc">{activeDesc}</p>}
    </>
  );
}

function SegmentedControl({ options, value, onChange }) {
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);
  const activeDesc = options.find(o => o.value === value)?.sub ?? '';

  const slideIndicator = useCallback(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const activeBtn = container.querySelector('.slu-wb__seg-btn.is-active');
    if (!activeBtn) { indicator.style.opacity = '0'; return; }
    const cr = container.getBoundingClientRect();
    const br = activeBtn.getBoundingClientRect();
    indicator.style.width = `${br.width}px`;
    indicator.style.transform = `translateX(${br.left - cr.left}px)`;
    indicator.style.opacity = '1';
  }, []);

  useEffect(() => { slideIndicator(); }, [value, slideIndicator]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(slideIndicator);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slideIndicator]);

  useEffect(() => {
    const raf = requestAnimationFrame(slideIndicator);
    return () => cancelAnimationFrame(raf);
  }, [slideIndicator]);

  return (
    <>
      <div className="slu-wb__segmented" ref={containerRef}>
        <span className="slu-wb__seg-indicator" ref={indicatorRef} aria-hidden="true" />
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`slu-wb__seg-btn${value === opt.value ? ' is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="slu-wb__seg-label">{opt.label}</span>
          </button>
        ))}
      </div>
      {activeDesc && <p className="slu-wb__seg-active-desc">{activeDesc}</p>}
    </>
  );
}

function ViewModeSwitch({ value, onChange }) {
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);

  const slideIndicator = useCallback(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const activeBtn = container.querySelector('.slu-wb__seg-btn.is-active');
    if (!activeBtn) { indicator.style.opacity = '0'; return; }
    const cr = container.getBoundingClientRect();
    const br = activeBtn.getBoundingClientRect();
    indicator.style.width = `${br.width}px`;
    indicator.style.transform = `translateX(${br.left - cr.left}px)`;
    indicator.style.opacity = '1';
  }, []);

  useEffect(() => { slideIndicator(); }, [value, slideIndicator]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(slideIndicator);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slideIndicator]);

  useEffect(() => {
    const raf = requestAnimationFrame(slideIndicator);
    return () => cancelAnimationFrame(raf);
  }, [slideIndicator]);

  return (
    <div className="slu-wb__segmented slu-wb__view-switch" ref={containerRef} role="group" aria-label="Guidance view mode">
      <span className="slu-wb__seg-indicator" ref={indicatorRef} aria-hidden="true" />
      {GUIDANCE_VIEW_MODES.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`slu-wb__seg-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          <span className="slu-wb__seg-label">{opt.label}</span>
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

function OutputContent({ content }) {
  const groups = normalizeGuidanceText(content).split(/\n{2,}/).map(group => group.trim()).filter(Boolean);

  return groups.map((group, groupIndex) => {
    const lines = group.split('\n').map(line => line.trim()).filter(Boolean);
    const chunks = [];
    let listItems = [];
    let paragraphLines = [];

    const flushParagraph = () => {
      if (!paragraphLines.length) return;
      chunks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
      paragraphLines = [];
    };

    const flushList = () => {
      if (!listItems.length) return;
      chunks.push({ type: 'list', items: listItems });
      listItems = [];
    };

    for (const line of lines) {
      const isListItem = line.startsWith('- ') || line.startsWith('• ') || /^\d+\.\s/.test(line);
      if (isListItem) {
        flushParagraph();
        listItems.push(line.replace(/^[-•]\s/, '').replace(/^\d+\.\s/, ''));
      } else {
        flushList();
        paragraphLines.push(line);
      }
    }

    flushParagraph();
    flushList();

    return chunks.map((chunk, chunkIndex) => {
      const key = `${groupIndex}-${chunkIndex}`;
      if (chunk.type === 'list') {
        return (
          <ul key={key} className="slu-wb__out-list">
            {chunk.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
          </ul>
        );
      }

      return <p key={key} className="slu-wb__out-p">{chunk.text}</p>;
    });
  });
}

function OutputDocument({ blocks }) {
  return (
    <article className="slu-wb__out-document" aria-label="Assembled guidance output">
      {blocks.map((block, i) => {
        const source = SOURCE_COLOR[block.source] ?? 'generic';

        return (
          <section key={`${block.id}-${i}`} className={`slu-wb__out-section slu-wb__out-section--${source}`} data-source={block.source}>
            <OutputContent content={block.content} />
          </section>
        );
      })}
    </article>
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

function WorkbenchLoadError({ message }) {
  return (
    <div className="rj-container slu-page">
      <div className="rj-alert rj-alert--warning">
        <i data-lucide="alert-triangle"></i>
        <span>{message}</span>
      </div>
    </div>
  );
}

function hasGuidancePackage(guidancePackage) {
  return Boolean(
    guidancePackage?.outputTemplates?.taskOpenings
    && guidancePackage?.readingLevelBlocks
    && guidancePackage?.taskLengthBlocks
    && Array.isArray(guidancePackage?.genericBlocks)
  );
}

function hasGuidanceArtifact(guidance) {
  return Boolean(
    guidance?.organization?.name
    && guidance?.organization?.shortName
    && guidance?.organization?.detectedType
    && guidance?.voiceTone?.previewSummary
    && guidance?.voiceTone?.fullGuidance
    && Array.isArray(guidance?.guidanceBlocks)
    && guidance.guidanceBlocks.every(block => block?.id && block?.label && block?.heading && block?.fullText)
  );
}

// ---- Main workbench component ----

function GuidanceWorkbenchInner({ data }) {
  const { guidance, savedOptions, bestPracticePacks, genericBlocks, guidancePackage } = data;

  const [guidanceTask, setGuidanceTask] = useState(savedOptions?.guidanceTask ?? 'write_new');
  const [lengthDetail, setLengthDetail] = useState(savedOptions?.lengthDetail ?? DEFAULT_LENGTH.write_new);
  const [readingLevel, setReadingLevel] = useState(savedOptions?.readingLevel ?? 'general_adult');
  const [bestPracticePack, setBestPracticePack] = useState(savedOptions?.bestPracticePack ?? 'none');
  const [guidanceViewMode, setGuidanceViewMode] = useState('preview');
  const [includedBlocks, setIncludedBlocks] = useState(() => {
    if (savedOptions?.includedBlocks) return new Set(savedOptions.includedBlocks);
    return getDefaultIncludedBlocks(guidance, guidancePackage);
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
  const orgName = guidance.organization.name;
  const tokenContext = getGuidanceTokenContext(guidance);
  const assembledBlocks = assembleBlocks(guidance, guidancePackage, selections, includedBlocks);
  const previewBlocks = addTaskOpening(orderDisplayBlocks(assemblePreviewBlocks(assembledBlocks, tokenContext)), guidancePackage, tokenContext);
  const fullDisplayBlocks = addTaskOpening(orderDisplayBlocks(assembleFullBlocks(assembledBlocks, tokenContext)), guidancePackage, tokenContext);
  const visibleBlocks = guidanceViewMode === 'full_guidance' ? fullDisplayBlocks : previewBlocks;
  const fullGuidanceText = renderFullGuidanceText(fullDisplayBlocks);
  const buildDownloadUrl = (format) => {
    const params = new URLSearchParams({
      format,
      guidanceTask,
      lengthDetail,
      readingLevel,
      bestPracticePack,
      includedBlocks: [...includedBlocks].join(','),
    });
    return `${data.downloadUrlBase}?${params.toString()}`;
  };

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
    try {
      await navigator.clipboard.writeText(fullGuidanceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden textarea
      const ta = document.getElementById('slu-wb-copy-fallback');
      if (ta) { ta.value = fullGuidanceText; ta.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
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

  const orgSummary = guidance.organization?.summary ?? '';

  return (
    <div className="slu-wb">
      {/* Controls panel */}
      <aside className="slu-wb__controls">
        <div className="slu-wb__controls-inner">

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
              vertical
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
          <div className="slu-wb__out-heading-row">
            <span className="slu-wb__out-meta">
              {guidanceViewMode === 'full_guidance' ? 'Full Guidance' : 'Preview'} · {visibleBlocks.length} section{visibleBlocks.length !== 1 ? 's' : ''}
            </span>
            <ViewModeSwitch value={guidanceViewMode} onChange={setGuidanceViewMode} />
          </div>

          {/* Assembled output */}
          {assembledBlocks.length === 0 ? (
            <div className="slu-wb__empty">
              <p>No guidance blocks are selected. Turn on blocks in the controls panel to build your output.</p>
            </div>
          ) : (
            <div className="slu-wb__out-blocks">
              <OutputDocument blocks={visibleBlocks} />
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

      {/* Output actions */}
      <aside className="slu-wb__actions" aria-label="Output actions">
        <div className="slu-wb__actions-card">
          <div>
            <p className="slu-wb__actions-title">Output</p>
          </div>
          <div className="slu-wb__out-btns">
            <button type="button" className="rj-btn rj-btn--secondary rj-btn--sm" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy full guidance'}
            </button>
            <a href={buildDownloadUrl('txt')} className="rj-btn rj-btn--ghost rj-btn--sm" download>
              Download .txt
            </a>
            <a href={buildDownloadUrl('md')} className="rj-btn rj-btn--ghost rj-btn--sm" download>
              Download .md
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function GuidanceWorkbench({ data }) {
  if (!data?.guidance) {
    return <WorkbenchLoadError message="The guidance workbench could not load the guidance data for this analysis." />;
  }

  if (!hasGuidanceArtifact(data.guidance)) {
    return <WorkbenchLoadError message="The guidance workbench could not load a complete guidance artifact for this analysis. Please regenerate the analysis." />;
  }

  if (!hasGuidancePackage(data.guidancePackage)) {
    return <WorkbenchLoadError message="The guidance workbench could not load its guidance configuration. Please refresh after the app finishes restarting." />;
  }

  return <GuidanceWorkbenchInner data={data} />;
}

// ---- Mount ----

const root = document.getElementById('guidance-workbench-root');
const data = window.__WORKBENCH_DATA__;

if (root && data) {
  createRoot(root).render(<GuidanceWorkbench data={data} />);
}
