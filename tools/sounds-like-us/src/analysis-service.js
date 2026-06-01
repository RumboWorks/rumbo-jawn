import { crawlUrl, truncatePagesForPrompt } from '@rumbo/crawler';
import { aiCall } from '@rumbo/ai';
import { writeArtifact, artifactPath } from '@rumbo/storage';
import { getAnalysisPrompts, getGuidancePackage, renderTemplate } from './config/config-loader.js';

const MAX_CRAWL_PAGES = 8;

export function parseGuidanceJson(raw) {
  const text = String(raw ?? '').trim().replace(/^\uFEFF/, '');
  const candidates = [text];
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let fenceMatch;

  while ((fenceMatch = fencePattern.exec(text)) !== null) {
    candidates.push(fenceMatch[1].trim());
  }

  const objectText = extractFirstJsonObject(text);
  if (objectText) candidates.push(objectText);

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(repairJsonLikeText(candidate));
      } catch {
        // Try the next candidate shape.
      }
    }
  }

  throw new Error('AI returned invalid JSON for guidance profile.');
}

function extractFirstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function repairJsonLikeText(text) {
  return text.replace(/(?<!\\)"([^"\n]+)"\s+\(([^()\n]*)\)"?/g, (_, value, note) => {
    const escapedNote = note.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${value} (${escapedNote})"`;
  });
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`AI guidance response is missing ${label}.`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`AI guidance response is missing ${label}.`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`AI guidance response is missing ${label}.`);
  }
}

function validateParsedGuidance(parsed) {
  requireObject(parsed, 'root object');
  for (const field of ['org_name', 'org_short_name', 'org_type', 'org_summary']) {
    requireString(parsed[field], field);
  }

  requireObject(parsed.voiceTone, 'voiceTone');
  requireString(parsed.voiceTone.previewSummary, 'voiceTone.previewSummary');
  requireString(parsed.voiceTone.fullGuidance, 'voiceTone.fullGuidance');

  requireObject(parsed.voice_profile, 'voice_profile');
  for (const field of ['tone_attributes', 'writing_patterns', 'vocabulary', 'phrases', 'avoid', 'audience_notes']) {
    requireArray(parsed.voice_profile[field], `voice_profile.${field}`);
  }

  requireArray(parsed.guidance_blocks, 'guidance_blocks');
  for (const [index, block] of parsed.guidance_blocks.entries()) {
    requireObject(block, `guidance_blocks[${index}]`);
    for (const field of ['id', 'label', 'heading', 'fullText']) {
      requireString(block[field], `guidance_blocks[${index}].${field}`);
    }
    if (block.id === 'voice-tone') {
      requireString(block.previewText, `guidance_blocks[${index}].previewText`);
    }
  }

  if (!parsed.guidance_blocks.some(block => block.id === 'voice-tone')) {
    throw new Error('AI guidance response is missing guidance_blocks entry with id "voice-tone".');
  }
}

export async function runAnalysis(job) {
  const { url } = job.payload;

  // ---- 1. Crawl ----
  const rawPages = await crawlUrl(url, { maxPages: MAX_CRAWL_PAGES });
  const pages = truncatePagesForPrompt(rawPages, 12000);

  await writeArtifact({
    jobId: job.id,
    type: 'slu.crawl.raw',
    relativePath: artifactPath('slu/crawl', job.id, 'pages.json'),
    content: JSON.stringify({ url, crawledAt: new Date().toISOString(), pages: rawPages }, null, 2),
  });

  if (pages.length === 0) {
    throw new Error(`No content could be fetched from: ${url}`);
  }

  // ---- 2. Build prompt ----
  const pagesSummary = pages
    .map((p, i) => `--- Page ${i + 1}: ${p.title}\nURL: ${p.url}\n\n${p.text}`)
    .join('\n\n');

  const promptConfig = getAnalysisPrompts().analysis;
  const systemPrompt = promptConfig.system;
  const userMessage = renderTemplate(promptConfig.userTemplate, {
    url,
    pageCount: pages.length,
    pagesSummary,
  });

  // ---- 3. AI analysis ----
  const raw = await aiCall({
    callType: 'guidance.generate',
    messages: [{ role: 'user', content: userMessage }],
    systemPrompt,
    jobId: job.id,
  });

  let parsed;
  try {
    parsed = parseGuidanceJson(raw);
  } catch (err) {
    await writeArtifact({
      jobId: job.id,
      type: 'slu.guidance.parse_error',
      relativePath: artifactPath('slu/guidance-errors', job.id, `raw-${Date.now()}.txt`),
      content: raw,
    });
    throw err;
  }

  validateParsedGuidance(parsed);

  // Normalise the AI output into the v1 guidance object
  const vp = parsed.voice_profile;
  const voiceTone = parsed.voiceTone;
  const parsedGuidanceBlocks = parsed.guidance_blocks;
  const previewSummary = voiceTone.previewSummary;
  const fullGuidance = voiceTone.fullGuidance;
  const generatedBlocks = getGuidancePackage().generatedGuidanceBlocks;
  const guidanceV1 = {
    version: 'sounds-like-us.guidance.v1',
    runId: job.id,
    organization: {
      name: parsed.org_name,
      shortName: parsed.org_short_name,
      detectedType: parsed.org_type,
      summary: parsed.org_summary,
    },
    sourceBasis: {
      urls: [url],
      documents: [],
      pageCount: pages.length,
      notes: [],
    },
    voiceTone: {
      previewSummary,
      fullGuidance,
    },
    voiceProfile: {
      summary: previewSummary,
      toneAttributes: vp.tone_attributes,
      writingPatterns: vp.writing_patterns,
      vocabulary: vp.vocabulary,
      phrases: vp.phrases,
      avoid: vp.avoid,
      audienceNotes: vp.audience_notes,
    },
    guidanceBlocks: parsedGuidanceBlocks.map(b => {
      if (b.id === 'voice-tone') {
        return {
          ...generatedBlocks.voiceTone,
          ...b,
          previewText: previewSummary,
          fullText: fullGuidance,
          source: 'voice',
          defaultIncluded: true,
        };
      }

      return {
        ...b,
        source: 'voice',
        defaultIncluded: true,
      };
    }),
    generatedAt: new Date().toISOString(),
    modelInfo: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  };

  // ---- 4. Store guidance artifact ----
  const guidancePath = artifactPath('slu/guidance', job.id, 'guidance.json');
  await writeArtifact({
    jobId: job.id,
    type: 'slu.guidance',
    relativePath: guidancePath,
    content: JSON.stringify(guidanceV1, null, 2),
  });

  return {
    url,
    orgName:    guidanceV1.organization.name,
    orgShortName: guidanceV1.organization.shortName,
    orgSummary: guidanceV1.organization.summary,
    guidancePath,
    pageCount:  pages.length,
    guidanceVersion: 'v1',
  };
}
