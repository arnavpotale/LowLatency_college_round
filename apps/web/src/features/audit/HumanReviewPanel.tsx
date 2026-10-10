import React, { useState } from 'react';
import { Claim } from '../../types';
import { UserCheck, Shield, Check } from 'lucide-react';

interface HumanReviewPanelProps {
  claim: Claim;
  onSaveReview: (action: string, notes: string, reviewer: string) => Promise<void>;
  isLoading?: boolean;
}

export const HumanReviewPanel: React.FC<HumanReviewPanelProps> = ({
  claim,
  onSaveReview,
  isLoading = false
}) => {
  const existingReview = claim.human_review;
  const [selectedAction, setSelectedAction] = useState<string>(
    existingReview?.action || 'accept'
  );
  const [notes, setNotes] = useState<string>(existingReview?.notes || '');
  const [reviewer, setReviewer] = useState<string>(existingReview?.reviewer || 'Compliance Auditor');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveReview(selectedAction, notes, reviewer);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const actionOptions = [
    { id: 'accept', label: 'Accept Algorithmic Verdict', desc: 'Confirm machine finding is accurate' },
    { id: 'override_supported', label: 'Override → Supported', desc: 'Authoritative evidence confirms assertion' },
    { id: 'override_contradicted', label: 'Override → Contradicted', desc: 'Evidence refutes assertion despite algorithm' },
    { id: 'defer', label: 'Defer for Domain Specialist', desc: 'Requires clinical/legal specialist review' }
  ];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Auditor Review &amp; Override
          </span>
        </div>
        {existingReview && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
            Reviewed by {existingReview.reviewer}
          </span>
        )}
      </div>

      {/* Existing review banner if present */}
      {existingReview && (
        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Decision: <strong className="text-zinc-200">{existingReview.action.replace('_', ' ').toUpperCase()}</strong></span>
            <span>Original Machine: <strong className="text-zinc-200">{existingReview.original_verdict}</strong></span>
          </div>
          {existingReview.notes && (
            <p className="text-zinc-300 text-[11px] italic">&ldquo;{existingReview.notes}&rdquo;</p>
          )}
        </div>
      )}

      {/* Action form */}
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
            Auditor Finding Decision:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {actionOptions.map((opt) => {
              const isSelected = selectedAction === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelectedAction(opt.id)}
                  className={`p-2 rounded text-left border transition ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 ring-1 ring-zinc-500'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-medium text-[11px] text-zinc-200">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Audit Notes &amp; Justification:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified clinical appendix table 3 allows exception..."
              className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Auditor Name / Title:
            </label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="Reviewer ID"
              className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-zinc-500 font-mono">
            Preserves algorithmic audit trail alongside human judgment.
          </span>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Decision Saved</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Record Auditor Decision</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
