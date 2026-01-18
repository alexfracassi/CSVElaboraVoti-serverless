"use client";

import React, { useCallback, useState } from "react";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label: string;
  description?: string;
  selectedFile?: File | null;
  onClear?: () => void;
  disabled?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  accept = ".csv,.xlsx,.xls,.ods",
  label,
  description,
  selectedFile,
  onClear,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{selectedFile.name}</p>
              <p className="text-sm text-green-600">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="rounded-full p-1 hover:bg-green-100"
              disabled={disabled}
            >
              <X className="h-5 w-5 text-green-600" />
            </button>
          )}
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
        "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id={`file-input-${label.replace(/\s/g, "-")}`}
        disabled={disabled}
      />
      <label
        htmlFor={`file-input-${label.replace(/\s/g, "-")}`}
        className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
      >
        <div className="flex flex-col items-center gap-4">
          {isDragging ? (
            <File className="h-12 w-12 text-primary" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{label}</p>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, XLSX, XLS, ODS
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
