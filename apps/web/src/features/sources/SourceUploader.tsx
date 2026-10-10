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
    <div className="bg-[#15181e] rounded-lg border border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            Ground-Truth Sources &amp; Evidence
          </h2>
          <p className="text-[11px] text-zinc-500">
            Reference documents for claim grounding (.pdf, .docx, .txt, .md, max 10MB)
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-[#101216] p-0.5 rounded border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2.5 py-1 rounded transition text-xs ${
              mode === 'file' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-2.5 py-1 rounded transition text-xs ${
              mode === 'text' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded text-rose-300 text-xs flex items-center gap-2">
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
              ? 'border-zinc-400 bg-zinc-800/40'
              : 'border-zinc-700/80 hover:border-zinc-500 bg-[#101216]'
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
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-300">
              Drag &amp; drop reference documents, or <span className="text-zinc-100 underline">browse files</span>
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
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
            className="w-full bg-[#101216] border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
          <textarea
            rows={4}
            placeholder="Paste reference text or excerpt here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full bg-[#101216] border border-zinc-800 rounded p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-serif leading-relaxed"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !textContent.trim()}
            className="self-end px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition border border-zinc-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source Document</span>
          </button>
        </form>
      )}

      {/* Uploaded Sources List */}
      {sources.length > 0 && (
        <div className="mt-1 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Attached Sources ({sources.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((src) => (
              <div
                key={src.source_id}
                className="p-2 rounded bg-[#101216] border border-zinc-800 flex items-start gap-2"
              >
                <div className="p-1 rounded bg-zinc-800 text-zinc-400 shrink-0">
                  <FileCode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-zinc-200 truncate">{src.filename}</p>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase border border-zinc-700">
                      {src.file_type}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
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
