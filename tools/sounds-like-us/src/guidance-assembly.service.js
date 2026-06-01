// Guidance assembly — pure function, no AI calls, no DB.
// Used by both the server (download routes) and bundled into the React island.
// Imports from config files that are plain JS, no Node-only APIs.

import {
  READING_LEVEL_BLOCKS,
  TASK_LENGTH_BLOCKS,
  GENERIC_BLOCKS,
} from './guidance-blocks.config.js';

import { BEST_PRACTICE_PACKS_MAP } from './best-practice-packs.config.js';

// Returns an ordered array of assembled block objects: { id, label, heading, content, source }
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
            content: guidance.voiceTone?.fullGuidance ?? block.content,
            previewContent: block.previewContent ?? guidance.voiceTone?.previewSummary ?? guidance.voiceProfile?.summary ?? block.content,
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
      blocks.push({ id: 'task-length', label: 'Guidance task', ...taskLengthBlock });
    }
  }

  // ---- 3. Reading level block ----
  if (included.has('reading-level')) {
    const rlBlock = READING_LEVEL_BLOCKS[readingLevel];
    if (rlBlock) blocks.push({ ...rlBlock });
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

// Render assembled blocks to plain text.
export function renderPlainText(orgName, blocks) {
  const lines = [
    `Writing Guidance — ${orgName}`,
    '='.repeat(50),
    '',
  ];
  for (const block of blocks) {
    lines.push(block.heading ?? block.label);
    lines.push('-'.repeat(30));
    lines.push(block.content);
    lines.push('');
  }
  return lines.join('\n');
}

// Render assembled blocks to Markdown.
export function renderMarkdown(orgName, blocks) {
  const lines = [
    `# Writing Guidance — ${orgName}`,
    '',
  ];
  for (const block of blocks) {
    lines.push(`## ${block.heading ?? block.label}`);
    lines.push('');
    lines.push(block.content);
    lines.push('');
  }
  return lines.join('\n');
}
