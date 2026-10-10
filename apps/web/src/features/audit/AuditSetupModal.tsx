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

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14161d] border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#161922]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-zinc-800 text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Setup Evidence Audit Session
              </h2>
              <p className="text-[11px] text-zinc-400">
                Attach ground-truth documents and input the AI-generated answer to verify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono border border-zinc-800 transition flex items-center gap-1.5"
              title="Load pre-configured medical & financial trial demo"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Load Sample Case</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
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
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  Reference Documents
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
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
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  Answer for Verification
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {wordCount} words
                </span>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Audit title (e.g. Clinical Trial Response Q3)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#101216] border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />

                <textarea
                  rows={8}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Paste the AI-generated answer here for claim decomposition and evidence grounding..."
                  className="w-full flex-1 bg-[#101216] border border-zinc-800 rounded p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-serif leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 font-mono">
              {sources.length === 0 ? (
                <span className="text-amber-400">
                  ⚠️ Note: Add at least one source document for ground-truth verification.
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to audit against {sources.length} reference source{sources.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded text-zinc-400 hover:text-zinc-200 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !answer.trim()}
                className="px-5 py-2 rounded bg-zinc-200 hover:bg-white disabled:opacity-50 text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Claims...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-zinc-900" />
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
