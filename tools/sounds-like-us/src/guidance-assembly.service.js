// Guidance assembly — pure function, no AI calls, no DB.
// Used by server download routes; the React island mirrors this assembly logic
// using the validated config package included in its initial page data.

import {
  OUTPUT_TEMPLATES,
  READING_LEVEL_BLOCKS,
  TASK_LENGTH_BLOCKS,
  GENERIC_BLOCKS,
} from './guidance-blocks.config.js';

import { BEST_PRACTICE_PACKS_MAP } from './best-practice-packs.config.js';
import { renderTemplate } from './config/config-loader.js';

// Returns an ordered array of assembled block objects: { id, label, heading, previewText, fullText, source }
// All blocks whose IDs are in `includedBlockIds` (Set or Array) are included.
export function assembleBlocks(guidance, selections, includedBlockIds) {
  const included = new Set(includedBlockIds);
  const {
    guidanceTask = 'write_new',
    lengthDetail = 'standard_article',
    readingLevel = 'general_adult',
    bestPracticePack = 'none',
  } = selections;

  const blocks = [];

  // ---- 1. Org-specific blocks (from AI analysis) ----
  for (const block of guidance.guidanceBlocks ?? []) {
    if (included.has(block.id)) {
      const voiceToneFields = block.id === 'voice-tone'
        ? {
            previewText: guidance.voiceTone?.previewSummary,
            fullText: guidance.voiceTone?.fullGuidance,
          }
        : {};
      blocks.push({ ...block, ...voiceToneFields, source: block.source ?? 'voice' });
    }
  }

  // ---- 2. Task + length/detail block ----
  const taskBlocks = TASK_LENGTH_BLOCKS[guidanceTask];
  if (taskBlocks) {
    const taskLengthBlock = taskBlocks[lengthDetail];
    if (taskLengthBlock) {
      blocks.push({ ...taskLengthBlock, id: 'task-length', label: 'Guidance task', guidanceTask });
    }
  }

  // ---- 3. Reading level block ----
  if (included.has('reading-level')) {
    const rlBlock = READING_LEVEL_BLOCKS[readingLevel];
    if (rlBlock) blocks.push({ ...rlBlock, id: 'reading-level', label: 'Reading level' });
  }

  // ---- 4. Generic blocks ----
  for (const block of GENERIC_BLOCKS) {
    if (included.has(block.id)) {
      blocks.push({ ...block });
    }
  }

  // ---- 5. Best-practice pack block ----
  if (bestPracticePack !== 'none') {
    const pack = BEST_PRACTICE_PACKS_MAP[bestPracticePack];
    if (pack && included.has('best-practice-pack')) {
      blocks.push({ id: 'best-practice-pack', label: pack.label, ...pack });
    }
  }

  return blocks;
}

// Returns the default set of included block IDs for a given guidance object.
export function defaultIncludedBlocks(guidance) {
  const ids = new Set();

  // All org-specific blocks default to included if they set defaultIncluded: true
  for (const b of guidance.guidanceBlocks ?? []) {
    if (b.defaultIncluded !== false) ids.add(b.id);
  }

  // Reading level: included by default
  ids.add('reading-level');

  // Task-length block: always assembled from selections (not toggled separately)
  // Best-practice pack: assembled from selections (not toggled separately)

  // Generic blocks: use their individual defaultIncluded flag
  for (const b of GENERIC_BLOCKS) {
    if (b.defaultIncluded) ids.add(b.id);
  }

  return ids;
}

function orderAssembledBlocks(blocks) {
  const blockOrder = new Map([
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
      const aOrder = blockOrder.get(a.block.id) ?? sourceOrder.get(a.block.source) ?? 90;
      const bOrder = blockOrder.get(b.block.id) ?? sourceOrder.get(b.block.source) ?? 90;
      return aOrder - bOrder || a.index - b.index;
    })
    .map(({ block }) => block);
}

function taskOpeningFromBlock(tokenContext, block) {
  const template = OUTPUT_TEMPLATES.taskOpenings[block.guidanceTask];
  if (!template) {
    throw new Error(`Missing task opening template: ${block.guidanceTask}`);
  }
  return renderTemplate(template, tokenContext);
}

function addTaskOpening(tokenContext, blocks) {
  return blocks.map(block => {
    if (block.id !== 'task-length') return block;
    return { ...block, content: `${taskOpeningFromBlock(tokenContext, block)}\n\n${block.content}` };
  });
}

function guidanceTokenContext(guidance) {
  return {
    organizationName: guidance.organization.name,
    organizationShortName: guidance.organization.shortName,
    detectedOrganizationType: guidance.organization.detectedType,
    voiceTonePreviewSummary: guidance.voiceTone.previewSummary,
    voiceToneFullGuidance: guidance.voiceTone.fullGuidance,
  };
}

function renderBlockText(block, tokenContext) {
  if (typeof block.fullText !== 'string' || !block.fullText.trim()) {
    throw new Error(`Missing fullText for guidance block ${block.id}.`);
  }
  return renderTemplate(block.fullText, tokenContext);
}

function normalizeGuidanceText(content) {
  return content
    .replace(/:\s+-\s+/g, ':\n- ')
    .replace(/\s+-\s+(?=(?:"|'|[A-Z][A-Za-z ]{1,40}:|[A-Za-z0-9]))/g, '\n- ');
}

// Render assembled blocks to plain text.
export function renderPlainText(guidance, blocks) {
  const tokenContext = guidanceTokenContext(guidance);
  return addTaskOpening(tokenContext, orderAssembledBlocks(blocks).map(block => ({ ...block, content: renderBlockText(block, tokenContext) })))
    .map(block => normalizeGuidanceText(block.content))
    .join('\n\n');
}

// Render assembled blocks to Markdown.
export function renderMarkdown(guidance, blocks) {
  const tokenContext = guidanceTokenContext(guidance);
  return addTaskOpening(tokenContext, orderAssembledBlocks(blocks).map(block => ({ ...block, content: renderBlockText(block, tokenContext) })))
    .map(block => normalizeGuidanceText(block.content))
    .join('\n\n');
}
