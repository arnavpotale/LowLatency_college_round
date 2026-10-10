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

  React.useEffect(() => {
    setTitle(initialTitle);
    setAnswer(initialAnswer);
  }, [initialTitle, initialAnswer]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const charCount = answer.length;

  return (
    <form onSubmit={handleSubmit} className="bg-[#15181e] rounded-lg border border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-zinc-400" />
            AI-Generated Answer for Verification
          </h2>
          <p className="text-[11px] text-zinc-500">
            Paste the LLM or AI-generated response you want to audit against source documents
          </p>
        </div>

        <input
          type="text"
          placeholder="Audit session title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#101216] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 w-full sm:w-56"
        />
      </div>

      <div className="relative">
        <textarea
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Paste AI answer text here (e.g. 'The recommended dosage is 100mg twice daily...')"
          className="w-full bg-[#101216] border border-zinc-800 rounded p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-serif leading-relaxed"
          required
        />
        <div className="absolute right-2.5 bottom-2 text-[10px] text-zinc-500 font-mono">
          {wordCount} words | {charCount} chars
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-zinc-500 font-mono text-[11px]">
          {!hasSources ? (
            <span className="text-amber-400">
              Note: Attaching source documents enables evidence grounding.
            </span>
          ) : (
            <span className="text-emerald-400">
              ✓ Ground-truth sources attached
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !answer.trim()}
          className="px-4 py-2 rounded bg-zinc-200 hover:bg-white disabled:opacity-50 text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Auditing Claims...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-zinc-900 text-zinc-900" />
              <span>Execute Audit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
