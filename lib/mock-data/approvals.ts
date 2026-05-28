export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type SubmissionStatus =
  | 'pending_you'
  | 'pending_co_reviewer'
  | 'awaiting_both'
  | 'approved'
  | 'changes_requested'
  | 'rejected';

export interface HelperEdit {
  id: string;
  whenAgo: string;
  proposed: string;
  action: 'Confirmed' | 'Skipped';
  resultingChange: string;
}

export interface ReviewerDecision {
  personaId: string;
  decision: ApprovalDecision;
  atAgo: string | null;
}

export interface Submission {
  appId: string;
  appName: string;
  appVersion: number;
  submittedByPersonaId: string;
  submittedAgo: string;
  sopName: string;
  evaluationScore: number;
  evaluationDelta: number;
  channels: ('digital' | 'voice' | 'sms' | 'email')[];
  blockerFlags: number;
  warningFlags: number;
  helperEditsCount: number;
  status: SubmissionStatus;
  reviewers: ReviewerDecision[];
  helperEdits: HelperEdit[];
  noteToReviewers?: string;
}

export const submissions: Submission[] = [
  {
    appId: 'app_hardship_assist',
    appName: 'hardship-assist',
    appVersion: 1,
    submittedByPersonaId: 'u_np',
    submittedAgo: '6 hr ago',
    sopName: 'Hardship_Plans_2026.docx',
    evaluationScore: 88,
    evaluationDelta: -3.1,
    channels: ['digital'],
    blockerFlags: 1,
    warningFlags: 2,
    helperEditsCount: 4,
    status: 'pending_you',
    reviewers: [
      { personaId: 'u_rs', decision: 'pending', atAgo: null },
      { personaId: 'u_md', decision: 'pending', atAgo: null },
    ],
    helperEdits: [
      {
        id: 'he_hs_1',
        whenAgo: '7 hr ago',
        proposed:
          'Add guardrail "Require income-loss documentation before drafting payment plan"',
        action: 'Confirmed',
        resultingChange: 'Guardrail added',
      },
      {
        id: 'he_hs_2',
        whenAgo: '7 hr ago',
        proposed: 'Attach TCPA outbound rules to Collections sub-agent',
        action: 'Confirmed',
        resultingChange: 'Knowledge attached',
      },
      {
        id: 'he_hs_3',
        whenAgo: '8 hr ago',
        proposed: 'Reword payment-plan offer template',
        action: 'Skipped',
        resultingChange: '(no change)',
      },
      {
        id: 'he_hs_4',
        whenAgo: '8 hr ago',
        proposed: 'Add escalation trigger on financial-distress signals',
        action: 'Confirmed',
        resultingChange: 'Escalation rule added',
      },
    ],
    noteToReviewers:
      'Blocker on income-documentation step is mitigated by the new guardrail added per Helper suggestion. Eval score dropped from prior run as a side effect — will reconverge as the new flow accumulates passing tests.',
  },
  {
    appId: 'app_fraud_triage',
    appName: 'fraud-triage',
    appVersion: 1,
    submittedByPersonaId: 'u_np',
    submittedAgo: '1 day ago',
    sopName: 'Fraud_Triage_v1.1.pdf',
    evaluationScore: 96,
    evaluationDelta: 0.8,
    channels: ['digital', 'voice'],
    blockerFlags: 0,
    warningFlags: 2,
    helperEditsCount: 2,
    status: 'pending_co_reviewer',
    reviewers: [
      { personaId: 'u_rs', decision: 'approved', atAgo: '20 hr ago' },
      { personaId: 'u_md', decision: 'pending', atAgo: null },
    ],
    helperEdits: [
      {
        id: 'he_fr_1',
        whenAgo: '1 day ago',
        proposed: 'Mask the account number in escalation messages',
        action: 'Confirmed',
        resultingChange: 'Guardrail added',
      },
      {
        id: 'he_fr_2',
        whenAgo: '1 day ago',
        proposed: 'Reframe accusatory phrasing',
        action: 'Confirmed',
        resultingChange: 'Response template updated',
      },
    ],
  },
];

export const decidedSubmissions: Submission[] = [
  {
    appId: 'app_card_dispute_triage',
    appName: 'card-dispute-triage',
    appVersion: 3,
    submittedByPersonaId: 'u_np',
    submittedAgo: '7 days ago',
    sopName: 'Card_Disputes_v3.2.pdf',
    evaluationScore: 94,
    evaluationDelta: 2.4,
    channels: ['digital', 'voice'],
    blockerFlags: 0,
    warningFlags: 1,
    helperEditsCount: 6,
    status: 'approved',
    reviewers: [
      { personaId: 'u_rs', decision: 'approved', atAgo: '6 days ago' },
      { personaId: 'u_md', decision: 'approved', atAgo: '6 days ago' },
    ],
    helperEdits: [
      {
        id: 'he_cd_1',
        whenAgo: '7 days ago',
        proposed: 'Add Reg E timeline guardrail',
        action: 'Confirmed',
        resultingChange: 'Guardrail added',
      },
      {
        id: 'he_cd_2',
        whenAgo: '7 days ago',
        proposed: 'Re-attach Reg E playbook',
        action: 'Confirmed',
        resultingChange: 'Knowledge re-attached',
      },
      {
        id: 'he_cd_3',
        whenAgo: '7 days ago',
        proposed: 'Remove Financial Wellness sub-agent',
        action: 'Confirmed',
        resultingChange: 'Sub-agent removed',
      },
    ],
  },
  {
    appId: 'app_account_opening',
    appName: 'account-opening-assistant',
    appVersion: 2,
    submittedByPersonaId: 'u_np',
    submittedAgo: '14 days ago',
    sopName: 'AOS_Onboarding.pdf',
    evaluationScore: 91,
    evaluationDelta: 1.2,
    channels: ['digital', 'sms'],
    blockerFlags: 0,
    warningFlags: 1,
    helperEditsCount: 3,
    status: 'approved',
    reviewers: [
      { personaId: 'u_rs', decision: 'approved', atAgo: '13 days ago' },
      { personaId: 'u_md', decision: 'approved', atAgo: '13 days ago' },
    ],
    helperEdits: [],
  },
];

export function getSubmissionByAppId(appId: string): Submission | undefined {
  return [...submissions, ...decidedSubmissions].find((s) => s.appId === appId);
}

export const reviewerStats = {
  reviewedThisMonth: 14,
  approved: 11,
  changesRequested: 2,
  rejected: 1,
  avgTimeToDecision: '1 day 6 hours',
};

export const coReviewerPersona = {
  id: 'u_md',
  name: 'Marco Davis',
  initials: 'MD',
  role: 'Compliance Co-Reviewer',
};
