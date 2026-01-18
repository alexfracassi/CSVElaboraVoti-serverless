"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, BookOpen, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import type { PrimoPeriodoStats } from '@/lib/primo-periodo-stats';

interface PrimoPeriodoStatsCardsProps {
  stats: PrimoPeriodoStats;
}

export function PrimoPeriodoStatsCards({ stats }: PrimoPeriodoStatsCardsProps) {
  // Calcola studenti senza insufficienze
  const studentiSenzaInsuff = stats.distribuzioneScuola.find(d => d.categoria === 'Nessuna insuff.')?.count || 0;
  const percentualeSenzaInsuff = stats.totaleStudenti > 0 
    ? (studentiSenzaInsuff / stats.totaleStudenti) * 100 
    : 0;

  // Calcola studenti con 4+ insufficienze
  const studentiCon4PiuInsuff = stats.distribuzioneScuola.find(d => d.categoria === '4+ insufficienze')?.count || 0;
  const percentualeCon4PiuInsuff = stats.totaleStudenti > 0 
    ? (studentiCon4PiuInsuff / stats.totaleStudenti) * 100 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Studenti</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totaleStudenti}</div>
          <p className="text-xs text-muted-foreground">
            in {stats.totaleClassi} classi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Materie</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totaleMaterie}</div>
          <p className="text-xs text-muted-foreground">
            materie didattiche
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Insufficienze</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {stats.percentualeInsuffTotale.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            su tutti i voti
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Media Orale</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.mediaVotiOrali.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            voti orali
          </p>
        </CardContent>
      </Card>

      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Senza Insuff.</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {percentualeSenzaInsuff.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {studentiSenzaInsuff} studenti
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">4+ Insuff.</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {percentualeCon4PiuInsuff.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {studentiCon4PiuInsuff} studenti
          </p>
        </CardContent>
      </Card>
    </div>
  );
}