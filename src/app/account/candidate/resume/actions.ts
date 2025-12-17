'use server';

import { createClient } from '@/lib/supabase/server';

export interface AnalysisResult {
  ats_score: number;
  sections: {
    summary?: string;
    experience?: string[];
    skills?: string[];
    education?: string[];
  };
  suggestions: {
    category: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  strengths: string[];
  keywords_found: string[];
  keywords_missing: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
  upgrade_message?: string;
}

export interface OptimizeResponse {
  success: boolean;
  optimized_text?: string;
  error?: string;
  upgrade_url?: string;
}

export async function analyzeResume(
  resumeText: string,
  targetJobTitle?: string
): Promise<AnalyzeResponse> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-resume`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          target_job_title: targetJobTitle,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Analysis failed',
        upgrade_message: data.upgrade_message,
      };
    }

    return {
      success: true,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return { success: false, error: 'Failed to analyze resume' };
  }
}

export async function optimizeResume(
  resumeText: string,
  section: 'summary' | 'experience' | 'skills' | 'full',
  targetJobTitle?: string,
  additionalContext?: string
): Promise<OptimizeResponse> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/optimize-resume`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          section,
          target_job_title: targetJobTitle,
          additional_context: additionalContext,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Optimization failed',
        upgrade_url: data.upgrade_url,
      };
    }

    return {
      success: true,
      optimized_text: data.optimized_text,
    };
  } catch (error) {
    console.error('Error optimizing resume:', error);
    return { success: false, error: 'Failed to optimize resume' };
  }
}

export async function saveResumeVersion(
  originalText: string,
  optimizedText: string,
  atsScore: number,
  suggestions: AnalysisResult['suggestions'],
  sections: AnalysisResult['sections'],
  versionName?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .single();

    if (!candidate) {
      return { success: false, error: 'Candidate not found' };
    }

    const { data, error } = await supabase
      .from('resume_versions')
      .insert({
        candidate_id: candidate.id,
        version_name: versionName || 'Optimized Resume',
        original_text: originalText,
        optimized_text: optimizedText,
        ats_score: atsScore,
        suggestions,
        sections,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving resume version:', error);
      return { success: false, error: 'Failed to save resume' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error saving resume version:', error);
    return { success: false, error: 'Failed to save resume' };
  }
}

export async function getResumeVersions(): Promise<{
  versions: Array<{
    id: string;
    version_name: string;
    ats_score: number | null;
    is_primary: boolean;
    created_at: string;
  }>;
}> {
  try {
    const supabase = await createClient();

    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .single();

    if (!candidate) {
      return { versions: [] };
    }

    const { data, error } = await supabase
      .from('resume_versions')
      .select('id, version_name, ats_score, is_primary, created_at')
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resume versions:', error);
      return { versions: [] };
    }

    return { versions: data || [] };
  } catch (error) {
    console.error('Error fetching resume versions:', error);
    return { versions: [] };
  }
}
