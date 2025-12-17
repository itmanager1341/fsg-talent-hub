// Utility functions for employer tier checks

export function canUseAIRanking(tier: string | null): boolean {
  return tier ? ['professional', 'enterprise'].includes(tier) : false;
}

export function canAccessResumeDatabase(tier: string | null): boolean {
  return tier ? ['starter', 'standard', 'professional', 'enterprise'].includes(tier) : false;
}

export const TIER_RANKING_LIMITS: Record<string, number> = {
  free: 0,
  starter: 10,
  standard: 10,
  professional: 100,
  enterprise: 999999,
};
