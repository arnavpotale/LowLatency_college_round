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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#191F1C] rounded-lg border border-[#DCE3DF] dark:border-[#343E38] p-4 flex flex-col gap-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
            AI-Generated Answer for Verification
          </h2>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
            Paste the LLM or AI-generated response you want to audit against source documents
          </p>
        </div>

        <input
          type="text"
          placeholder="Audit session title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded px-2.5 py-1 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] w-full sm:w-56"
        />
      </div>

      <div className="relative">
        <textarea
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Paste AI answer text here (e.g. 'The recommended dosage is 100mg twice daily...')"
          className="w-full bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded p-3 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] font-sans leading-relaxed"
          required
        />
        <div className="absolute right-2.5 bottom-2 text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
          {wordCount} words | {charCount} chars
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono text-[11px]">
          {!hasSources ? (
            <span className="text-[#965B0A] dark:text-[#E5AC48]">
              Note: Attaching source documents enables evidence grounding.
            </span>
          ) : (
            <span className="text-[#0E6245] dark:text-[#65B89D]">
              ✓ Ground-truth sources attached
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !answer.trim()}
          className="px-4 py-2 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] disabled:opacity-50 text-white dark:text-[#0E1A15] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Auditing Claims...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-current" />
              <span>Execute Audit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
