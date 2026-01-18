"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ReportViewerProps {
  lines: string[];
}

export function ReportViewer({ lines }: ReportViewerProps) {
  const renderLine = (line: string, index: number) => {
    const isHeader = line.startsWith('=') || line.startsWith('-');
    const isOk = line.includes('✅');
    const isWarning = line.includes('⚠️');
    const isSection = line.match(/^[A-Z]\)/);

    if (isHeader) {
      return (
        <div key={index} className="text-muted-foreground font-mono text-xs">
          {line}
        </div>
      );
    }

    if (isOk) {
      return (
        <div key={index} className="flex items-start gap-2 text-green-600 dark:text-green-400 py-1">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{line.replace('✅', '').trim()}</span>
        </div>
      );
    }

    if (isWarning) {
      return (
        <div key={index} className="flex items-start gap-2 text-amber-600 dark:text-amber-400 py-1">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{line.replace('⚠️', '').trim()}</span>
        </div>
      );
    }

    if (isSection) {
      return (
        <div key={index} className="flex items-start gap-2 font-semibold text-primary mt-4 mb-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{line}</span>
        </div>
      );
    }

    return (
      <div key={index} className="py-0.5 pl-6">
        {line}
      </div>
    );
  };

  return (
    <ScrollArea className="h-[500px] border rounded-lg p-4 bg-muted/30">
      <div className="font-mono text-sm space-y-0.5">
        {lines.map((line, index) => renderLine(line, index))}
      </div>
    </ScrollArea>
  );
}