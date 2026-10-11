import React, { useState } from 'react';
import { Source } from '../../types';
import { SourceUploader } from '../sources/SourceUploader';
import { Play, RefreshCw, X, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface AuditSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  onUploadFile: (file: File) => Promise<void>;
  onAddTextSource: (title: string, content: string) => Promise<void>;
  onSubmit: (title: string, answer: string) => Promise<void>;
  onLoadDemo: () => void;
  isLoading: boolean;
  initialTitle?: string;
  initialAnswer?: string;
}

export const AuditSetupModal: React.FC<AuditSetupModalProps> = ({
  isOpen,
  onClose,
  sources,
  onUploadFile,
  onAddTextSource,
  onSubmit,
  onLoadDemo,
  isLoading,
  initialTitle = '',
  initialAnswer = ''
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [answer, setAnswer] = useState(initialAnswer);

  React.useEffect(() => {
    setTitle(initialTitle);
    setAnswer(initialAnswer);
  }, [initialTitle, initialAnswer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;
    await onSubmit(title.trim() || 'Evidence Audit Session', answer.trim());
    onClose();
  };

  const handlePrefillLiveInputs = async () => {
    setTitle('Clinical Hypertension Protocol Audit');
    setAnswer(
      'The recommended starting dose for adult hypertension is 10mg once daily.\n' +
      'In severe cases, the maximum allowable dosage is 100mg per day.\n' +
      'The medication should be administered via subcutaneous injection twice daily.'
    );
    if (sources.length === 0) {
      await onAddTextSource(
        'clinical_guidelines.txt',
        '## Clinical Guidelines: Hypertension Management\n' +
        'Line 2: The recommended starting dose for adult hypertension is 10mg orally once daily.\n' +
        'Line 3: In severe cases, the dosage may be titrated up to 20mg daily.\n' +
        'Line 4: Under no circumstances should the dosage exceed 40mg per day due to nephrotoxicity risk.\n' +
        'Line 5: Patients must be monitored for electrolyte imbalances every two weeks.'
      );
    }
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between bg-[#F6F7F8] dark:bg-[#202824]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE]">
                Setup Evidence Audit Session
              </h2>
              <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
                Attach ground-truth documents and input the AI-generated answer to verify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrefillLiveInputs}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-mono border border-[#DCE3DF] dark:border-[#343E38] transition flex items-center gap-1.5"
              title="Prefill sample ground-truth document and answer for a live demo"
            >
              <Sparkles className="w-3 h-3 text-[#176B58] dark:text-[#65B89D]" />
              <span>Prefill Live Demo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] text-xs font-mono border border-[#DCE3DF] dark:border-[#343E38] transition flex items-center gap-1.5"
              title="Load pre-configured medical & financial trial demo"
            >
              <Sparkles className="w-3 h-3 text-[#965B0A] dark:text-[#E5AC48]" />
              <span>Load Sample Case</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#7E8C86] dark:text-[#738078] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: 2 Clean Steps */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Step 1: Reference Documents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] font-mono text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  Reference Documents
                </span>
                <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
                  {sources.length} attached
                </span>
              </div>
              <SourceUploader
                sources={sources}
                onUploadFile={onUploadFile}
                onAddTextSource={onAddTextSource}
                isLoading={isLoading}
              />
            </div>

            {/* Step 2: Answer to Verify */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] font-mono text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  Answer for Verification
                </span>
                <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
                  {wordCount} words
                </span>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Audit title (e.g. Clinical Trial Response Q3)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded px-3 py-1.5 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D]"
                />

                <textarea
                  rows={8}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Paste the AI-generated answer here for claim decomposition and evidence grounding..."
                  className="w-full flex-1 bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded p-3 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] font-sans leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between">
            <div className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
              {sources.length === 0 ? (
                <span className="text-[#965B0A] dark:text-[#E5AC48]">
                  ⚠️ Note: Add at least one source document for ground-truth verification.
                </span>
              ) : (
                <span className="text-[#0E6245] dark:text-[#65B89D] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to audit against {sources.length} reference source{sources.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !answer.trim()}
                className="px-5 py-2 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] disabled:opacity-50 text-white dark:text-[#0E1A15] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Claims...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-current" />
                    <span>Run Evidence Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
