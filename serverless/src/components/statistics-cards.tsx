"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, School, BookOpen } from 'lucide-react';
import type { ReportData } from '@/lib/report-parser';

interface StatisticsCardsProps {
  data: ReportData;
}

export function StatisticsCards({ data }: StatisticsCardsProps) {
  const { riepilogo, statistiche, analisiEsiti } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Studenti Totali</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{riepilogo.studentiTotali}</div>
          <p className="text-xs text-muted-foreground">
            {riepilogo.righeTotali} righe elaborate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scrutini Sospesi</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{analisiEsiti.totaleSospesi}</div>
          <p className="text-xs text-muted-foreground">
            {riepilogo.studentiTotali > 0 
              ? `${((analisiEsiti.totaleSospesi / riepilogo.studentiTotali) * 100).toFixed(1)}% del totale`
              : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Classi</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistiche.studentiPerClasse.size}</div>
          <p className="text-xs text-muted-foreground">
            {statistiche.studentiPerAnno.size} anni, {statistiche.studentiPerSezione.size} sezioni
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ammessi (sospesi)</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {analisiEsiti.esitiFinaliSospesi.get('Ammesso')?.count ?? 
             analisiEsiti.esitiFinaliSospesi.get('ammesso')?.count ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {analisiEsiti.esitiFinaliSospesi.get('Ammesso')?.percentuale?.toFixed(1) ?? 
             analisiEsiti.esitiFinaliSospesi.get('ammesso')?.percentuale?.toFixed(1) ?? 0}% dei sospesi
          </p>
        </CardContent>
      </Card>
    </div>
  );
}