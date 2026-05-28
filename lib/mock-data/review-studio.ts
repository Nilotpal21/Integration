export interface EvalCategoryBrief {
  name: string;
  score: number;
  trend: 'up' | 'flat' | 'down';
}

export interface SandboxTurn {
  speaker: 'member' | 'agent';
  agent?: string;
  text: string;
  citation?: string;
}

export interface ReviewStudioContext {
  evalCategories: EvalCategoryBrief[];
  sandboxScript: SandboxTurn[];
  helperSuggestions: string[];
}

const cardDispute: ReviewStudioContext = {
  evalCategories: [
    { name: 'Member authentication', score: 96, trend: 'up' },
    { name: 'Reg E disclosure', score: 94, trend: 'up' },
    { name: 'Escalation timing', score: 92, trend: 'flat' },
    { name: 'Citation accuracy', score: 96, trend: 'up' },
    { name: 'Task creation accuracy', score: 93, trend: 'up' },
    { name: 'Intent coverage', score: 91, trend: 'flat' },
  ],
  sandboxScript: [
    { speaker: 'member', text: 'I see a charge on my debit card I don’t recognize.' },
    {
      speaker: 'agent',
      agent: 'Authentication',
      text: 'I can help with that. Can you confirm the last four digits of your card and your year of birth?',
    },
    { speaker: 'member', text: 'Sure — 4421 and 1985.' },
    {
      speaker: 'agent',
      agent: 'Account Services',
      text: 'Thanks. I see the charge from May 26 for $48.20 at "BLUE COAST FUEL". Are you saying this wasn’t authorized?',
      citation: 'Card_Disputes_v3.2.pdf §3',
    },
    { speaker: 'member', text: 'Yes, I never used my card there.' },
    {
      speaker: 'agent',
      agent: 'Compliance',
      text: 'Opened Reg E case #DSP-447293. Provisional credit will post within 10 business days. You’ll receive a confirmation email shortly.',
      citation: 'Reg E playbook — provisional credit rule',
    },
  ],
  helperSuggestions: [
    'Walk me through Reg E disclosures in this app',
    'Explain why I chose Account Services for this workflow',
    'Suggest one improvement based on my last evaluation',
  ],
};

const accountOpening: ReviewStudioContext = {
  evalCategories: [
    { name: 'Identity verification', score: 95, trend: 'up' },
    { name: 'Disclosure delivery', score: 90, trend: 'flat' },
    { name: 'Product matching', score: 88, trend: 'up' },
    { name: 'Task creation', score: 92, trend: 'up' },
    { name: 'Citation accuracy', score: 94, trend: 'up' },
  ],
  sandboxScript: [
    { speaker: 'member', text: 'I’d like to open a checking account today.' },
    {
      speaker: 'agent',
      agent: 'Authentication',
      text: 'Happy to help. Are you a member of Cornerstone, or would you like to join today?',
    },
    { speaker: 'member', text: 'New member.' },
    {
      speaker: 'agent',
      agent: 'Account Services',
      text: 'I’ll need a government ID, your SSN, and a few details. Here’s our standard account-opening disclosure.',
      citation: 'AOS_Onboarding.pdf §2',
    },
  ],
  helperSuggestions: [
    'Why did the platform pick Account Services for this app?',
    'Explain the Reg D disclosure flag from my SOP',
    'Show me which knowledge sources are attached',
  ],
};

const fraud: ReviewStudioContext = {
  evalCategories: [
    { name: 'Fraud signal detection', score: 98, trend: 'up' },
    { name: 'Identity verification', score: 96, trend: 'flat' },
    { name: 'Escalation routing', score: 95, trend: 'up' },
    { name: 'Member language', score: 94, trend: 'up' },
    { name: 'PII handling', score: 100, trend: 'flat' },
  ],
  sandboxScript: [
    { speaker: 'member', text: 'I just saw an alert about a $1,200 charge from another state.' },
    {
      speaker: 'agent',
      agent: 'Authentication',
      text: 'Let’s confirm it’s you first — can you provide your one-time code?',
    },
    { speaker: 'member', text: '8 8 1 4 9 0.' },
    {
      speaker: 'agent',
      agent: 'Compliance',
      text: 'Verified. I’m escalating this to fraud operations with full transaction context. A specialist will call you within 30 minutes.',
      citation: 'Fraud_Triage_v1.1.pdf §4',
    },
  ],
  helperSuggestions: [
    'How is fraud-triage scored on PII handling?',
    'Why do we mask the account number in escalations?',
    'Suggest scenarios I should add to user-defined tests',
  ],
};

const hardship: ReviewStudioContext = {
  evalCategories: [
    { name: 'Hardship eligibility logic', score: 78, trend: 'down' },
    { name: 'TCPA-safe outbound', score: 86, trend: 'up' },
    { name: 'Escalation timing', score: 88, trend: 'flat' },
    { name: 'Citation accuracy', score: 92, trend: 'up' },
    { name: 'Member language', score: 90, trend: 'up' },
  ],
  sandboxScript: [
    { speaker: 'member', text: 'I lost my job last month and can’t make this month’s loan payment.' },
    {
      speaker: 'agent',
      agent: 'Authentication',
      text: 'I’m sorry to hear that. I’m here to help. Let’s verify your identity first.',
    },
    { speaker: 'member', text: '[verified]' },
    {
      speaker: 'agent',
      agent: 'Collections',
      text: 'Could you share documentation of your income change? We need it before drafting a payment plan.',
      citation: 'Hardship_Plans_2026.docx §4',
    },
    { speaker: 'member', text: 'Yes, I have my separation letter.' },
    {
      speaker: 'agent',
      agent: 'Collections',
      text: 'Thank you. Drafting a 90-day plan request now. A specialist will contact you within one business day to confirm.',
    },
  ],
  helperSuggestions: [
    'Why is the Hardship eligibility category at 78?',
    'Suggest a guardrail that closes the income-documentation gap',
    'Show me the failing examples from my last evaluation',
  ],
};

const loan: ReviewStudioContext = {
  evalCategories: [
    { name: 'Eligibility pre-check', score: 82, trend: 'flat' },
    { name: 'Rate-language compliance', score: 75, trend: 'down' },
    { name: 'Identity verification', score: 91, trend: 'up' },
    { name: 'Disclosure delivery', score: 80, trend: 'flat' },
    { name: 'Intent coverage', score: 78, trend: 'flat' },
  ],
  sandboxScript: [
    { speaker: 'member', text: 'I’m interested in a $30,000 auto loan.' },
    {
      speaker: 'agent',
      agent: 'Loan & Payments',
      text: 'I can help start that application. Based on a quick pre-check, you’re likely eligible. Final rates are subject to underwriting.',
    },
  ],
  helperSuggestions: [
    'How can I improve the Rate-language compliance category?',
    'Why do my final-rate guardrails matter?',
    'Walk me through the loan intake flow',
  ],
};

const contextByAppId: Record<string, ReviewStudioContext> = {
  app_card_dispute_triage: cardDispute,
  app_account_opening: accountOpening,
  app_fraud_triage: fraud,
  app_hardship_assist: hardship,
  app_loan_intake: loan,
};

export function getReviewStudioContext(appId: string): ReviewStudioContext {
  return contextByAppId[appId] ?? cardDispute;
}
