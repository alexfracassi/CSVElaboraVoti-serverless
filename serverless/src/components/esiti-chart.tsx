"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import type { ReportData } from '@/lib/report-parser';

interface EsitiChartProps {
  data: ReportData;
}

const COLORS_MAP: Record<string, string> = {
  'Ammesso': '#22c55e',
  'ammesso': '#22c55e',
  'Non ammesso': '#ef4444',
  'non ammesso': '#ef4444',
  'Sospeso': '#f59e0b',
  'sospeso': '#f59e0b',
};

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function getColor(name: string, index: number): string {
  return COLORS_MAP[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function EsitiChart({ data }: EsitiChartProps) {
  const { analisiEsiti, statistiche } = data;

  // Prepare data for esiti iniziali pie chart
  const esitiInizialiData = Array.from(analisiEsiti.esitiIniziali.entries()).map(([name, value], index) => ({
    name,
    value,
    color: getColor(name, index)
  }));

  // Prepare data for esiti finali sospesi
  const esitiFinaliData = Array.from(analisiEsiti.esitiFinaliSospesi.entries()).map(([name, data], index) => ({
    name,
    value: data.count,
    percentuale: data.percentuale,
    color: getColor(name, index)
  }));

  // Prepare data for students per class bar chart
  const classiData = Array.from(statistiche.studentiPerClasse.entries())
    .map(([classe, count]) => ({ classe, studenti: count }))
    .sort((a, b) => a.classe.localeCompare(b.classe));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Esiti Iniziali */}
      <Card>
        <CardHeader>
          <CardTitle>Esiti Iniziali (Giugno)</CardTitle>
          <CardDescription>Distribuzione degli esiti dello scrutinio di giugno</CardDescription>
        </CardHeader>
        <CardContent>
          {esitiInizialiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={esitiInizialiData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {esitiInizialiData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} studenti`, 'Totale']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          )}
        </CardContent>
      </Card>

      {/* Esiti Finali Sospesi */}
      <Card>
        <CardHeader>
          <CardTitle>Esiti Finali (Sospesi)</CardTitle>
          <CardDescription>Risultati dello scrutinio differito per gli studenti sospesi</CardDescription>
        </CardHeader>
        <CardContent>
          {esitiFinaliData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={esitiFinaliData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentuale }) => `${name} (${percentuale.toFixed(0)}%)`}
                  labelLine={false}
                >
                  {esitiFinaliData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} studenti`, 'Totale']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          )}
        </CardContent>
      </Card>

      {/* Studenti per Classe */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Studenti per Classe</CardTitle>
          <CardDescription>Distribuzione degli studenti nelle diverse classi</CardDescription>
        </CardHeader>
        <CardContent>
          {classiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="classe" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`${value} studenti`, 'Totale']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="studenti" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}