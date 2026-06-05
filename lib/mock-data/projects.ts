export type ProjectStatus = 'active' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  tag: string;
  status: ProjectStatus;
  ownerPersonaId: string;
  memberCount: number;
  reviewerCount: number;
  appCount: number;
  sopCount: number;
  avgEvaluationScore: number;
  conversations24h: number;
  monthlyBudget: number;
  mtdSpend: number;
  defaultChannels: ('digital' | 'voice' | 'sms' | 'email')[];
  /** ISO date string of project creation */
  createdAt: string;
}

export const projects: Project[] = [
  {
    id: 'proj_card_services',
    name: 'CRM Connectors',
    description:
      'HubSpot and Salesforce read-only connectors for customer, activity, and usage data.',
    tag: 'CRM Connectors',
    status: 'active',
    ownerPersonaId: 'u_jc',
    memberCount: 3,
    reviewerCount: 3,
    appCount: 3,
    sopCount: 2,
    avgEvaluationScore: 95,
    conversations24h: 1240,
    monthlyBudget: 1200,
    mtdSpend: 744,
    defaultChannels: ['digital', 'voice'],
    createdAt: '2026-03-12',
  },
  {
    id: 'proj_member_onboarding',
    name: 'Support Connectors',
    description:
      'Zendesk and ticketing integrations for support operations and service analytics.',
    tag: 'Support Connectors',
    status: 'active',
    ownerPersonaId: 'u_jc',
    memberCount: 4,
    reviewerCount: 2,
    appCount: 2,
    sopCount: 1,
    avgEvaluationScore: 91,
    conversations24h: 412,
    monthlyBudget: 900,
    mtdSpend: 188,
    defaultChannels: ['digital', 'sms'],
    createdAt: '2026-04-02',
  },
  {
    id: 'proj_collections',
    name: 'Scheduling Connectors',
    description:
      'Calendly-style scheduling connectors for invitee, event, and usage visibility.',
    tag: 'Scheduling Connectors',
    status: 'active',
    ownerPersonaId: 'u_jc',
    memberCount: 2,
    reviewerCount: 2,
    appCount: 2,
    sopCount: 1,
    avgEvaluationScore: 88,
    conversations24h: 0,
    monthlyBudget: 600,
    mtdSpend: 42,
    defaultChannels: ['digital'],
    createdAt: '2026-04-21',
  },
  {
    id: 'proj_lending',
    name: 'Template Library',
    description: 'Vetted connector templates used as starting points for new independent connectors.',
    tag: 'Template Library',
    status: 'active',
    ownerPersonaId: 'u_jc',
    memberCount: 2,
    reviewerCount: 1,
    appCount: 3,
    sopCount: 1,
    avgEvaluationScore: 79,
    conversations24h: 0,
    monthlyBudget: 800,
    mtdSpend: 32,
    defaultChannels: ['digital'],
    createdAt: '2026-05-08',
  },
];

export const projectAppMap: Record<string, string> = {
  // appId → projectId
  app_card_dispute_triage: 'proj_card_services',
  app_fraud_triage: 'proj_card_services',
  app_account_opening: 'proj_member_onboarding',
  app_hardship_assist: 'proj_collections',
  app_loan_intake: 'proj_lending',
};

export const projectSOPMap: Record<string, string> = {
  // sopId → projectId
  sop_card_disputes: 'proj_card_services',
  sop_fraud_triage: 'proj_card_services',
  sop_acct_opening: 'proj_member_onboarding',
  sop_hardship: 'proj_collections',
  sop_loans: 'proj_lending',
};

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export const defaultProjectId = projects[0].id;
