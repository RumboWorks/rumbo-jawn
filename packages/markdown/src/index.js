// Shared markdown rendering with sanitization. Used by Eval (response
// commentary) and the platform help system. No raw HTML passthrough.

import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
};

// Render markdown to sanitized HTML.
export function renderMarkdown(text) {
  return sanitizeHtml(markdown.render(String(text ?? '')), SANITIZE_OPTIONS);
}

// Eval's response shape: keeps the original text alongside the rendered HTML.
export function formatResponseText(text) {
  const original = String(text ?? '');
  return { original, html: renderMarkdown(original) };
}
