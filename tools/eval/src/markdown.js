import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });

export function formatResponseText(text) {
  const original = String(text ?? '');
  return {
    original,
    html: sanitizeHtml(markdown.render(original), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
      allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    }),
  };
}
