// Plan features and limits (no shared types import needed - inline here)
export interface IPlanFeatures {
  maxProjects: number;
  maxTeamMembers: number;
  storageGB: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  apiAccess: boolean;
}

export interface IPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: IPlanFeatures;
  description: string;
  popular?: boolean;
}

export const PLAN_FEATURES: Record<string, IPlanFeatures> = {
  free: { maxProjects: 3, maxTeamMembers: 5, storageGB: 1, advancedAnalytics: false, prioritySupport: false, customIntegrations: false, apiAccess: false },
  starter: { maxProjects: 10, maxTeamMembers: 15, storageGB: 10, advancedAnalytics: false, prioritySupport: false, customIntegrations: false, apiAccess: true },
  pro: { maxProjects: 50, maxTeamMembers: 50, storageGB: 100, advancedAnalytics: true, prioritySupport: true, customIntegrations: true, apiAccess: true },
  enterprise: { maxProjects: -1, maxTeamMembers: -1, storageGB: 1000, advancedAnalytics: true, prioritySupport: true, customIntegrations: true, apiAccess: true },
};

export const PLANS: IPlan[] = [
  { id: 'free', name: 'Free', price: 0, billingCycle: 'monthly', features: PLAN_FEATURES.free, description: 'Perfect for individuals' },
  { id: 'starter', name: 'Starter', price: 9, billingCycle: 'monthly', features: PLAN_FEATURES.starter, description: 'Great for small teams' },
  { id: 'pro', name: 'Pro', price: 29, billingCycle: 'monthly', features: PLAN_FEATURES.pro, description: 'Everything for growing teams', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 99, billingCycle: 'monthly', features: PLAN_FEATURES.enterprise, description: 'Unlimited for large orgs' },
];
