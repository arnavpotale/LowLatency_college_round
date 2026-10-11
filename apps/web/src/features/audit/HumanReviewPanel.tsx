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
    <div className="rounded-lg border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-4 space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] pb-2.5">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#176B58] dark:text-[#65B89D]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE]">
            Auditor Review &amp; Override
          </span>
        </div>
        {existingReview && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            Reviewed by {existingReview.reviewer}
          </span>
        )}
      </div>

      {/* Existing review banner if present */}
      {existingReview && (
        <div className="p-2.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
            <span>Decision: <strong className="text-[#17211D] dark:text-[#EDF2EE]">{existingReview.action.replace('_', ' ').toUpperCase()}</strong></span>
            <span>Original Machine: <strong className="text-[#17211D] dark:text-[#EDF2EE]">{existingReview.original_verdict}</strong></span>
          </div>
          {existingReview.notes && (
            <p className="text-[#17211D] dark:text-[#EDF2EE] text-[11px] italic font-sans">&ldquo;{existingReview.notes}&rdquo;</p>
          )}
        </div>
      )}

      {/* Action form */}
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-medium text-[#58645F] dark:text-[#A7B2AB] block mb-1.5">
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
                  className={`p-2.5 rounded text-left border transition ${
                    isSelected
                      ? 'bg-[#EBF5F1] dark:bg-[#19332A] border-[#176B58] dark:border-[#65B89D] text-[#176B58] dark:text-[#65B89D] ring-1 ring-[#176B58] dark:ring-[#65B89D] shadow-xs'
                      : 'bg-white dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
                  }`}
                >
                  <div className="font-semibold text-[11px] text-[#17211D] dark:text-[#EDF2EE]">{opt.label}</div>
                  <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] truncate">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-medium text-[#58645F] dark:text-[#A7B2AB] block mb-1">
              Audit Notes &amp; Justification:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified clinical appendix table 3 allows exception..."
              className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] text-xs font-sans"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#58645F] dark:text-[#A7B2AB] block mb-1">
              Auditor Name / Title:
            </label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="Reviewer ID"
              className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
            Preserves algorithmic audit trail alongside human judgment.
          </span>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Decision Saved</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Save Review Decision</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

