"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ControlloCoerenza } from '@/lib/report-parser';

interface ControlliListProps {
  controlli: ControlloCoerenza[];
}

function ControlloItem({ controllo }: { controllo: ControlloCoerenza }) {
  const [isExpanded, setIsExpanded] = React.useState(controllo.stato === 'warning');

  const getIcon = () => {
    switch (controllo.stato) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (controllo.stato) {
      case 'ok':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", getBgColor())}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium">{controllo.titolo}</p>
          {controllo.descrizione && (
            <p className="text-sm text-muted-foreground">{controllo.descrizione}</p>
          )}
        </div>
        {controllo.dettagli.length > 0 && (
          isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />
        )}
      </button>
      
      {isExpanded && controllo.dettagli.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-8 space-y-1">
            {controllo.dettagli.map((dettaglio, index) => (
              <p key={index} className="text-sm font-mono">
                {dettaglio}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ControlliList({ controlli }: ControlliListProps) {
  const okCount = controlli.filter(c => c.stato === 'ok').length;
  const warningCount = controlli.filter(c => c.stato === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Controlli di Coerenza</span>
          <div className="flex items-center gap-4 text-sm font-normal">
            {okCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {okCount} OK
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                {warningCount} Anomalie
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {controlli.map((controllo, index) => (
            <ControlloItem key={index} controllo={controllo} />
          ))}
          {controlli.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nessun controllo disponibile
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}