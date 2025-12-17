'use server';

import { createClient } from '@/lib/supabase/server';

export interface OverviewStats {
  totalRequests: number;
  totalCostCents: number;
  cacheHits: number;
  cacheHitRate: number;
  uniqueUsers: number;
}

export interface TierUsage {
  tier: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface CompanyAtLimit {
  id: string;
  name: string;
  tier: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface CacheStats {
  totalEntries: number;
  expiringToday: number;
}

export interface RecentActivity {
  id: string;
  created_at: string;
  company_name: string | null;
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  cached: boolean;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const supabase = await createClient();

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('id, cost_cents, cached, user_id')
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error fetching overview stats:', error);
    return {
      totalRequests: 0,
      totalCostCents: 0,
      cacheHits: 0,
      cacheHitRate: 0,
      uniqueUsers: 0,
    };
  }

  const logs = data || [];
  const totalRequests = logs.length;
  const totalCostCents = logs.reduce((sum, log) => sum + (log.cost_cents || 0), 0);
  const cacheHits = logs.filter((log) => log.cached).length;
  const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
  const uniqueUsers = new Set(logs.map((log) => log.user_id)).size;

  return {
    totalRequests,
    totalCostCents,
    cacheHits,
    cacheHitRate,
    uniqueUsers,
  };
}

export async function getTierUsage(): Promise<TierUsage[]> {
  const supabase = await createClient();

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get rate limits
  const { data: limits } = await supabase
    .from('ai_rate_limits')
    .select('tier, requests_per_day');

  const rateLimits = new Map<string, number>();
  (limits || []).forEach((limit) => {
    rateLimits.set(limit.tier, limit.requests_per_day);
  });

  // Get usage by company tier
  const { data: usageLogs } = await supabase
    .from('ai_usage_logs')
    .select('company_id, companies!inner(tier)')
    .gte('created_at', today.toISOString());

  // Count usage by tier
  const tierCounts = new Map<string, number>();
  (usageLogs || []).forEach((log) => {
    const company = Array.isArray(log.companies) ? log.companies[0] : log.companies;
    const tier = company?.tier || 'free';
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
  });

  // Build result
  const tiers = ['free', 'starter', 'professional', 'enterprise'];
  return tiers.map((tier) => {
    const used = tierCounts.get(tier) || 0;
    const limit = rateLimits.get(tier) || 10;
    return {
      tier,
      used,
      limit,
      percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  });
}

export async function getCompaniesAtLimit(): Promise<CompanyAtLimit[]> {
  const supabase = await createClient();

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get rate limits
  const { data: limits } = await supabase
    .from('ai_rate_limits')
    .select('tier, requests_per_day');

  const rateLimits = new Map<string, number>();
  (limits || []).forEach((limit) => {
    rateLimits.set(limit.tier, limit.requests_per_day);
  });

  // Get usage grouped by company
  const { data: usageLogs } = await supabase
    .from('ai_usage_logs')
    .select('company_id, companies!inner(id, name, tier)')
    .gte('created_at', today.toISOString());

  // Count usage by company
  const companyUsage = new Map<string, { name: string; tier: string; count: number }>();
  (usageLogs || []).forEach((log) => {
    if (!log.company_id) return;
    const company = Array.isArray(log.companies) ? log.companies[0] : log.companies;
    if (!company) return;

    const existing = companyUsage.get(log.company_id);
    if (existing) {
      existing.count++;
    } else {
      companyUsage.set(log.company_id, {
        name: company.name,
        tier: company.tier || 'free',
        count: 1,
      });
    }
  });

  // Filter to companies at or above 80%
  const results: CompanyAtLimit[] = [];
  companyUsage.forEach((data, companyId) => {
    const limit = rateLimits.get(data.tier) || 10;
    const percentage = limit > 0 ? Math.round((data.count / limit) * 100) : 0;
    if (percentage >= 80) {
      results.push({
        id: companyId,
        name: data.name,
        tier: data.tier,
        used: data.count,
        limit,
        percentage,
      });
    }
  });

  return results.sort((a, b) => b.percentage - a.percentage);
}

export async function getCacheStats(): Promise<CacheStats> {
  const supabase = await createClient();

  // Get total cache entries
  const { count: totalEntries } = await supabase
    .from('ai_jd_cache')
    .select('id', { count: 'exact', head: true });

  // Get entries expiring today
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { count: expiringToday } = await supabase
    .from('ai_jd_cache')
    .select('id', { count: 'exact', head: true })
    .gte('expires_at', today.toISOString())
    .lt('expires_at', tomorrow.toISOString());

  return {
    totalEntries: totalEntries || 0,
    expiringToday: expiringToday || 0,
  };
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('id, created_at, feature, model, input_tokens, output_tokens, cost_cents, cached, companies(name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }

  return (data || []).map((log) => {
    const companies = log.companies as { name: string } | { name: string }[] | null;
    let companyName: string | null = null;
    if (companies) {
      if (Array.isArray(companies)) {
        companyName = companies[0]?.name || null;
      } else {
        companyName = companies.name || null;
      }
    }

    return {
      id: log.id,
      created_at: log.created_at,
      company_name: companyName,
      feature: log.feature,
      model: log.model,
      input_tokens: log.input_tokens,
      output_tokens: log.output_tokens,
      cost_cents: log.cost_cents,
      cached: log.cached || false,
    };
  });
}
