import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));

let guidancePackage = null;
let bestPracticePacks = null;
let analysisPrompts = null;

const GUIDANCE_TOKENS = new Set([
  'organizationName',
  'organizationShortName',
  'detectedOrganizationType',
  'voiceTonePreviewSummary',
  'voiceToneFullGuidance',
]);

function readJsonConfig(relativePath) {
  const fullPath = path.join(CONFIG_DIR, relativePath);
  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid Sounds Like Us config at ${relativePath}: ${err.message}`);
  }

  return parsed;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid Sounds Like Us config: ${label} must be an object.`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid Sounds Like Us config: ${label} must be an array.`);
  }
}

function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid Sounds Like Us config: ${label} must be a non-empty string.`);
  }
}

function tokensIn(text) {
  return [...String(text).matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].map(match => match[1]);
}

function validateGuidanceTokens(text, label) {
  for (const token of tokensIn(text)) {
    if (!GUIDANCE_TOKENS.has(token)) {
      throw new Error(`Invalid Sounds Like Us config: ${label} uses unsupported token {{${token}}}.`);
    }
  }
}

function assertUniqueId(id, label, seen) {
  if (seen.has(id)) {
    throw new Error(`Invalid Sounds Like Us config: duplicate id "${id}" at ${label}.`);
  }
  seen.add(id);
}

function validateBlock(block, label) {
  assertObject(block, label);
  assertString(block.id, `${label}.id`);
  assertString(block.label, `${label}.label`);
  assertString(block.source, `${label}.source`);
  assertString(block.heading, `${label}.heading`);
  assertString(block.previewText, `${label}.previewText`);
  assertString(block.fullText, `${label}.fullText`);
  validateGuidanceTokens(block.previewText, `${label}.previewText`);
  validateGuidanceTokens(block.fullText, `${label}.fullText`);
}

function validateGuidancePackage(config) {
  assertObject(config, 'guidance package');
  assertString(config.version, 'guidance package.version');
  assertObject(config.constants, 'guidance package constants');
  for (const key of ['guidanceTask', 'readingLevel', 'writeLength', 'rewriteLength', 'critiqueDepth']) {
    assertObject(config.constants[key], `guidance package constants.${key}`);
  }
  assertObject(config.outputTemplates?.taskOpenings, 'guidance package outputTemplates.taskOpenings');
  for (const key of Object.values(config.constants.guidanceTask ?? {})) {
    assertString(config.outputTemplates.taskOpenings[key], `guidance package task opening ${key}`);
    validateGuidanceTokens(config.outputTemplates.taskOpenings[key], `guidance package task opening ${key}`);
  }

  assertObject(config.generatedGuidanceBlocks, 'guidance package generatedGuidanceBlocks');
  validateBlock(config.generatedGuidanceBlocks.voiceTone, 'guidance package generatedGuidanceBlocks.voiceTone');

  assertObject(config.readingLevelBlocks, 'guidance package readingLevelBlocks');
  const readingLevelIds = new Set();
  for (const [id, block] of Object.entries(config.readingLevelBlocks)) {
    if (!Object.values(config.constants.readingLevel ?? {}).includes(id)) {
      throw new Error(`Invalid Sounds Like Us config: readingLevelBlocks.${id} is not declared in constants.readingLevel.`);
    }
    validateBlock(block, `readingLevelBlocks.${id}`);
    assertUniqueId(block.id, `readingLevelBlocks.${id}.id`, readingLevelIds);
  }

  assertObject(config.taskLengthBlocks, 'guidance package taskLengthBlocks');
  const taskBlockIds = new Set();
  const allowedLengthByTask = {
    write_new: new Set(Object.values(config.constants.writeLength)),
    rewrite_existing: new Set(Object.values(config.constants.rewriteLength)),
    critique_existing: new Set(Object.values(config.constants.critiqueDepth)),
  };
  for (const [task, lengthBlocks] of Object.entries(config.taskLengthBlocks)) {
    if (!Object.values(config.constants.guidanceTask ?? {}).includes(task)) {
      throw new Error(`Invalid Sounds Like Us config: taskLengthBlocks.${task} is not declared in constants.guidanceTask.`);
    }
    assertObject(lengthBlocks, `taskLengthBlocks.${task}`);
    for (const [length, block] of Object.entries(lengthBlocks)) {
      if (!allowedLengthByTask[task]?.has(length)) {
        throw new Error(`Invalid Sounds Like Us config: taskLengthBlocks.${task}.${length} is not declared in constants.`);
      }
      validateBlock(block, `taskLengthBlocks.${task}.${length}`);
      assertUniqueId(block.id, `taskLengthBlocks.${task}.${length}.id`, taskBlockIds);
    }
  }

  assertArray(config.genericBlocks, 'guidance package genericBlocks');
  const genericBlockIds = new Set();
  config.genericBlocks.forEach((block, index) => {
    validateBlock(block, `genericBlocks[${index}]`);
    assertUniqueId(block.id, `genericBlocks[${index}].id`, genericBlockIds);
  });
}

function validateBestPracticePacks(config) {
  assertObject(config, 'best practice packs');
  assertString(config.version, 'best practice packs.version');
  assertArray(config.packs, 'best practice packs.packs');
  const packIds = new Set();
  config.packs.forEach((pack, index) => {
    assertObject(pack, `best practice packs[${index}]`);
    assertString(pack.id, `best practice packs[${index}].id`);
    assertString(pack.label, `best practice packs[${index}].label`);
    assertUniqueId(pack.id, `best practice packs[${index}].id`, packIds);
    if (pack.id !== 'none') {
      assertString(pack.source, `best practice packs[${index}].source`);
      assertString(pack.heading, `best practice packs[${index}].heading`);
      assertString(pack.previewText, `best practice packs[${index}].previewText`);
      assertString(pack.fullText, `best practice packs[${index}].fullText`);
      validateGuidanceTokens(pack.previewText, `best practice packs[${index}].previewText`);
      validateGuidanceTokens(pack.fullText, `best practice packs[${index}].fullText`);
    }
  });
}

function validateAnalysisPrompts(config) {
  assertObject(config, 'analysis prompts');
  assertString(config.version, 'analysis prompts.version');
  assertObject(config.analysis, 'analysis prompts.analysis');
  assertString(config.analysis.system, 'analysis prompts.analysis.system');
  assertString(config.analysis.userTemplate, 'analysis prompts.analysis.userTemplate');
  for (const token of ['{{url}}', '{{pageCount}}', '{{pagesSummary}}']) {
    if (!config.analysis.userTemplate.includes(token)) {
      throw new Error(`Invalid Sounds Like Us config: analysis userTemplate must include ${token}.`);
    }
  }
  for (const field of ['"org_name"', '"org_short_name"', '"org_type"', '"voiceTone"', '"guidance_blocks"']) {
    if (!config.analysis.userTemplate.includes(field)) {
      throw new Error(`Invalid Sounds Like Us config: analysis userTemplate must define ${field}.`);
    }
  }
}

export function getGuidancePackage() {
  if (!guidancePackage) {
    guidancePackage = readJsonConfig('guidance/default-guidance-package.json');
    validateGuidancePackage(guidancePackage);
  }
  return guidancePackage;
}

export function getBestPracticePacksPackage() {
  if (!bestPracticePacks) {
    bestPracticePacks = readJsonConfig('guidance/best-practice-packs.json');
    validateBestPracticePacks(bestPracticePacks);
  }
  return bestPracticePacks;
}

export function getAnalysisPrompts() {
  if (!analysisPrompts) {
    analysisPrompts = readJsonConfig('prompts/analysis-prompts.json');
    validateAnalysisPrompts(analysisPrompts);
  }
  return analysisPrompts;
}

export function renderTemplate(template, tokens) {
  return template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, tokenName) => {
    if (!(tokenName in tokens) || tokens[tokenName] === undefined || tokens[tokenName] === null || tokens[tokenName] === '') {
      throw new Error(`Missing template token: ${tokenName}`);
    }
    return String(tokens[tokenName]);
  });
}
