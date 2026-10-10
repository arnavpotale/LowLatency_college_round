import React, { useState } from 'react';
import { Play, RefreshCw, Bot } from 'lucide-react';

interface AuditInputFormProps {
  initialTitle: string;
  initialAnswer: string;
  onSubmit: (title: string, answer: string) => Promise<void>;
  isLoading: boolean;
  hasSources: boolean;
}

export const AuditInputForm: React.FC<AuditInputFormProps> = ({
  initialTitle,
  initialAnswer,
  onSubmit,
  isLoading,
  hasSources
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [answer, setAnswer] = useState(initialAnswer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;
    await onSubmit(title.trim() || 'Untitled Audit', answer.trim());
  };

  // Keep state updated if parent updates initialAnswer (e.g. from Load Demo Sample)
  React.useEffect(() => {
    setTitle(initialTitle);
    setAnswer(initialAnswer);
  }, [initialTitle, initialAnswer]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const charCount = answer.length;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            AI-Generated Answer for Verification
          </h2>
          <p className="text-xs text-slate-400">
            Paste the LLM or AI-generated response you want to audit against source documents
          </p>
        </div>

        <input
          type="text"
          placeholder="Audit session title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
        />
      </div>

      <div className="relative">
        <textarea
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Paste AI answer text here (e.g. 'The recommended dosage is 100mg twice daily...')"
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
          required
        />
        <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono">
          {wordCount} words | {charCount} chars
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-400">
          {!hasSources ? (
            <span className="text-amber-400 text-xs">
              ⚠️ Note: Attaching source documents enables evidence retrieval & grounding.
            </span>
          ) : (
            <span className="text-emerald-400 text-xs">
              ✓ Ready for ground-truth verification
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !answer.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Auditing Claims...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Audit Verification</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
