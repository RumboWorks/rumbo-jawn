import * as cheerio from 'cheerio';

const DEFAULT_MAX_PAGES = 8;
const DEFAULT_TIMEOUT_MS = 10000;

// ---- Main entry point ----

export async function crawlUrl(startUrl, { maxPages = DEFAULT_MAX_PAGES } = {}) {
  const base = normalizeUrl(startUrl);
  const baseOrigin = new URL(base).origin;

  const visited = new Set();
  const queue = [base];
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    const page = await fetchPage(url);
    if (!page) continue;

    pages.push(page);

    // Enqueue same-origin links not yet visited
    for (const link of page.links) {
      if (!visited.has(link) && link.startsWith(baseOrigin)) {
        queue.push(link);
      }
    }
  }

  return pages;
}

// ---- Fetch and parse a single page ----

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RumboWorks/1.0 (+https://rumboworks.com/about/crawler)' },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      redirect: 'follow',
    });

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    return parsePage(url, html);
  } catch {
    return null;
  }
}

// ---- Parse HTML → { url, title, text, links } ----

function parsePage(url, html) {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header, aside, [aria-hidden="true"], .sr-only').remove();

  const title = $('title').first().text().trim()
    || $('h1').first().text().trim()
    || url;

  // Extract meaningful text blocks
  const textBlocks = [];
  $('h1, h2, h3, h4, p, li, blockquote, figcaption').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length > 20) textBlocks.push(t);
  });
  const text = textBlocks.join('\n');

  // Collect same-origin absolute links
  const baseOrigin = new URL(url).origin;
  const links = [];
  $('a[href]').each((_, el) => {
    try {
      const href = new URL($(el).attr('href'), url).href;
      // Skip anchors, query strings that look like search/filter, non-http
      if (href.startsWith(baseOrigin) && !href.includes('#') && !links.includes(href)) {
        links.push(href);
      }
    } catch { /* malformed href */ }
  });

  return { url, title, text, links };
}

// ---- Helpers ----

function normalizeUrl(raw) {
  const s = raw.trim();
  return s.startsWith('http') ? s : `https://${s}`;
}

// ---- Estimate token count (rough: 1 token ≈ 4 chars) ----
export function estimateTokens(pages) {
  return Math.ceil(pages.reduce((n, p) => n + p.text.length, 0) / 4);
}

// ---- Truncate page content to stay within token budget ----
export function truncatePagesForPrompt(pages, maxTokens = 12000) {
  const budget = maxTokens * 4; // chars
  const out = [];
  let used = 0;
  for (const p of pages) {
    if (used >= budget) break;
    const remaining = budget - used;
    out.push({ ...p, text: p.text.slice(0, remaining) });
    used += Math.min(p.text.length, remaining);
  }
  return out;
}
