// Platform default Best-Practice Packs.
// Each pack adds a guidance block to the assembled output when selected.
// Future: managers can create org-specific packs via DB config.

export const BEST_PRACTICE_PACKS = [
  {
    id: 'none',
    label: 'None',
  },
  {
    id: 'fundraising_appeals',
    label: 'Fundraising / donor appeals',
    source: 'pack',
    heading: 'Fundraising and donor appeal guidance',
    content: `Fundraising and donor appeal guidance:
- Lead with impact: open with a specific story or outcome, not an organizational description.
- Be concrete: "protect 400 acres of riverside habitat" not "protect natural spaces."
- Honor the donor's role: frame the gift as the donor's action producing change.
- Use "you" prominently — the donor is the actor.
- Include a single, specific, clear call to action.
- Avoid guilt or urgency language that feels manipulative.
- Close with warmth and specificity — what exactly will their gift make possible?
- Preferred length for direct mail or email: 250–500 words.`,
  },
  {
    id: 'email_newsletters',
    label: 'Email newsletters',
    source: 'pack',
    heading: 'Email newsletter guidance',
    content: `Email newsletter guidance:
- Subject line: 40 characters or fewer, specific and descriptive. Avoid "Update" or "Newsletter" in the subject.
- Preheader text: 85–100 characters reinforcing the subject line.
- Lead with one key story or announcement — not a list of everything that happened.
- Use clear section dividers if covering multiple topics.
- Keep paragraphs to 3 sentences or fewer.
- Include one primary call to action per section; do not bury CTAs.
- Plain text version should read as a coherent message, not a list of links.`,
  },
  {
    id: 'job_descriptions_performance_reviews',
    label: 'Job descriptions / performance reviews',
    source: 'pack',
    heading: 'Job descriptions and performance review guidance',
    content: `Job descriptions and performance review guidance:
- Job descriptions: lead with mission context before listing requirements. Avoid gender-coded terms. Label requirements as "required" or "preferred" explicitly. Describe impact of the role before responsibilities.
- Avoid superlatives: "exceptional," "rockstar," "ninja," "passionate."
- Performance reviews: use observable, behavioral language. "Delivered X by Y date" not "seemed motivated." Separate observed behavior from inferred attitude. Tie feedback to organizational values or outcomes.
- Be specific about what success looks like — avoid generic phrases like "meets expectations."`,
  },
  {
    id: 'social_media_posts',
    label: 'Social media posts',
    source: 'pack',
    heading: 'Social media guidance',
    content: `Social media guidance:
- Match platform norms: shorter for Twitter/X, visual for Instagram, professional-conversational for LinkedIn.
- Open with the most engaging line — no preamble.
- Use the organization's vocabulary and phrases naturally.
- Hashtags: use 2–4 relevant hashtags at the end; avoid over-tagging.
- Tag real people or organizations when appropriate and accurate.
- Call-to-action posts: one CTA, directly stated. Do not bury the ask.
- Avoid press-release language on social media — write as a person, not an institution.`,
  },
  {
    id: 'press_releases',
    label: 'Press releases',
    source: 'pack',
    heading: 'Press release guidance',
    content: `Press release guidance:
- Dateline and lead: answer who, what, when, where, why in the first paragraph (maximum 35 words).
- A journalist should be able to stop after the lead.
- Second paragraph: supporting context, key data point, or significance.
- Quote: include one strong quote from leadership, then one from a community member or partner.
- Quotes should sound human — edit out corporate language.
- Boilerplate: standardized "About [Org]" paragraph at the bottom.
- Avoid: "We are pleased to announce," "it is with great pleasure."
- Length: 400–600 words maximum.`,
  },
];

export const BEST_PRACTICE_PACKS_MAP = Object.fromEntries(
  BEST_PRACTICE_PACKS.filter(p => p.id !== 'none').map(p => [p.id, p])
);
