'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  analyzeResume,
  optimizeResume,
  saveResumeVersion,
  type AnalysisResult,
} from './actions';

interface ResumeBuilderProps {
  candidateTier: string;
  currentResumeText?: string | null;
}

export function ResumeBuilder({
  candidateTier,
  currentResumeText,
}: ResumeBuilderProps) {
  const [resumeText, setResumeText] = useState(currentResumeText || '');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [optimizedText, setOptimizedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<
    'summary' | 'experience' | 'skills' | 'full'
  >('full');

  const isPremium = candidateTier === 'premium';

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);

    const result = await analyzeResume(resumeText, targetJobTitle);

    if (result.success && result.analysis) {
      setAnalysis(result.analysis);
    } else {
      setError(result.error || 'Analysis failed');
      if (result.upgrade_message) {
        setError(`${result.error}. ${result.upgrade_message}`);
      }
    }

    setIsAnalyzing(false);
  };

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setSuccessMessage(null);

    const result = await optimizeResume(
      resumeText,
      selectedSection,
      targetJobTitle
    );

    if (result.success && result.optimized_text) {
      setOptimizedText(result.optimized_text);
      setSuccessMessage('Resume optimized successfully!');
    } else {
      if (result.upgrade_url) {
        setError('This feature requires a Premium subscription.');
      } else {
        setError(result.error || 'Optimization failed');
      }
    }

    setIsOptimizing(false);
  };

  const handleSave = async () => {
    if (!analysis || !optimizedText) {
      setError('Please analyze and optimize your resume first');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await saveResumeVersion(
      resumeText,
      optimizedText,
      analysis.ats_score,
      analysis.suggestions,
      analysis.sections
    );

    if (result.success) {
      setSuccessMessage('Resume version saved!');
    } else {
      setError(result.error || 'Failed to save');
    }

    setIsSaving(false);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Resume Text
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Paste your resume text below for AI-powered analysis and
            optimization.
          </p>

          <div className="mb-4">
            <label
              htmlFor="targetJob"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Target Job Title (optional)
            </label>
            <input
              id="targetJob"
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            rows={12}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !resumeText.trim()}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          {error.includes('Premium') && (
            <Link
              href="/account/candidate/billing"
              className="mt-2 inline-block text-sm font-medium text-red-700 underline"
            >
              Upgrade to Premium
            </Link>
          )}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Analysis Results
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">ATS Score:</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    analysis.ats_score >= 80
                      ? 'bg-green-100 text-green-700'
                      : analysis.ats_score >= 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {analysis.ats_score}/100
                </span>
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 font-medium text-gray-900">Strengths</h3>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-600">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 font-medium text-gray-900">
                  Improvement Suggestions
                </h3>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColors[suggestion.priority]}`}
                        >
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {suggestion.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {suggestion.issue}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {suggestion.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium text-gray-900">
                  Keywords Found
                </h3>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords_found.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded bg-green-50 px-2 py-1 text-xs text-green-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900">
                  Suggested Keywords
                </h3>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords_missing.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-700"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Section (Premium) */}
      {analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Optimization
              </h2>
              {!isPremium && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  Premium Feature
                </span>
              )}
            </div>

            {isPremium ? (
              <>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Section to Optimize
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['full', 'summary', 'experience', 'skills'] as const).map(
                      (section) => (
                        <button
                          key={section}
                          onClick={() => setSelectedSection(section)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                            selectedSection === section
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="mb-4"
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
                </Button>

                {optimizedText && (
                  <div className="mt-4">
                    <h3 className="mb-2 font-medium text-gray-900">
                      Optimized Result
                    </h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {optimizedText}
                      </pre>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(optimizedText);
                          setSuccessMessage('Copied to clipboard!');
                        }}
                        variant="outline"
                      >
                        Copy to Clipboard
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Version'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="mb-3 text-sm text-purple-700">
                  Upgrade to Premium to unlock AI-powered resume optimization:
                </p>
                <ul className="mb-4 space-y-1 text-sm text-purple-600">
                  <li>• Section-by-section rewriting</li>
                  <li>• ATS optimization</li>
                  <li>• Multiple resume versions</li>
                  <li>• Unlimited analyses</li>
                </ul>
                <Link href="/account/candidate/billing">
                  <Button>Upgrade to Premium - $19/month</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
