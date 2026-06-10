import { db } from '@rumbo/db';

const ARTICLES = [
  // ── Platform-level (tool: null) ─────────────────────────────────────────
  {
    tool: null,
    slug: 'getting-started',
    title: 'Getting started with Rumbo',
    bodyMarkdown: `Rumbo is a platform that hosts a growing set of AI-assisted communication tools. Each tool focuses on a specific task — right now that includes **Sounds Like Us** for voice-and-tone guidance and **Eval** for comparing AI model responses.

## Picking a tool

After you sign in you'll land on the home screen. The **tool switcher** in the header lets you jump between any tool your organization has access to. If a tool isn't showing, your organization may not be on a plan that includes it, or an admin may need to grant you access.

## Account settings

Your profile, email, and password live at [/account](/account). You can also switch the active organization from the account menu in the header — useful if you belong to more than one workspace.

## What's next?

- Explore **Sounds Like Us** to generate writing guidance from a public website.
- Try **Eval** to run structured comparisons of AI model responses.

If something isn't working, check that your email address is verified — some features are gated until verification is complete.`,
    contextKeys: ['home'],
    navOrder: 0,
    isPublished: true,
  },
  {
    tool: null,
    slug: 'accounts-and-verification',
    title: 'Your account and email verification',
    bodyMarkdown: `## Signing up

Visit [/pricing](/pricing) to compare plans, then click **Get started** to create your account. During signup you'll choose a plan tier, set a password, and accept the terms of service.

## Why we verify your email

Email verification helps protect your account and ensures we can reach you for billing notices, invitations, and password resets. Until you verify, some features may be restricted.

**Didn't get the email?** Check your spam folder, then visit [/auth/verify-pending](/auth/verify-pending) and click **Resend verification email**. The link expires after a short time.

## Resetting your password

Go to [/password/forgot](/password/forgot), enter your email address, and we'll send a reset link. The link is single-use and expires after a short window.

## Updating your profile

Once signed in, visit [/account](/account) to change your display name, email address, or password.`,
    contextKeys: null,
    navOrder: 1,
    isPublished: true,
  },
  {
    tool: null,
    slug: 'organizations-and-members',
    title: 'Organizations, members, and roles',
    bodyMarkdown: `## Personal workspaces vs. team organizations

When you sign up on the **free** or **solo** plan you get a personal workspace — it's tied to your account and isn't shared. **Team** and **Partner** plans let you collaborate inside a named organization with multiple members.

## Roles

- **Manager** — can manage members, adjust settings, and access billing. The person who created the organization starts as a manager.
- **Member** — has access to the organization's tools but can't change membership or billing.

## Inviting people

Managers can invite team members from [/account/orgs/:orgId/members](/account). Enter the invitee's email address and they'll receive an invitation link. The link must be accepted while logged in (or after creating an account).

## Switching the active organization

If you belong to more than one organization, open the **account menu** in the top-right corner and select the organization you want to work in. All tool activity and usage is attributed to the active organization.`,
    contextKeys: null,
    navOrder: 2,
    isPublished: true,
  },
  {
    tool: null,
    slug: 'plans-and-billing',
    title: 'Plans and billing',
    bodyMarkdown: `## Plan overview

| Plan | Who it's for |
|------|--------------|
| **Free** | Single user, limited access |
| **Solo** | Individual power user |
| **Team** | Shared organization with multiple members |
| **Partner** | Agencies managing client organizations |

## Upgrading

Managers can upgrade from [/billing](/billing). Click **Upgrade** next to the plan you want — you'll be taken to a Stripe-hosted checkout page. Paid intent is saved immediately so your work isn't interrupted during the checkout flow.

## Managing your subscription

Once on a paid plan, the **Manage billing** button on [/billing](/billing) opens the Stripe Customer Portal where you can update your payment method, view invoices, change your plan, or cancel.

## What happens when a subscription ends

If a subscription is canceled or a payment fails after retries, your organization automatically drops back to the **free** tier. Your data and past work are preserved — nothing is deleted. You can re-subscribe at any time to restore access.`,
    contextKeys: null,
    navOrder: 3,
    isPublished: true,
  },
  {
    tool: null,
    slug: 'partner-accounts',
    title: 'Partner accounts for agencies',
    bodyMarkdown: `## What is a partner account?

A partner account is designed for agencies and consultants who manage AI communication work on behalf of multiple clients. Each client gets their own isolated organization; your partner account ties them together.

## Setting up

Sign up on the **Partner** plan. During signup you'll name your partner account and your first client organization. After that, you'll see a **Partner** entry in the header navigation.

## Creating client organizations

From [/partner](/partner), click **New client organization** to add a client. The new org starts on the free tier under your partner account — you can upgrade it separately if needed.

## Co-managers

You can add other users as co-managers of your partner account from the [/partner](/partner) dashboard. Co-managers can create and manage all client organizations under the account.

## Archiving a client org

When an engagement ends, archive the client organization from [/partner](/partner). Archiving removes your partner access to that org but preserves the organization's data. Organizations with active members are not deleted automatically.`,
    contextKeys: null,
    navOrder: 4,
    isPublished: true,
  },

  // ── Sounds Like Us (tool: 'slu') ────────────────────────────────────────
  {
    tool: 'slu',
    slug: 'what-is-sounds-like-us',
    title: 'What Sounds Like Us does',
    bodyMarkdown: `Sounds Like Us analyzes a public website and produces reusable **writing guidance** tailored to your organization's voice and tone. The guidance can be used to write new content, critique drafts, or give AI writing tools a consistent brief.

## What you get

After an analysis you'll receive:

- **Organization summary** — a short description of who you are and what you do.
- **Voice and tone profile** — how you sound: formal vs. casual, warm vs. authoritative, and so on.
- **Vocabulary guidance** — words and phrases to use or avoid.
- **Reusable writing guidance** — ready-to-paste instructions for writing tasks of any length.

## What to expect during analysis

Once you submit a URL, Rumbo crawls a sample of public pages, sends the content to an AI provider for analysis, and assembles your guidance. This usually takes under a minute. You'll see live progress steps and can navigate away — the result will be waiting for you when you return.

The guidance is yours to adjust, download, and reuse across your team.`,
    contextKeys: ['slu'],
    navOrder: 0,
    isPublished: true,
  },
  {
    tool: 'slu',
    slug: 'running-an-analysis',
    title: 'Running an analysis',
    bodyMarkdown: `## Starting an analysis

From the Sounds Like Us home, paste a **public URL** — a homepage, about page, or any publicly accessible page that represents your organization's voice. Click **Analyze** to begin.

If you're not already signed in, you'll be asked to log in or create an account before the analysis starts.

## What URLs are suitable?

Use pages that are publicly accessible and representative of how your organization writes. **Do not submit pages containing confidential, donor, member, client, or otherwise sensitive information.** Content from the URL you submit may be sent to third-party AI providers as part of the analysis.

## Progress steps

After submitting you'll see live progress: crawling pages → analyzing content → building guidance. You can leave and come back — the job runs in the background.

## Finding past analyses

All your completed analyses appear under **Your analyses** in the Sounds Like Us navigation. Each entry links back to the full guidance workbench so you can revisit or download at any time.`,
    contextKeys: ['slu.analyze'],
    navOrder: 1,
    isPublished: true,
  },
  {
    tool: 'slu',
    slug: 'using-the-workbench',
    title: 'Using the guidance workbench',
    bodyMarkdown: `The guidance workbench is where you shape the output from an analysis into a finished writing brief.

## Adjusting the guidance

At the top of the workbench you can set:

- **Task** — what the guidance is for (e.g. writing a blog post, drafting a social caption).
- **Length** — short, medium, or long output.
- **Options** — toggle additional guidance blocks like reading-level notes or best-practice packs.

Changes update the preview without re-running the AI analysis.

## Including and excluding blocks

Each guidance section (voice and tone, vocabulary, what to avoid, etc.) has a toggle. Deselect any block you don't need for this particular use. The assembled guidance in the preview updates instantly.

## Downloading

Use the **Copy** button to copy the full guidance to your clipboard, or **Download** to save it as a plain-text (.txt) or Markdown (.md) file. Downloads always use the full expanded guidance, regardless of which view you're in.

## Leaving feedback

If the guidance feels off, use the feedback option on the workbench to let us know. Your feedback helps improve future analyses.`,
    contextKeys: ['slu.workbench'],
    navOrder: 2,
    isPublished: true,
  },
  {
    tool: 'slu',
    slug: 'slu-usage-budgets',
    title: 'Usage budgets',
    bodyMarkdown: `## What is a usage budget?

Each organization has a soft budget for the number of Sounds Like Us analyses that can be run within a rolling 7-day window. This limit helps keep costs predictable and fair across all users.

## The over-budget indicator

When your organization has used all its analyses for the current window, an **over-budget indicator** appears on the Sounds Like Us home screen. You can still view and reuse past analyses and guidance from the workbench — the indicator only affects starting new analyses.

The budget resets on a rolling basis, so analyses from more than 7 days ago free up capacity automatically.

## Raising the budget

Usage budgets are set by platform admins on a per-organization basis. If you regularly need more analyses than your budget allows, ask your platform admin to review the limit for your organization. Admins can adjust the budget from the admin panel at any time.`,
    contextKeys: null,
    navOrder: 3,
    isPublished: true,
  },

  // ── Eval (tool: 'eval') ─────────────────────────────────────────────────
  {
    tool: 'eval',
    slug: 'what-is-eval',
    title: 'What Eval does',
    bodyMarkdown: `Eval gives your team a structured way to compare how different AI models respond to the same prompt, judged against criteria you define.

## The core loop

1. **Author an evaluation** — write a prompt and define which models to test.
2. **Launch a run** — the prompt, models, and criteria are snapshotted at launch so results stay comparable over time.
3. **Collect responses** — let Rumbo call the models via live API, or paste responses manually.
4. **Assign reviewers** — reviewers score each response against your criteria.
5. **Read the report** — a heatmap shows scores across models and criteria; you can add a written summary and share the report securely.

## Who has access

Eval access requires an explicit tool grant from a platform admin. Within your organization, only **managers** can author evaluations, configure models, and launch runs. **Members** with a grant can be assigned as reviewers.`,
    contextKeys: ['eval'],
    navOrder: 0,
    isPublished: true,
  },
  {
    tool: 'eval',
    slug: 'models-and-criteria',
    title: 'Setting up models and criteria',
    bodyMarkdown: `Before launching a run, a manager needs to set up the models and criteria the evaluation will use.

## Adding models

Go to [/eval/settings/models](/eval/settings/models). Each model entry includes:

- **Provider** — the AI provider (e.g. OpenAI, Anthropic).
- **Model name** — the specific model ID.
- **Access method** — **live API** (Rumbo calls the model for you, requires API keys in the environment) or **manual** (you paste the response yourself).

Models added here are available to all runs in your organization.

## Writing criteria

Go to [/eval/settings/criteria](/eval/settings/criteria). Each criterion is a short, specific statement reviewers will score responses against — for example, *"The response directly answers the question asked"* or *"The tone matches the brand guidelines."*

Clear, focused criteria produce more consistent reviews. Avoid combining multiple ideas in a single criterion.

Both models and criteria are reusable across evaluations, so you only need to set them up once.`,
    contextKeys: ['eval.models', 'eval.criteria'],
    navOrder: 1,
    isPublished: true,
  },
  {
    tool: 'eval',
    slug: 'launching-a-run',
    title: 'Launching a run',
    bodyMarkdown: `A **run** is a single execution of an evaluation — one prompt, tested across one or more models, reviewed against a set of criteria.

## The launch wizard

From an evaluation's detail page, click **Launch run**. The wizard walks you through four steps:

1. **Prompt** — confirm or adjust the prompt for this run. You can tweak it between runs without changing the base evaluation.
2. **Models** — choose which models from your catalog to include in this run.
3. **Criteria** — select the criteria reviewers will use to score responses.
4. **Reviewers** — assign one or more team members to review responses. Reviewers receive a notification when the run is ready.

## Snapshots keep results comparable

When you launch, Rumbo takes an **immutable snapshot** of the prompt, criteria, and model list. Editing the base evaluation or criteria later won't affect past runs, so you can compare results across runs with confidence.

Once launched, the run moves to the collection stage.`,
    contextKeys: ['eval.evals', 'eval.run'],
    navOrder: 2,
    isPublished: true,
  },
  {
    tool: 'eval',
    slug: 'collecting-responses',
    title: 'Collecting responses',
    bodyMarkdown: `After a run is launched, responses need to be collected from each model before reviewers can start scoring.

## Live API collection

If a model is configured with the **live API** access method, click **Collect** on the run status page. Rumbo enqueues a background job that sends the prompt to the model and stores the response. You'll see the status update in real time — no need to stay on the page.

Live collection requires the relevant API key to be configured in the environment (for example **OPENAI_API_KEY** or **ANTHROPIC_API_KEY**). Contact your platform admin if collection fails with an authentication error.

## Manual responses

For models set to **manual** access, click **Enter response** and paste the model's output into the text field. Manual responses are useful when you want to test a model that isn't reachable via API, or when you've already generated output through another interface.

## Marking the run ready for review

Once all responses are collected, mark the run **Ready for review** from the run status page. Assigned reviewers will be notified that their responses are waiting.`,
    contextKeys: ['eval.run.status'],
    navOrder: 3,
    isPublished: true,
  },
  {
    tool: 'eval',
    slug: 'reviewing-and-reports',
    title: 'Reviewing and reading reports',
    bodyMarkdown: `## The review workspace

When a run is ready, assigned reviewers open the review screen at [/eval/runs/:id/review](/eval/runs). For each response you'll see:

- The **formatted response** alongside the original.
- A **score field** (1–5) for each criterion.
- An optional **comment** field per criterion.

Scores and comments **autosave** as you type — you won't lose work if you close the tab. When you're done, click **Submit** to finalize your review.

## Reading the report

Managers can view the report at [/eval/runs/:id/report](/eval/runs). The **heatmap** shows scores for every model × criterion combination at a glance. You can toggle between **score view** (raw averages) and **rank view** (relative ranking across models).

Click any cell to drill into the individual comments and scores behind it.

## Sharing the report

Toggle **Share** to generate a secure, read-only link you can send to stakeholders. The shared view shows scores and comments but **hides model names** — useful when you want unbiased feedback on the results before revealing which model produced which response.`,
    contextKeys: ['eval.review', 'eval.reports'],
    navOrder: 4,
    isPublished: true,
  },
  {
    tool: 'eval',
    slug: 'eval-tasks-and-notifications',
    title: 'Tasks and notifications',
    bodyMarkdown: `## The tasks inbox

[/eval/tasks](/eval/tasks) is your personal to-do list for Eval work. It shows:

- **Reviews to complete** — runs where you've been assigned as a reviewer and haven't yet submitted.
- **Responses to collect** — runs where manual response entry is waiting on you.

Tasks are cleared automatically when you complete the corresponding action.

## Review reminders

If a reviewer hasn't submitted after a period of time, the run manager can send a **review reminder** from the run status page. The reviewer receives both an in-app notification and an email.

## Notifications

Eval sends in-app notifications and emails for key events:

| Event | Who gets notified |
|---|---|
| Review assigned | The assigned reviewer |
| Review reminder sent | The assigned reviewer |
| All reviews submitted | The run manager |
| Manual response needed | The run manager |

Email notifications require SMTP to be configured. If you're not receiving emails, ask your platform admin to check the email configuration.`,
    contextKeys: ['eval.tasks'],
    navOrder: 5,
    isPublished: true,
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const a of ARTICLES) {
    const { tool, slug, ...data } = a;

    const existing = await db.helpArticle.findFirst({
      where: { tool: tool ?? null, slug },
    });

    if (existing) {
      await db.helpArticle.update({
        where: { id: existing.id },
        data: { tool, slug, ...data },
      });
      console.log(`  updated  [${tool ?? 'platform'}] ${slug}`);
      updated++;
    } else {
      await db.helpArticle.create({
        data: { tool, slug, ...data },
      });
      console.log(`  created  [${tool ?? 'platform'}] ${slug}`);
      created++;
    }
  }

  console.log(
    `\nDone. ${created} created, ${updated} updated (${created + updated} total).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
