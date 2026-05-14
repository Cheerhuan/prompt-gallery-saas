'use client';
import React, { useState, useCallback } from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { useI18n } from '@/components/I18nProvider';

const GH_OWNER = 'Cheerhuan';
const GH_REPO = 'prompt-gallery-saas';
const GH_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues`;

interface SubmissionIssue {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
  user: { login: string; avatar_url: string };
  labels: { name: string }[];
}

export default function AdminReviewPage() {
  const { t } = useI18n();
  const [issues, setIssues] = useState<SubmissionIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPendingIssues = useCallback(async () => {
    setLoading(true);
    setStatus('Fetching pending submissions...');
    try {
      const resp = await fetch(
        `${GH_API}?state=open&labels=submission,pending-review&per_page=50&sort=created&direction=desc`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );

      if (!resp.ok) {
        if (resp.status === 403) {
          throw new Error('Rate limited by GitHub API (60 req/hr). Try again later.');
        }
        throw new Error(`GitHub API error (${resp.status})`);
      }

      const data = await resp.json();
      setIssues(data);
      setStatus(`✅ ${data.length} pending submission(s)`);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const parseSubmissionBody = (body: string) => {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  };

  const handleApprove = async (issue: SubmissionIssue) => {
    setActionLoading(issue.number);
    try {
      // Since we can't use GITHUB_TOKEN client-side, generate a command
      const parsedBody = parseSubmissionBody(issue.body);
      const promptTitle = issue.title.replace('[Submission] ', '');
      const promptData = parsedBody?.prompt || {};

      // Build the prompts.json addition command
      const newEntry = {
        id: 'NEW', // Will be auto-assigned
        title: promptData.title || promptTitle,
        full_prompt: promptData.full_prompt || '',
        image: promptData.reference_image || '',
        model: promptData.ai_model || 'Unknown',
        tags: promptData.tags || [],
        _source: 'user-submission',
        _issue: issue.number,
        _submitted_by: parsedBody?.user?.name || 'Anonymous',
      };

      const jsonStr = JSON.stringify(newEntry, null, 2);
      const cmd = [
        `# ── Approve Issue #${issue.number}: ${promptTitle} ──`,
        `# This requires a GitHub Token. Run in your local terminal:`,
        ``,
        `cd /Users/xiebinghuan/rescue_build && \\`,
        `gh issue close ${issue.number} --repo ${GH_OWNER}/${GH_REPO} && \\`,
        `gh issue comment ${issue.number} --repo ${GH_OWNER}/${GH_REPO} --body "✅ Approved! Adding to gallery..." && \\`,
        `gh issue edit ${issue.number} --repo ${GH_OWNER}/${GH_REPO} --remove-label "pending-review" --add-label "approved"`,
        ``,
        `# Then add this entry to src/data/prompts.json:`,
        `node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("src/data/prompts.json","utf8"));const e=${jsonStr};e.id=String(Math.max(...p.map(x=>parseInt(x.id)||0),0)+1);p.push(e);fs.writeFileSync("src/data/prompts.json",JSON.stringify(p,null,2)+"\\n");console.log("✅ Added "+e.title)'`,
        ``,
        `# Then build and push:`,
        `npm run build && git add -A && git commit -m "feat: approve submission #${issue.number}: ${promptTitle.slice(0, 40)}" && git push origin main`,
      ].join('\n');

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(cmd);
        setStatus(`✅ Command copied! Paste in Terminal to approve Issue #${issue.number}`);
      } catch {
        setStatus(`📋 Could not auto-copy. Check the expanded entry below for instructions.`);
      }

      setExpandedIssue(issue.number);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (issue: SubmissionIssue) => {
    setActionLoading(issue.number);
    try {
      const promptTitle = issue.title.replace('[Submission] ', '');
      const cmd = [
        `# ── Reject Issue #${issue.number}: ${promptTitle} ──`,
        `# Requires GitHub CLI + Token. Run in Terminal:`,
        ``,
        `gh issue close ${issue.number} --repo ${GH_OWNER}/${GH_REPO} && \\`,
        `gh issue comment ${issue.number} --repo ${GH_OWNER}/${GH_REPO} --body "❌ Submission rejected. See review notes above." && \\`,
        `gh issue edit ${issue.number} --repo ${GH_OWNER}/${GH_REPO} --remove-label "pending-review" --add-label "rejected"`,
      ].join('\n');

      try {
        await navigator.clipboard.writeText(cmd);
        setStatus(`✅ Rejection command copied! Paste in Terminal for Issue #${issue.number}`);
      } catch {
        setStatus(`📋 Could not auto-copy. Check entry below for instructions.`);
      }

      setExpandedIssue(issue.number);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />
      <main id="main-content" className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                Review Submissions
              </h1>
              <p className="text-zinc-400 text-sm">
                Review user-submitted prompts. Approve or reject pending submissions.
              </p>
            </div>

            <button
              onClick={fetchPendingIssues}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {loading ? 'Loading...' : '🔄 Fetch Pending'}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className={`mb-6 p-3 rounded-xl text-sm ${
              status.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
              status.startsWith('❌') ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
              'bg-zinc-900/60 border border-zinc-800 text-zinc-400'
            }`}>
              {status}
            </div>
          )}

          {/* Info box */}
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
            <p className="font-medium">⚠️ GitHub Token Required for Actions</p>
            <p className="text-amber-400/70">
              Approve/Reject actions require a <code className="text-amber-300">GITHUB_TOKEN</code>. 
              Since this is a static site, clicking Approve or Reject will copy a Terminal command to your clipboard — 
              paste and run it locally to execute the actual action.
            </p>
            <p className="text-amber-400/70">
              Alternatively, manage issues directly on{' '}
              <a href={`https://github.com/${GH_OWNER}/${GH_REPO}/issues`} target="_blank" rel="noopener noreferrer" className="underline">
                GitHub Issues
              </a>.
            </p>
          </div>

          {/* Issues list */}
          {issues.length > 0 ? (
            <div className="space-y-4">
              {issues.map(issue => {
                const parsedBody = parseSubmissionBody(issue.body);
                const promptData = parsedBody?.prompt || {};
                const isExpanded = expandedIssue === issue.number;

                return (
                  <div
                    key={issue.number}
                    className={`glass-panel rounded-2xl overflow-hidden transition-all ${
                      isExpanded ? 'ring-1 ring-indigo-500/30' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded">
                              #{issue.number}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(issue.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-base font-medium text-white truncate">
                            {issue.title.replace('[Submission] ', '')}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <img
                              src={issue.user.avatar_url}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="text-xs text-zinc-500">{issue.user.login}</span>
                            {issue.labels.map(l => (
                              <span
                                key={l.name}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                  l.name === 'pending-review'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                }`}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(issue)}
                            disabled={actionLoading === issue.number}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoading === issue.number ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(issue)}
                            disabled={actionLoading === issue.number}
                            className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Reject
                          </button>
                          <button
                            onClick={() => setExpandedIssue(isExpanded ? null : issue.number)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && parsedBody && (
                      <div className="border-t border-zinc-800/60 px-5 pb-5 pt-4 space-y-4">
                        {/* Prompt data preview */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prompt Data</h4>
                          <div className="bg-black/50 rounded-xl p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-zinc-600">Model:</span>{' '}
                                <span className="text-zinc-300">{promptData.ai_model || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-600">Tags:</span>{' '}
                                <span className="text-zinc-300">
                                  {promptData.tags?.length ? promptData.tags.join(', ') : 'None'}
                                </span>
                              </div>
                            </div>
                            {promptData.reference_image && (
                              <div>
                                <span className="text-zinc-600 text-xs">Reference:</span>{' '}
                                <a href={promptData.reference_image} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs underline break-all">
                                  {promptData.reference_image}
                                </a>
                              </div>
                            )}
                            <div>
                              <span className="text-zinc-600 text-xs">Full prompt:</span>
                              <pre className="text-xs text-zinc-300 mt-1 bg-black/50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                                {promptData.full_prompt || 'N/A'}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Action guide */}
                        <div className="bg-zinc-900/60 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Terminal Command (copied to clipboard)
                          </h4>
                          <p className="text-[10px] text-zinc-600 mb-2">
                            Open Terminal.app, paste the command, and press Enter.
                            You need the <code className="text-indigo-400">gh</code> CLI installed and authenticated.
                          </p>
                          <a
                            href={`https://github.com/${GH_OWNER}/${GH_REPO}/issues/${issue.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            View on GitHub
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Show raw body if not parsed */}
                    {isExpanded && !parsedBody && (
                      <div className="border-t border-zinc-800/60 px-5 pb-5 pt-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Raw Body</h4>
                        <pre className="text-xs text-zinc-500 bg-black/50 rounded-xl p-4 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                          {issue.body}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-zinc-400 mb-2">No pending submissions</h3>
                <p className="text-sm text-zinc-600 max-w-md mx-auto">
                  Click "Fetch Pending" to load submissions from GitHub Issues. 
                  Submissions appear here when users submit prompts via the Submit page.
                </p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
