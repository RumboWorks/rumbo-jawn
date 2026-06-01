// Platform default Guidance Block definitions.
// Org-specific blocks (voice-tone, vocabulary, what-to-avoid) get their content from the AI analysis.
// Generic and task/option blocks get their content from this file.
// Future: managers can override/extend these via DB config.

export const GUIDANCE_TASK = {
  WRITE_NEW: 'write_new',
  REWRITE_EXISTING: 'rewrite_existing',
  CRITIQUE_EXISTING: 'critique_existing',
};

export const READING_LEVEL = {
  EASY_READ: 'easy_read',
  PLAIN_LANGUAGE: 'plain_language',
  GENERAL_ADULT: 'general_adult',
  SPECIALIST_EXPERT: 'specialist_expert',
};

export const WRITE_LENGTH = {
  SHORT_POST: 'short_post',
  BRIEF_PIECE: 'brief_piece',
  STANDARD_ARTICLE: 'standard_article',
  FULL_LENGTH_PIECE: 'full_length_piece',
};

export const REWRITE_LENGTH = {
  SHORTER: 'shorter',
  ABOUT_SAME: 'about_same',
  LONGER: 'longer',
};

export const CRITIQUE_DEPTH = {
  QUICK_TAKE: 'quick_take',
  SUMMARY_CRITIQUE: 'summary_critique',
  DETAILED_CRITIQUE: 'detailed_critique',
  POINT_BY_POINT: 'point_by_point',
};

// ---- Reading level blocks ----

export const READING_LEVEL_BLOCKS = {
  easy_read: {
    id: 'reading-level',
    label: 'Reading level',
    source: 'reading',
    heading: 'Reading level — Easy Read (grade 2–3)',
    content: `Write at a grade 2–3 reading level.
- Use very short sentences — under 15 words when possible.
- Use the most common, everyday words. Replace any specialized term with a plain alternative.
- Give concrete, specific examples rather than abstract descriptions.
- Use numbered or bulleted lists instead of paragraphs whenever possible.
- Read each sentence aloud — if it feels difficult to say, shorten it.`,
  },
  plain_language: {
    id: 'reading-level',
    label: 'Reading level',
    source: 'reading',
    heading: 'Reading level — Plain Language (grade 4–5)',
    content: `Write at a plain-language reading level (approximately grade 4–5).
- Use short sentences and common words.
- Spell out acronyms the first time they appear.
- Use active voice.
- Break up paragraphs with headings or bullets when the content allows.
- Explain any technical terms in plain language when they must appear.`,
  },
  general_adult: {
    id: 'reading-level',
    label: 'Reading level',
    source: 'reading',
    heading: 'Reading level — General Adult (grade 6–8)',
    content: `Write for a general adult audience (approximately grade 6–8).
- Use clear, direct language appropriate for most adult readers.
- Occasional specialized terms are fine if they are familiar to the audience.
- Prefer active voice and specific language over abstract generalities.
- Treat grade level as a target for clarity, not a rigid constraint.`,
  },
  specialist_expert: {
    id: 'reading-level',
    label: 'Reading level',
    source: 'reading',
    heading: 'Reading level — Specialist / Expert (grade 8–10+)',
    content: `Write for an informed or expert audience (grade 8–10+).
- Field-specific vocabulary, denser explanation, and technical terms are appropriate when useful.
- Precision is valued over simplicity.
- Assume the reader has background knowledge in the relevant domain.`,
  },
};

// ---- Task + length/detail blocks ----
// Each entry has a heading and content keyed by task → lengthDetail value.

export const TASK_LENGTH_BLOCKS = {
  write_new: {
    short_post: {
      source: 'task',
      heading: 'Task — Write something new — Short post (50–150 words)',
      content: `Create a short, self-contained piece — suitable for a social media post, short blurb, or brief announcement.
- Aim for 50–150 words.
- Lead with the most important point.
- Keep sentences short.
- Make every word count.`,
    },
    brief_piece: {
      source: 'task',
      heading: 'Task — Write something new — Brief piece (150–350 words)',
      content: `Write a brief piece of 150–350 words — suitable for a short email, announcement, or introductory copy.
- Open with a clear hook.
- Organize with one or two supporting points.
- Close with a direct call to action or next step.`,
    },
    standard_article: {
      source: 'task',
      heading: 'Task — Write something new — Standard article (350–700 words)',
      content: `Write a standard-length piece of 350–700 words — suitable for a newsletter article, web page section, or blog-style piece.
- Use a clear structure: opening, supporting sections, and a conclusion.
- Use headings or transitions to guide the reader.
- Balance depth with readability.`,
    },
    full_length_piece: {
      source: 'task',
      heading: 'Task — Write something new — Full-length piece (700+ words)',
      content: `Write a full-length piece of 700+ words — suitable for a longer article, donor appeal, or detailed web page.
- Develop the topic with depth and context.
- Use headings and clear sections.
- Build to a strong conclusion with a clear call to action.`,
    },
  },
  rewrite_existing: {
    shorter: {
      source: 'task',
      heading: 'Task — Rewrite existing text — Make it shorter',
      content: `Rewrite the provided text to be shorter while preserving the key message and most important details.
- Cut filler phrases, redundant sentences, and unnecessary qualifiers.
- Aim to reduce length by 25–40% without losing substance.
- Preserve the original meaning and most important details.`,
    },
    about_same: {
      source: 'task',
      heading: 'Task — Rewrite existing text — About the same length',
      content: `Rewrite the provided text to better match this organization's voice and tone while preserving roughly the same length and level of detail.
- Focus on word choice, sentence rhythm, and overall tone.
- Do not significantly expand or cut content — this is a voice/style revision, not a structural one.`,
    },
    longer: {
      source: 'task',
      heading: 'Task — Rewrite existing text — Make it longer',
      content: `Rewrite the provided text with additional context, transitions, or explanation — expanding it to provide more depth.
- Add supporting detail, specific examples, or background information where useful.
- Maintain the original message and purpose while building it out.`,
    },
  },
  critique_existing: {
    quick_take: {
      source: 'task',
      heading: 'Task — Critique existing text — Quick take',
      content: `Give a brief overall reaction to the provided text (2–4 sentences).
- Note the one or two most important things that are working.
- Identify the single highest-priority issue to address.
- Keep it direct and actionable.`,
    },
    summary_critique: {
      source: 'task',
      heading: 'Task — Critique existing text — Summary critique',
      content: `Provide a summary critique of the provided text covering:
1. Overall voice and tone match with this organization
2. Main strengths
3. Main weaknesses
4. The two or three highest-priority improvements
Format as a short structured review.`,
    },
    detailed_critique: {
      source: 'task',
      heading: 'Task — Critique existing text — Detailed critique',
      content: `Provide a detailed critique organized by category:
- Voice and tone alignment
- Word choice and vocabulary
- Sentence structure and rhythm
- Clarity and readability
- Overall effectiveness
For each category, note specific strengths and specific issues with actionable recommendations.`,
    },
    point_by_point: {
      source: 'task',
      heading: 'Task — Critique existing text — Point-by-point review',
      content: `Provide a point-by-point review of the provided text.
- Note specific phrases, sentences, or passages that work well or need revision.
- Organize feedback by issue type or by passage.
- Be specific: quote the text you are commenting on, explain what to change, and say why.`,
    },
  },
};

// ---- Generic platform blocks (always available, not org-specific) ----

export const GENERIC_BLOCKS = [
  {
    id: 'ai-cliche-avoidance',
    label: 'Avoid AI clichés',
    source: 'generic',
    defaultIncluded: true,
    heading: 'Avoid AI clichés',
    content: `Avoid the following AI-generated clichés and overused phrases:
- "In today's world" / "In today's fast-paced world"
- "Dive deep" / "Deep dive"
- "Leverage" (as a verb) / "Utilize" / "Synergy"
- "Game-changer" / "Disruptive" / "Revolutionary" / "Transformative"
- "Robust" (used generically) / "Comprehensive" / "Holistic"
- "At the end of the day" / "It goes without saying"
- Excessive em dashes and colons used for dramatic effect
- Opening with "In conclusion" or "In summary"
- Rhetorical questions as openers ("Are you ready to…?")

Replace these with plain, specific, direct language that earns its meaning.`,
  },
  {
    id: 'plain-language-guidance',
    label: 'Plain-language principles',
    source: 'generic',
    defaultIncluded: false,
    heading: 'Plain-language principles',
    content: `Apply plain-language principles throughout:
- Use active voice: "We protect watersheds" not "Watersheds are protected by us."
- Choose common words: "use" not "utilize," "help" not "facilitate," "show" not "demonstrate."
- Keep sentences under 25 words when possible.
- One idea per sentence.
- Spell out acronyms on first use.
- Avoid nominalizations: "decide" not "make a decision," "analyze" not "conduct an analysis."
- Lead with the main point before the explanation.`,
  },
  {
    id: 'inclusive-language-guidance',
    label: 'Inclusive language',
    source: 'generic',
    defaultIncluded: false,
    heading: 'Inclusive language',
    content: `Use inclusive language throughout:
- Default to people-first language: "people experiencing homelessness" rather than "the homeless."
- Use gender-neutral language: singular "they/them," "people" instead of "guys."
- Avoid language implying a single default experience: "most people" not "normal people."
- Name communities directly rather than using euphemisms.
- Avoid ableist language: "challenge" not "suffer from."
- When describing race or ethnicity, use the terms communities prefer and capitalize them consistently.`,
  },
];
