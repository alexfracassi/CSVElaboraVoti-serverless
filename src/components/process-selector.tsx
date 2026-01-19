"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GraduationCap, BookOpen } from 'lucide-react';
import type { ProcessType } from '@/lib/voti-utils';

interface ProcessSelectorProps {
  value: ProcessType;
  onChange: (value: ProcessType) => void;
}

export function ProcessSelector({ value, onChange }: ProcessSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          value === 'voti-finali'
            ? "border-2 border-primary bg-primary/5"
            : "border hover:border-primary/50"
        )}
        onClick={() => onChange('voti-finali')}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              value === 'voti-finali' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Voti Finali</h3>
              <p className="text-sm text-muted-foreground">
                Elaborazione scrutini finali con gestione degli esiti differiti (giugno + settembre)
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Unione file differiti + completo</li>
                <li>• Gestione esiti (ammesso/sospeso)</li>
                <li>• Controlli di coerenza</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          value === 'primo-periodo'
            ? "border-2 border-primary bg-primary/5"
            : "border hover:border-primary/50"
        )}
        onClick={() => onChange('primo-periodo')}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              value === 'primo-periodo' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Primo Periodo</h3>
              <p className="text-sm text-muted-foreground">
                Elaborazione voti del primo quadrimestre con anonimizzazione
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Singolo file di input</li>
                <li>• Anonimizzazione CF → Hash</li>
                <li>• Pulizia materie non didattiche</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}