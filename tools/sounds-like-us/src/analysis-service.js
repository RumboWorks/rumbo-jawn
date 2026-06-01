import { crawlUrl, truncatePagesForPrompt } from '@rumbo/crawler';
import { aiCall } from '@rumbo/ai';
import { writeArtifact, artifactPath } from '@rumbo/storage';

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

// Backward-compat: transform the old Phase 04 flat guidance format into the v1 structure.
function transformLegacyGuidance(legacy, { url, pageCount, jobId }) {
  const g = legacy;
  const previewSummary = g.voice_tone?.description ?? '';
  const fullGuidance = [
    g.voice_tone?.description ?? '',
    g.voice_tone?.markers?.length
      ? `Style markers: ${g.voice_tone.markers.join(', ')}.`
      : '',
    g.voice_tone?.examples?.length
      ? `Examples from their writing: ${g.voice_tone.examples.map(e => `"${e}"`).join('; ')}.`
      : '',
    g.writing_guidance ?? '',
  ].filter(Boolean).join('\n\n');

  return {
    version: 'sounds-like-us.guidance.v1',
    runId: jobId,
    organization: {
      name: g.org_name ?? 'Unknown',
      detectedType: 'unknown',
      summary: g.org_summary ?? '',
    },
    sourceBasis: {
      urls: [url],
      documents: [],
      pageCount,
      notes: ['Transformed from legacy Phase 04 format — guidanceBlocks regenerated from flat fields.'],
    },
    voiceTone: {
      previewSummary,
      fullGuidance,
    },
    voiceProfile: {
      summary: previewSummary,
      toneAttributes: g.voice_tone?.markers ?? [],
      writingPatterns: g.voice_tone?.examples ?? [],
      vocabulary: g.key_vocabulary ?? [],
      phrases: g.phrases_to_use ?? [],
      avoid: g.what_to_avoid ?? [],
      audienceNotes: [],
    },
    guidanceBlocks: [
      {
        id: 'voice-tone',
        label: 'Voice and tone',
        source: 'voice',
        defaultIncluded: true,
        heading: 'Voice and tone',
        previewContent: previewSummary,
        content: fullGuidance,
      },
      {
        id: 'vocabulary',
        label: 'Words and phrases to use',
        source: 'voice',
        defaultIncluded: true,
        heading: 'Words and phrases to use',
        content: [
          g.phrases_to_use?.length
            ? `Preferred phrases:\n${g.phrases_to_use.map(p => `- ${p}`).join('\n')}`
            : '',
          g.key_vocabulary?.length
            ? `Key vocabulary:\n${g.key_vocabulary.map(v => `- ${v}`).join('\n')}`
            : '',
        ].filter(Boolean).join('\n\n'),
      },
      {
        id: 'what-to-avoid',
        label: 'What to avoid',
        source: 'voice',
        defaultIncluded: true,
        heading: 'What to avoid',
        content: g.what_to_avoid?.length
          ? `Avoid the following — they would clash with this organization's voice:\n${g.what_to_avoid.map(v => `- ${v}`).join('\n')}`
          : 'No specific avoidances identified.',
      },
    ],
    generatedAt: new Date().toISOString(),
    modelInfo: { provider: 'unknown', model: 'unknown' },
  };
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

  const systemPrompt = `You are an expert communications analyst helping nonprofit and mission-driven organizations develop reusable writing guidance.

Analyze the provided website content and produce a structured JSON guidance profile. Be specific, actionable, and grounded in the actual text. Avoid generic advice.

Return ONLY valid JSON with no markdown fences or commentary. All arrays must contain plain JSON strings only. If a list item needs a note, put the note inside the same quoted string. Never place parenthetical notes outside quotes.`;

  const userMessage = `Analyze this organization's website content and return a structured JSON guidance profile.

URL analyzed: ${url}

Content from ${pages.length} page(s):
${pagesSummary}

Return this exact JSON structure (no markdown fences, pure JSON). Use strict valid JSON: double-quoted keys, double-quoted string values, no comments, no trailing commas, and no parenthetical notes outside strings:
{
  "org_name": "inferred organization name",
  "org_type": "nonprofit | school | foundation | public_agency | association | unknown",
  "org_summary": "2-3 sentence summary of who they are and what they do",
  "voiceTone": {
    "previewSummary": "Concise 1-3 sentence voice/tone preview summary for Preview mode. Do not just repeat or truncate the full guidance.",
    "fullGuidance": "Longer, detailed 2-4 paragraph voice/tone guidance for Full Guidance mode and copy/download output. Be specific — reference their actual style."
  },
  "voice_profile": {
    "summary": "overall voice and tone characterization (2-3 sentences)",
    "tone_attributes": ["Warm", "Plainspoken", "Hopeful"],
    "writing_patterns": ["Uses concrete local examples", "Opens paragraphs with 'we' statements"],
    "vocabulary": ["neighbors", "watershed", "together"],
    "phrases": ["for generations", "your river", "protect what matters"],
    "avoid": ["leverage", "synergy", "disrupt", "stakeholders", "utilize"],
    "audience_notes": ["Speaks to supporters as neighbors and collaborators"]
  },
  "guidance_blocks": [
    {
      "id": "voice-tone",
      "label": "Voice and tone",
      "heading": "Voice and tone",
      "content": "Use the same detailed text as voiceTone.fullGuidance."
    },
    {
      "id": "vocabulary",
      "label": "Words and phrases to use",
      "heading": "Words and phrases to use",
      "content": "A formatted list of specific words, phrases, and constructions that fit their voice. Group by type if helpful (preferred phrases, key vocabulary, sentence starters)."
    },
    {
      "id": "what-to-avoid",
      "label": "What to avoid",
      "heading": "What to avoid",
      "content": "A formatted list of specific things to avoid — words, phrases, tones, or patterns that would clash with this organization's voice. Be specific."
    }
  ]
}`;

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

  // Normalise the AI output into the v1 guidance object
  const vp = parsed.voice_profile ?? {};
  const voiceTone = parsed.voiceTone ?? parsed.voice_tone ?? {};
  const parsedGuidanceBlocks = parsed.guidance_blocks ?? [];
  const voiceToneBlock = parsedGuidanceBlocks.find(b => b.id === 'voice-tone');
  const previewSummary = voiceTone.previewSummary ?? voiceTone.preview_summary ?? vp.summary ?? '';
  const fullGuidance = voiceTone.fullGuidance ?? voiceTone.full_guidance ?? voiceToneBlock?.content ?? vp.summary ?? '';
  const guidanceBlocks = parsedGuidanceBlocks.some(b => b.id === 'voice-tone')
    ? parsedGuidanceBlocks
    : [
        {
          id: 'voice-tone',
          label: 'Voice and tone',
          heading: 'Voice and tone',
          content: fullGuidance,
        },
        ...parsedGuidanceBlocks,
      ];
  const guidanceV1 = {
    version: 'sounds-like-us.guidance.v1',
    runId: job.id,
    organization: {
      name: parsed.org_name ?? 'Unknown',
      detectedType: parsed.org_type ?? 'unknown',
      summary: parsed.org_summary ?? '',
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
      toneAttributes: vp.tone_attributes ?? [],
      writingPatterns: vp.writing_patterns ?? [],
      vocabulary: vp.vocabulary ?? [],
      phrases: vp.phrases ?? [],
      avoid: vp.avoid ?? [],
      audienceNotes: vp.audience_notes ?? [],
    },
    guidanceBlocks: guidanceBlocks.map(b => {
      if (b.id === 'voice-tone') {
        return {
          ...b,
          content: fullGuidance,
          previewContent: previewSummary,
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
    orgSummary: guidanceV1.organization.summary,
    guidancePath,
    pageCount:  pages.length,
    guidanceVersion: 'v1',
  };
}

export { transformLegacyGuidance };
