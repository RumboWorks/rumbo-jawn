// Tool registry — single source of truth for Rumbo tools.
//
// Tool keys here are canonical and are reused as:
//   - the `tool` field on UsageEvent / FeatureFlag / AiModelConfig
//   - the `features[<key>]` flag on a product tier / org entitlement
//   - the `tool` field on ToolGrant
//
// `orgOpen: true`  → any org member (with the org entitled to the tool) may use
//                    the tool at their org-membership role, without an explicit
//                    ToolGrant. Used to grandfather Sounds Like Us.
// `orgOpen: false` → access requires an explicit ToolGrant (or platform-admin /
//                    partner-manager).

export const TOOLS = Object.freeze([
  Object.freeze({
    key: 'slu',
    name: 'Sounds Like Us',
    description: 'Turn public source material into reusable voice and writing guidance for your team and AI tools.',
    path: '/slu',
    icon: 'audio-lines',
    navOrder: 10,
    orgOpen: true,
  }),
  Object.freeze({
    key: 'eval',
    name: 'Eval',
    description: 'Compare model and tool outputs with structured criteria, reviewer scoring, and clear reports.',
    path: '/eval',
    icon: 'clipboard-check',
    navOrder: 20,
    orgOpen: false,
  }),
]);

const TOOLS_BY_KEY = Object.freeze(
  Object.fromEntries(TOOLS.map(tool => [tool.key, tool])),
);

// All tools, ordered by navOrder.
export function listTools() {
  return [...TOOLS].sort((a, b) => a.navOrder - b.navOrder);
}

// A single tool by key, or null.
export function getTool(key) {
  return TOOLS_BY_KEY[key] ?? null;
}

// True if the key is a registered tool.
export function isToolKey(key) {
  return Object.prototype.hasOwnProperty.call(TOOLS_BY_KEY, key);
}
