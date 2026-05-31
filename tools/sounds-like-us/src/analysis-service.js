import { crawlUrl, truncatePagesForPrompt } from '@rumbo/crawler';
import { aiCall } from '@rumbo/ai';
import { writeArtifact, artifactPath } from '@rumbo/storage';

const MAX_CRAWL_PAGES = 8;

export async function runAnalysis(job) {
  const { url } = job.payload;

  // ---- 1. Crawl ----
  const rawPages = await crawlUrl(url, { maxPages: MAX_CRAWL_PAGES });
  const pages = truncatePagesForPrompt(rawPages, 12000);

  // Store raw crawl artifact
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

Return ONLY valid JSON with no markdown fences or commentary.`;

  const userMessage = `Analyze this organization's website content and return a JSON guidance profile.

URL analyzed: ${url}

Content from ${pages.length} page(s):
${pagesSummary}

Return this exact JSON structure:
{
  "org_name": "inferred organization name",
  "org_summary": "2-3 sentence summary of who they are and what they do",
  "voice_tone": {
    "description": "overall voice and tone characterization (2-3 sentences)",
    "markers": ["specific observable style marker", "another marker"],
    "examples": ["brief quoted example from the text", "another example"]
  },
  "key_vocabulary": ["word or short phrase central to their identity", "another term"],
  "phrases_to_use": ["phrase that fits their voice", "another phrase"],
  "what_to_avoid": ["thing that would clash with their voice", "another thing to avoid"],
  "writing_guidance": "1-2 paragraph practical guidance for someone writing on behalf of this org",
  "rewrite_prompt": "A system prompt a writer or AI tool could use to match this organization's voice"
}`;

  // ---- 3. AI analysis ----
  const raw = await aiCall({
    callType: 'guidance.generate',
    messages: [{ role: 'user', content: userMessage }],
    systemPrompt,
    jobId: job.id,
  });

  // Parse and validate the JSON response
  let guidance;
  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    guidance = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON. Raw response saved for debugging.');
  }

  // ---- 4. Store guidance artifact ----
  const guidancePath = artifactPath('slu/guidance', job.id, 'guidance.json');
  await writeArtifact({
    jobId: job.id,
    type: 'slu.guidance',
    relativePath: guidancePath,
    content: JSON.stringify({
      url,
      analyzedAt: new Date().toISOString(),
      pageCount: pages.length,
      guidance,
    }, null, 2),
  });

  return {
    url,
    orgName:       guidance.org_name,
    orgSummary:    guidance.org_summary,
    guidancePath,
    pageCount:     pages.length,
  };
}
