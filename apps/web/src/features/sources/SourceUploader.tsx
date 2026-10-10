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
    const validExtensions = ['pdf', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      setUploadError(`Unsupported file format .${ext}. Only .pdf, .txt, and .md files are accepted.`);
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
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Source Documents & Evidence Base
          </h2>
          <p className="text-xs text-slate-400">
            Ground truth documents used to verify or refute claims (.pdf, .txt, .md, max 10MB)
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              mode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
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
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              Drag and drop source documents, or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports PDF, Plain Text (.txt), and Markdown (.md)
            </p>
          </div>
        </div>
      ) : (
        /* Text Paste Area */
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Document label (e.g. Clinical Trial Findings.txt)"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            rows={4}
            placeholder="Paste reference text or excerpt here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !textContent.trim()}
            className="self-end px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source Document</span>
          </button>
        </form>
      )}

      {/* Uploaded Sources List */}
      {sources.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Attached Sources ({sources.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((src) => (
              <div
                key={src.source_id}
                className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5"
              >
                <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{src.filename}</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                      {src.file_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {src.char_count.toLocaleString()} characters
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
