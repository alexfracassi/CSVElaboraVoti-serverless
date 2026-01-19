"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import type { PrimoPeriodoStats } from '@/lib/primo-periodo-stats';

interface PrimoPeriodoChartsProps {
  stats: PrimoPeriodoStats;
}

export function PrimoPeriodoCharts({ stats }: PrimoPeriodoChartsProps) {
  const [selectedAnno, setSelectedAnno] = useState<string>('tutti');
  
  const anni = Array.from(stats.studentiPerAnno.keys()).sort();
  
  const materieData = stats.insufficienzePerMateria
    .slice(0, 10)
    .map(m => ({
      materia: m.materia.length > 20 ? m.materia.slice(0, 20) + '...' : m.materia,
      materiaFull: m.materia,
      percentuale: m.percentualeInsuff,
      insufficienze: m.insufficienze,
      totale: m.totaleVoti,
    }));
  
  const distribuzioneData = selectedAnno === 'tutti' 
    ? stats.distribuzioneScuola 
    : stats.distribuzionePerAnno.get(selectedAnno) || [];
  
  const totaleStudentiSelezionati = selectedAnno === 'tutti'
    ? stats.totaleStudenti
    : stats.studentiPerAnno.get(selectedAnno) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Insufficienze per Materia</CardTitle>
          <CardDescription>
            Percentuale di voti insufficienti per ogni materia (top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {materieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={materieData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="materia" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: { payload?: { insufficienze?: number; totale?: number } }) => {
                    if (name === 'percentuale') {
                      return [
                        `${Number(value).toFixed(1)}% (${props?.payload?.insufficienze || 0}/${props?.payload?.totale || 0})`,
                        'Insufficienze'
                      ];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: string, payload: Array<{ payload?: { materiaFull?: string } }>) =>
                    payload?.[0]?.payload?.materiaFull || label
                  }
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar 
                  dataKey="percentuale" 
                  fill="hsl(var(--destructive))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Studenti per Numero di Insufficienze</CardTitle>
          <CardDescription>
            Percentuale di studenti raggruppati per numero di materie insufficienti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedAnno} onValueChange={setSelectedAnno} className="mb-4">
            <TabsList>
              <TabsTrigger value="tutti">Tutta la scuola</TabsTrigger>
              {anni.map(anno => (
                <TabsTrigger key={anno} value={anno}>
                  Anno {anno}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="text-sm text-muted-foreground mb-4">
            {selectedAnno === 'tutti' 
              ? `Totale: ${totaleStudentiSelezionati} studenti`
              : `Anno ${selectedAnno}: ${totaleStudentiSelezionati} studenti`
            }
          </div>

          {distribuzioneData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuzioneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="categoria"
                    label={({ percentuale }) => 
                      percentuale > 5 ? `${percentuale.toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {distribuzioneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.colore} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: { payload?: { percentuale?: number } }) => [
                      `${value} studenti (${(props?.payload?.percentuale || 0).toFixed(1)}%)`,
                      name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {distribuzioneData.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderLeftColor: item.colore, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.colore }}
                      />
                      <span className="font-medium">{item.categoria}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.percentuale.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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