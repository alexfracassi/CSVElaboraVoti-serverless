"use client";

import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  label: string;
  description: string;
  accept?: string;
}

export function FileUploadZone({
  onFileSelect,
  selectedFile,
  onClear,
  label,
  description,
  accept = ".csv,.ods,.xlsx,.xls"
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'ods' || ext === 'xlsx' || ext === 'xls') {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    }
    return <FileText className="h-8 w-8 text-green-600" />;
  };

  const getFileTypeLabel = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ods': return 'OpenDocument Spreadsheet';
      case 'xlsx': return 'Excel Spreadsheet';
      case 'xls': return 'Excel Spreadsheet (legacy)';
      case 'csv': return 'CSV';
      default: return 'File';
    }
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-green-500 bg-green-50 dark:bg-green-950 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon(selectedFile.name)}
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">{selectedFile.name}</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {getFileTypeLabel(selectedFile.name)} • {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-green-700 dark:text-green-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id={`file-input-${label.replace(/\s/g, '-')}`}
      />
      <label
        htmlFor={`file-input-${label.replace(/\s/g, '-')}`}
        className="cursor-pointer"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="font-medium text-lg mb-1">{label}</p>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <p className="text-xs text-muted-foreground">
          Trascina qui il file o clicca per selezionarlo
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Formati supportati: CSV, ODS, XLSX, XLS
        </p>
      </label>
    </div>
  );
}