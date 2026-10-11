import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Plus, FileCode } from 'lucide-react';
import { Source } from '../../types';

interface SourceUploaderProps {
  sources: Source[];
  onUploadFile: (file: File) => Promise<void>;
  onAddTextSource: (title: string, content: string) => Promise<void>;
  isLoading: boolean;
}

export const SourceUploader: React.FC<SourceUploaderProps> = ({
  sources,
  onUploadFile,
  onAddTextSource,
  isLoading
}) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await validateAndUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      await validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = async (file: File) => {
    const validExtensions = ['pdf', 'txt', 'md', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      setUploadError(`Unsupported file format .${ext}. Only .pdf, .docx, .txt, and .md files are accepted.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    try {
      await onUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload source file.');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;
    try {
      await onAddTextSource(textTitle.trim() || 'pasted_source.txt', textContent.trim());
      setTextTitle('');
      setTextContent('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to add text source.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#191F1C] rounded-lg border border-[#DCE3DF] dark:border-[#343E38] p-4 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
            Ground-Truth Sources &amp; Evidence
          </h2>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
            Reference documents for claim grounding (.pdf, .docx, .txt, .md, max 10MB)
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-[#F6F7F8] dark:bg-[#111614] p-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38] text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2.5 py-1 rounded transition text-xs ${
              mode === 'file' ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] font-semibold shadow-xs' : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-2.5 py-1 rounded transition text-xs ${
              mode === 'text' ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] font-semibold shadow-xs' : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* File Upload Zone */}
      {mode === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-[#176B58] dark:border-[#65B89D] bg-[#EBF5F1] dark:bg-[#19332A]'
              : 'border-[#DCE3DF] dark:border-[#343E38] hover:border-[#176B58] dark:hover:border-[#65B89D] bg-[#F6F7F8] dark:bg-[#111614]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <div className="w-8 h-8 rounded bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-center text-[#58645F] dark:text-[#A7B2AB]">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#17211D] dark:text-[#EDF2EE]">
              Drag &amp; drop reference documents, or <span className="text-[#176B58] dark:text-[#65B89D] underline">browse files</span>
            </p>
            <p className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] mt-0.5 font-mono">
              Accepts PDF, Word (.docx), Plain Text (.txt), and Markdown (.md)
            </p>
          </div>
        </div>
      ) : (
        /* Text Paste Area */
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="Document label (e.g. Clinical Trial Findings.txt)"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="w-full bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded px-3 py-1.5 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] font-mono"
          />
          <textarea
            rows={4}
            placeholder="Paste reference text or excerpt here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] rounded p-3 text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] font-sans leading-relaxed"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !textContent.trim()}
            className="self-end px-3 py-1.5 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] disabled:opacity-50 text-white dark:text-[#0E1A15] text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source Document</span>
          </button>
        </form>
      )}

      {/* Uploaded Sources List */}
      {sources.length > 0 && (
        <div className="mt-1 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB]">
            Attached Sources ({sources.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((src) => (
              <div
                key={src.source_id}
                className="p-2 rounded bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex items-start gap-2"
              >
                <div className="p-1 rounded bg-white dark:bg-[#191F1C] text-[#176B58] dark:text-[#65B89D] shrink-0 border border-[#DCE3DF] dark:border-[#343E38]">
                  <FileCode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-[#17211D] dark:text-[#EDF2EE] truncate">{src.filename}</p>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] uppercase border border-[#BCD8CD] dark:border-[#2C5E4E]">
                      {src.file_type}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] mt-0.5 font-mono">
                    {src.char_count.toLocaleString()} chars
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
