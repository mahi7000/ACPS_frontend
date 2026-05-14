import React, { useCallback, useState } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  acceptedTypes: string[]; // e.g., ['application/pdf', 'image/jpeg']
  maxSizeMB: number;
  multiple?: boolean;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  acceptedTypes,
  maxSizeMB,
  multiple = false,
  label = 'Upload File',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    Array.from(files).forEach((file) => {
      if (!acceptedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(`File too large: ${file.name} (Max: ${maxSizeMB}MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : [validFiles[0]];
      setSelectedFiles(newFiles);
      onUpload(newFiles);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 bg-slate-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-sm text-slate-600 text-center">
          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supported: {acceptedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} (Max: {maxSizeMB}MB)
        </p>
      </div>

      {error && <p className="text-sm text-danger mt-2">{error}</p>}

      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, idx) => (
            <li key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-danger p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
