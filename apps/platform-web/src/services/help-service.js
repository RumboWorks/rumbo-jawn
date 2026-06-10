// Help & FAQ content: DB-backed articles editable by platform admins.
// Published articles power the /help pages and the context-sensitive drawer.

import { db } from '@rumbo/db';
import { renderMarkdown } from '@rumbo/markdown';
import { isToolKey } from '@rumbo/config';

function withHtml(article) {
  return { ...article, html: renderMarkdown(article.bodyMarkdown) };
}

export async function listPublishedArticles(tool = null) {
  const articles = await db.helpArticle.findMany({
    where: { tool, isPublished: true },
    orderBy: [{ navOrder: 'asc' }, { title: 'asc' }],
  });
  return articles.map(withHtml);
}

// Context resolution for the help drawer: explicit context-key matches first
// (searched across every published article — keys are explicit wiring, not
// scoped), then every published article for the key's tool, then platform
// articles.
export async function articlesForContext(contextKey) {
  const key = String(contextKey || '').trim();
  const toolKey = key.includes('.') ? key.split('.')[0] : key;
  const tool = isToolKey(toolKey) ? toolKey : null;

  const candidates = await db.helpArticle.findMany({
    where: { isPublished: true },
    orderBy: [{ navOrder: 'asc' }, { title: 'asc' }],
  });

  const matches = key
    ? candidates.filter(a => Array.isArray(a.contextKeys) && a.contextKeys.includes(key))
    : [];
  if (matches.length > 0) return { articles: matches.map(withHtml), matched: 'context' };

  const toolArticles = tool ? candidates.filter(a => a.tool === tool) : [];
  if (toolArticles.length > 0) return { articles: toolArticles.map(withHtml), matched: 'tool' };

  return { articles: candidates.filter(a => a.tool === null).map(withHtml), matched: 'platform' };
}

// ---- Admin CRUD ----

export async function listHelpArticlesForAdmin({ tool } = {}) {
  return db.helpArticle.findMany({
    where: tool === undefined ? undefined : { tool },
    orderBy: [{ tool: 'asc' }, { navOrder: 'asc' }, { title: 'asc' }],
  });
}

export async function getHelpArticle(id) {
  if (id === 'new') return null;
  return db.helpArticle.findUnique({ where: { id } });
}

function normalizeArticleInput({ tool, slug, title, bodyMarkdown, contextKeys, navOrder, isPublished }) {
  const normalizedTool = tool && isToolKey(tool) ? tool : null;
  const normalizedSlug = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!normalizedSlug) throw new Error('Slug is required.');
  if (!String(title || '').trim()) throw new Error('Title is required.');
  if (!String(bodyMarkdown || '').trim()) throw new Error('Body is required.');
  const keys = String(contextKeys || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
  return {
    tool: normalizedTool,
    slug: normalizedSlug,
    title: String(title).trim(),
    bodyMarkdown: String(bodyMarkdown),
    contextKeys: keys.length ? keys : null,
    navOrder: Number.parseInt(navOrder, 10) || 0,
    isPublished: Boolean(isPublished),
  };
}

export async function upsertHelpArticle({ id = null, ...input }) {
  const data = normalizeArticleInput(input);
  const duplicate = await db.helpArticle.findFirst({
    where: { tool: data.tool, slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (duplicate) throw new Error('An article with that slug already exists for this tool.');
  if (id) return db.helpArticle.update({ where: { id }, data });
  return db.helpArticle.create({ data });
}

export async function setHelpArticlePublished(id, isPublished) {
  return db.helpArticle.update({ where: { id }, data: { isPublished: Boolean(isPublished) } });
}

export async function deleteHelpArticle(id) {
  return db.helpArticle.delete({ where: { id } });
}

export function previewMarkdown(bodyMarkdown) {
  return renderMarkdown(bodyMarkdown);
}
