export type HelperContextKind =
  | 'general'
  | 'dashboard'
  | 'review-studio'
  | 'sop-review'
  | 'evaluation'
  | 'mission-control'
  | 'projects';

export interface HelperContext {
  kind: HelperContextKind;
  label: string;
  appName?: string;
  sopName?: string;
  projectName?: string;
}

export interface HelperCitation {
  ref: string;
  snippet: string;
}

export interface HelperSuggestedAction {
  label: string;
  preview?: string;
}

export interface HelperTurn {
  id: string;
  role: 'user' | 'helper' | 'system';
  text: string;
  citations?: HelperCitation[];
  action?: HelperSuggestedAction;
}

export interface HelperContextSpec {
  welcome: string;
  suggestions: string[];
}

export const helperContextSpecs: Record<HelperContextKind, HelperContextSpec> = {
  general: {
    welcome:
      "Hi Demo — I'm your AI Helper. I can explain what the platform built from your SOP, suggest edits, walk you through evaluations, and answer product questions. What do you want to do?",
    suggestions: [
      "Show me my apps' health",
      "What's a sub-agent?",
      'Explain my evaluation report',
      'How do I deploy?',
    ],
  },
  dashboard: {
    welcome:
      'Welcome back, Demo. Cornerstone has 3 apps deployed and 1 in review. Want me to summarize what changed in the last 24 hours?',
    suggestions: [
      'Summarize the last 24 hours',
      'Which app needs my attention?',
      'How is continuous evaluation trending?',
      'Help me upload a new SOP',
    ],
  },
  'review-studio': {
    welcome:
      "You're in Review Studio. I can explain why the platform attached each piece, suggest edits in plain language, or walk you through how your SOP maps to the configuration.",
    suggestions: [
      'Walk me through this app',
      'Why did you attach these knowledge sources?',
      'How do I add a custom guardrail?',
      'Suggest one improvement based on my last evaluation',
    ],
  },
  'sop-review': {
    welcome:
      'I just read your SOP and generated the app. Want me to explain why I picked each sub-agent, knowledge source, and guardrail?',
    suggestions: [
      'Explain how my SOP maps to this app',
      'Why did you pick these sub-agents?',
      'What does each flag mean?',
      "What's missing from my SOP?",
    ],
  },
  evaluation: {
    welcome:
      "This evaluation ran across pre-built credit-union scenarios, SOP-derived tests, and your user-defined tests. I'll translate the score into plain language and suggest where to improve.",
    suggestions: [
      'Explain my score',
      'Which categories should I improve?',
      'Show me the worst failing case',
      'Suggest a fix for the lowest category',
    ],
  },
  'mission-control': {
    welcome:
      'All systems operational. I can flag drift, explain rate limits, or walk you through any app’s audit trail. What do you need to know?',
    suggestions: [
      'Are any apps drifting?',
      'Why was this app rate-limited?',
      'Show me the audit trail for card-dispute-triage',
      "What's caused the recent escalation spike?",
    ],
  },
  projects: {
    welcome:
      "Cornerstone has 4 active projects. I can compare projects, surface project-level KPIs, or walk you through how to set up a new one.",
    suggestions: [
      'Which project has the lowest evaluation score?',
      'How is Card Services trending this week?',
      'Help me set up a new project',
      'Show me cross-project KPIs',
    ],
  },
};

interface ScriptedReply {
  text: string;
  citations?: HelperCitation[];
  action?: HelperSuggestedAction;
}

// Each match-key is a snippet that should appear in the user message (lowercased)
// in order for the script to apply. First match wins.
const scriptsByContext: Record<HelperContextKind, { match: string; reply: ScriptedReply }[]> = {
  general: [
    {
      match: 'apps',
      reply: {
        text: "You have 3 apps deployed (card-dispute-triage, account-opening-assistant, fraud-triage), 1 in review (hardship-assist), and 1 draft (loan-application-intake). card-dispute-triage and account-opening-assistant are both trending up; loan-application-intake is below the pilot baseline of 80 and needs work.",
      },
    },
    {
      match: 'sub-agent',
      reply: {
        text: "A sub-agent is a specialized agent the platform picks for you based on your SOP. For credit unions, the library covers Authentication, Account Services, Collections, Financial Wellness, Loans, Compliance, and Knowledge. You don't pick them by hand — the auto-generation engine selects them from the intents and tasks it found in your SOP.",
      },
    },
    {
      match: 'eval',
      reply: {
        text: "The Evaluation Report is a score-based view of how well your app performs across three test sources: pre-built credit-union scenarios (412), SOP-derived tests automatically generated from your upload (87), and user-defined tests you create in the sandbox. The score isn't a hard pass/fail gate — your compliance reviewer makes the final call.",
      },
    },
    {
      match: 'deploy',
      reply: {
        text: "Once an app is approved by your reviewer pool, you can deploy it from the Review Studio header. Deployment is single-shot to your target audience and captures an immutable record (config snapshot, evaluation snapshot, approver IDs). You can roll back to any previously approved version in one click.",
      },
    },
  ],
  dashboard: [
    {
      match: '24',
      reply: {
        text: "Across all deployed apps in the last 24 hours: 1,652 conversations, 96.4% completion, average evaluation score 92.3. Two notable events: card-dispute-triage's Reg E disclosure category improved +2 points; account-opening-assistant flagged 1 guardrail trigger (a 'no-financial-advice' rule fired correctly).",
      },
    },
    {
      match: 'attention',
      reply: {
        text: "hardship-assist is waiting on co-approval from Marco Davis — your reviewer Rina has already signed off. It's been 6 hours; nudge them or set up the auto-fallback in project settings.",
        action: {
          label: 'Open the submission',
          preview: 'Goes to /queue/app_hardship_assist',
        },
      },
    },
    {
      match: 'continuous',
      reply: {
        text: 'Continuous evaluation is healthy: card-dispute-triage up 2 points week-over-week, account-opening-assistant flat at 91, fraud-triage holding at 96. No active drift alerts. The lowest-trending category across all apps is "Hardship eligibility logic" on hardship-assist (78).',
      },
    },
    {
      match: 'sop',
      reply: {
        text: 'You can drag a PDF or DOCX into /sops/new, or paste text directly. I will read the SOP, identify intents and tasks, and generate the app. Want me to open it for you?',
        action: { label: 'Open SOP upload', preview: 'Goes to /sops/new' },
      },
    },
  ],
  'review-studio': [
    {
      match: 'walk',
      reply: {
        text: "Here's what this app does at a glance: it triages inbound card-dispute inquiries (intent recognition), verifies member identity (Authentication sub-agent), looks up the disputed transaction (Account Services), opens a Reg E case with the correct disclosure path (Compliance). It runs across digital and voice channels. The current Evaluation Score is 94 — well above the pilot baseline.",
        citations: [
          {
            ref: 'Card_Disputes_v3.2.pdf §1',
            snippet: 'The dispute team will receive inbound inquiries through digital chat and the contact center, verify identity, and open a Reg E case per the disclosure schedule.',
          },
        ],
      },
    },
    {
      match: 'knowledge',
      reply: {
        text: "I attached 4 sources for this app. Here's why each one maps to your SOP:",
        citations: [
          { ref: 'Reg E playbook¹', snippet: 'Your SOP mentions Reg E disclosures in §3 and §7.' },
          {
            ref: 'Card dispute disclosures²',
            snippet: 'Your SOP requires consumer notice within 10 business days.',
          },
          {
            ref: 'Member identity policy³',
            snippet: 'You require multi-factor before processing disputes.',
          },
          {
            ref: 'Cornerstone FAQ⁴',
            snippet: "From your Knowledge Library — your CU's specific dispute timeline.",
          },
        ],
        action: {
          label: 'Add the FFIEC fraud guidance too',
          preview: "It's already in your Knowledge Library but not currently attached.",
        },
      },
    },
    {
      match: 'guardrail',
      reply: {
        text: 'You can add custom guardrails in plain English — for example, "Never recommend a credit card to a member under 18" or "If the member mentions hardship, hand off to a human counselor." I translate the rule into the platform\'s internal representation; your reviewer sees both the English and the structured form.',
        action: {
          label: 'Open the custom-guardrail editor',
          preview: 'Adds a row to the Guardrails panel.',
        },
      },
    },
    {
      match: 'improvement',
      reply: {
        text: "Your lowest category right now is 'Intent coverage' at 91. The most common gap: when a member opens with 'something is wrong with my card,' the app sometimes defaults to dispute flow before checking whether the issue is actually a lock or replacement request. Want me to add a clarifying-question guardrail before the Account Services sub-agent runs?",
        action: {
          label: 'Add the clarifying-question guardrail',
          preview: 'New rule: ask "Is this an unauthorized charge, or do you need to lock/replace your card?" before dispute routing.',
        },
      },
    },
  ],
  'sop-review': [
    {
      match: 'map',
      reply: {
        text: 'I read your SOP and mapped it like this: §1 (process overview) → app description. §2 (intent identification) → 7 sub-agent selections. §3-§5 (workflow steps) → 12 task templates. §6 (escalation rules) → 4 escalation triggers. §7 (disclosures) → 3 compliance guardrails. Each piece is clickable to see the source passage.',
        citations: [{ ref: 'Card_Disputes_v3.2.pdf §3', snippet: 'Verification steps for inbound dispute calls.' }],
      },
    },
    {
      match: 'sub-agent',
      reply: {
        text: "I picked Member Authentication (you require identity verification before any dispute action), Account Services (you need transaction lookup), and Compliance (Reg E disclosures are mandatory). I considered adding Financial Wellness but your SOP doesn't reference budgeting or financial education flows.",
      },
    },
    {
      match: 'flag',
      reply: {
        text: "I flagged 0 Blockers, 2 Warnings, and 5 Suggestions. The Warnings are: (1) Reg E timeline may exceed the mandatory disclosure window, and (2) identity verification step is optional in §3 (it shouldn't be for disputed transactions). I never propose changes to your process content — just safety and compliance flags.",
      },
    },
    {
      match: 'missing',
      reply: {
        text: 'Your SOP is well-structured. Two minor gaps to consider when you have time: joint-account dispute handling is referenced in §4 but the script template is "follow the standard disclosure script" — no specific path defined. And the escalation contact for fraud cases is mentioned but not named. Both are Suggestions, not Blockers.',
      },
    },
  ],
  evaluation: [
    {
      match: 'score',
      reply: {
        text: "Your overall score is 94, up +2.4 from the previous run. That's well above the pilot baseline of 80. Three categories drive most of your score: Citation accuracy (96), Member authentication (96), and Reg E disclosure (94). Your lowest is Intent coverage at 91 — still healthy.",
      },
    },
    {
      match: 'improve',
      reply: {
        text: "Intent coverage at 91 has the most upside. The failing tests are mostly cases where the member opens ambiguously ('something is wrong with my card') and the app commits to dispute flow too early. Want me to suggest a clarifying-question guardrail?",
        action: {
          label: 'Add a clarifying-question guardrail',
          preview: 'Forces a one-question disambiguation before routing to dispute flow.',
        },
      },
    },
    {
      match: 'worst',
      reply: {
        text: 'Worst failing case: "Member calls about a card charge that turned out to be a recurring subscription they forgot about." The app opened a Reg E dispute. The right behavior was: ask one clarifying question, then route to "subscription review" instead. Your SOP doesn\'t cover this case explicitly — that\'s a Suggestion-tier flag.',
        citations: [
          { ref: 'Eval run #14 · failing example #2', snippet: 'Member: "I see a $14.99 charge I don\'t recognize."' },
        ],
      },
    },
    {
      match: 'fix',
      reply: {
        text: "For Intent coverage, the simplest fix is a clarifying-question step. For Reg E disclosure, you're already at 94 — no fix needed. For citation accuracy, optionally swap the generic dispute disclosure with your Cornerstone-specific version (it's in your Knowledge Library).",
        action: {
          label: 'Apply both fixes',
          preview: 'Adds clarifying-question guardrail + swaps the dispute-disclosure source.',
        },
      },
    },
  ],
  'mission-control': [
    {
      match: 'drift',
      reply: {
        text: "No active drift alerts. The platform is watching: continuous evaluation scores, guardrail trigger rates, escalation rates, and latency. The closest thing to a concern: account-opening-assistant's citation coverage has dipped from 96% to 92% over 7 days — not enough to alert, but worth a look.",
      },
    },
    {
      match: 'rate',
      reply: {
        text: "Looking at the last hour for card-dispute-triage: no rate limiting hit. If you saw a 429 in a conversation transcript, it was likely the upstream Reg E case-management API throttling — the platform retried automatically with exponential backoff. No escalation needed.",
      },
    },
    {
      match: 'audit',
      reply: {
        text: "Most recent audit entries for card-dispute-triage: 3 deployments (v1 → v3, all approved by Rina and Marco), 47 Helper-driven edits over the lifecycle (45 confirmed, 2 reverted), 0 kill-switch activations. Full audit is at /audit?app=card-dispute-triage.",
        action: {
          label: 'Open audit log filtered to this app',
          preview: 'Routes to /audit with the filter applied.',
        },
      },
    },
    {
      match: 'escalation',
      reply: {
        text: "Escalations rose from 24/day to 38/day over the last 72 hours, isolated to card-dispute-triage. Pattern analysis suggests a new merchant-name format from your card processor that the app is mis-classifying as fraud. I'd recommend updating the merchant-recognition knowledge source.",
        action: {
          label: 'Open the merchant-recognition source',
          preview: 'Goes to /knowledge/src_merchant_names',
        },
      },
    },
  ],
  projects: [
    {
      match: 'lowest',
      reply: {
        text: 'Lending has the lowest average evaluation score at 79 — that\'s because loan-application-intake is still a draft. Once it gets past first submission, the floor will lift. Collections is healthy at 88, Member Onboarding at 91, and Card Services leads at 95.',
      },
    },
    {
      match: 'card',
      reply: {
        text: 'Card Services has 2 deployed apps (card-dispute-triage, fraud-triage), 1,240 conversations in the last 24 hours, average eval 95 (up from 93 last week), and 62% of its monthly budget used. Both deployed apps are trending up.',
      },
    },
    {
      match: 'new project',
      reply: {
        text: 'To set up a new project: from /projects, click "New project" — you\'ll be prompted for a name, description, tags, default channels, monthly budget, and starting members. Reviewer pool and knowledge scope can be configured after creation. Want me to walk you through it?',
        action: { label: 'Open New Project flow', preview: 'Goes to /projects with a creation prompt' },
      },
    },
    {
      match: 'kpi',
      reply: {
        text: 'Tenant-level: 4 active projects · 5 apps · 22 active sub-agents · 96.4% completion rate · $1,006 MTD spend. Best performer this week: Card Services. Most attention needed: Lending (draft app pending first submission).',
      },
    },
  ],
};

export function getHelperReply(
  context: HelperContextKind,
  userText: string,
): ScriptedReply | null {
  const lowered = userText.toLowerCase();
  const scripts = scriptsByContext[context] ?? [];
  for (const s of scripts) {
    if (lowered.includes(s.match)) return s.reply;
  }
  return null;
}
