import React, { useState } from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse, Source } from '../types';
import { apiClient } from '../services/api';
import { DEMO_SAMPLE_ANSWER, DEMO_SAMPLE_SOURCE } from '../mocks/sampleData';
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  FileCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface CreateAuditPageProps {
  onAuditCreated: (audit: AuditResponse) => void;
  onLoadDemo?: () => void;
}

export const CreateAuditPage: React.FC<CreateAuditPageProps> = ({
  onAuditCreated
}) => {
  const { navigate } = useRouter();

  // Step state (1 to 4)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState<string>('Clinical Guidelines Review');
  const [notes, setNotes] = useState<string>('Evaluating safety, dosage inflation, and contraindicated beta-blocker interactions.');
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [answerText, setAnswerText] = useState<string>('');

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pasteTitle, setPasteTitle] = useState<string>('protocol_reference.txt');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [sourceInputMode, setSourceInputMode] = useState<'upload' | 'paste'>('upload');

  // Launch state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or get backend audit session
  const ensureAuditSession = async (): Promise<string> => {
    if (currentAuditId) return currentAuditId;
    const newAudit = await apiClient.createAudit(title || 'Untitled Audit', notes);
    setCurrentAuditId(newAudit.audit_id);
    return newAudit.audit_id;
  };

  // Step 1 -> Step 2
  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please specify an audit title.');
      return;
    }
    setErrorMsg(null);
    try {
      await ensureAuditSession();
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize audit session.');
    }
  };

  // Upload file handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const auditId = await ensureAuditSession();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await apiClient.uploadSourceFile(auditId, file);
        setSources((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'File upload failed. Ensure file is .pdf, .docx, .txt, or .md and under 10MB.');
    } finally {
      setIsUploading(false);
    }
  };

  // Paste text handler
  const handlePasteSubmit = async () => {
    if (!pasteContent.trim()) {
      setUploadError('Please provide text content.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const auditId = await ensureAuditSession();
      const uploaded = await apiClient.uploadSourceText(
        auditId,
        pasteTitle.trim() || 'pasted_source.txt',
        pasteContent.trim()
      );
      setSources((prev) => [...prev, uploaded]);
      setPasteContent('');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to save text source.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete source handler
  const handleDeleteSource = async (sourceId: string) => {
    if (!currentAuditId) return;
    try {
      await apiClient.deleteSource(currentAuditId, sourceId);
      setSources((prev) => prev.filter((s) => s.source_id !== sourceId));
    } catch (err) {
      console.error('Delete source failed:', err);
    }
  };

  // Step 4: Run Verification
  const handleRunVerification = async () => {
    if (!currentAuditId) return;
    if (!answerText.trim()) {
      setErrorMsg('Answer text cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Submit answer
      await apiClient.submitAnswer(currentAuditId, answerText);
      // 2. Fetch full current audit object
      const fullAudit = await apiClient.getAudit(currentAuditId);
      onAuditCreated(fullAudit);
      // 3. Navigate to Processing page
      navigate(`/audits/${currentAuditId}/processing`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit answer for verification.');
      setIsSubmitting(false);
    }
  };

  // Helper: Load demo sample inputs into form
  const handlePrefillDemo = async () => {
    setTitle('Clinical & Financial Risk Audit (Demo Sample)');
    setNotes('Evaluating Metaproterenol prescribing guidelines, dosage inflation, and contraindications.');
    setAnswerText(DEMO_SAMPLE_ANSWER);
    setPasteTitle('clinical_protocol_metaproterenol.txt');
    setPasteContent(DEMO_SAMPLE_SOURCE);
    setSourceInputMode('paste');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Wizard Step Progression Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>STEP {step} OF 4</span>
          <span>{Math.round((step / 4) * 100)}% COMPLETED</span>
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Audit Details' },
            { num: 2, label: 'Reference Material' },
            { num: 3, label: 'AI Answer' },
            { num: 4, label: 'Review & Run' }
          ].map((s) => (
            <div key={s.num} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s.num ? 'bg-emerald-500' : 'bg-zinc-800'
                }`}
              />
              <div className="text-[11px] font-mono truncate text-zinc-400">
                {s.num}. {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Audit Details */}
      {step === 1 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-7 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-100">Step 1 · Audit Details</h2>
            <p className="text-xs text-zinc-400">
              Name your audit and describe what clinical, technical, or financial assertions you intend to investigate.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleStep1Continue} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Audit Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Clinical Guidelines Review"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Investigation Objective / Notes <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe specific risk areas: dosage limits, contraindications, numerical metrics..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60">
              <button
                type="button"
                onClick={handlePrefillDemo}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition font-mono"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill with clinical demo inputs</span>
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition"
              >
                <span>Continue to Reference Material</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Reference Material */}
      {step === 2 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-7 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-100">Step 2 · Reference Material</h2>
            <p className="text-xs text-zinc-400">
              Upload authoritative reference documents. Supported formats: <strong>.pdf, .docx, .txt, .md</strong> (up to 10MB each).
            </p>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Mode Switcher: File Upload vs Text Paste */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setSourceInputMode('upload')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                sourceInputMode === 'upload'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upload Document Files
            </button>
            <button
              onClick={() => setSourceInputMode('paste')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                sourceInputMode === 'paste'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Paste Reference Text
            </button>
          </div>

          {sourceInputMode === 'upload' ? (
            <div className="space-y-4">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/80 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/70 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-zinc-200">
                  {isUploading ? 'Extracting & Ingesting Document...' : 'Drag & drop files here, or click to browse'}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                  Accepts PDF, DOCX, TXT, MD · Max 10MB
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Source filename (e.g. guidelines.txt)"
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={5}
                placeholder="Paste reference text passage here..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 resize-none font-mono"
              />
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={isUploading || !pasteContent.trim()}
                className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-medium text-zinc-200 transition"
              >
                {isUploading ? 'Attaching...' : 'Attach Pasted Source'}
              </button>
            </div>
          )}

          {/* List of Attached Sources */}
          {sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="text-xs font-semibold text-zinc-300">
                Attached Reference Sources ({sources.length}):
              </div>
              <div className="space-y-2">
                {sources.map((s) => (
                  <div
                    key={s.source_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-zinc-200 truncate">{s.filename}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {s.file_type.toUpperCase()} · {s.char_count} characters
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(s.source_id)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Remove source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (sources.length === 0) {
                  setUploadError('Please attach at least one reference document or text source.');
                  return;
                }
                setUploadError(null);
                setStep(3);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition"
            >
              <span>Continue to AI Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI-Generated Answer */}
      {step === 3 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-7 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-100">Step 3 · AI-Generated Answer</h2>
            <p className="text-xs text-zinc-400">
              Paste the full AI-generated response you want to audit. The system decomposes it into individual claims.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Submitted Text:</span>
              <span className="font-mono">{answerText.length} characters</span>
            </div>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={8}
              placeholder="Paste the complete AI response here..."
              className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setAnswerText(DEMO_SAMPLE_ANSWER)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert sample answer text</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!answerText.trim()) {
                  setErrorMsg('Answer text cannot be empty.');
                  return;
                }
                setErrorMsg(null);
                setStep(4);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition"
            >
              <span>Review Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Run Verification */}
      {step === 4 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-7 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-100">Step 4 · Review &amp; Run Verification</h2>
            <p className="text-xs text-zinc-400">
              Confirm your inputs before launching the autonomous verification engine.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Summary Item: Audit Title */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                AUDIT SESSION
              </div>
              <div className="text-sm font-semibold text-zinc-100">{title}</div>
              {notes && <p className="text-xs text-zinc-400">{notes}</p>}
            </div>

            {/* Summary Item: Reference Documents */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                REFERENCE MATERIAL ({sources.length})
              </div>
              <div className="space-y-1">
                {sources.map((s) => (
                  <div key={s.source_id} className="text-xs text-zinc-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">{s.filename}</span>
                    <span className="text-zinc-400 font-mono">({s.char_count} chars)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Item: Submitted Answer */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <span>SUBMITTED ANSWER</span>
                <span>{answerText.length} CHARS</span>
              </div>
              <p className="text-xs text-zinc-300 line-clamp-3 italic bg-zinc-950 p-2.5 rounded border border-zinc-800/80">
                &ldquo;{answerText}&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleRunVerification}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-semibold text-xs shadow-md transition"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Answer...</span>
                </>
              ) : (
                <>
                  <span>Run Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
