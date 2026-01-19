"use client";

import React from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrimoPeriodoResultsTable } from './primo-periodo-results-table';
import { PrimoPeriodoStatsCards } from './primo-periodo-stats-cards';
import { PrimoPeriodoCharts } from './primo-periodo-charts';
import { PrimoPeriodoMaterieTable } from './primo-periodo-materie-table';
import { PrimoPeriodoControlliDashboard } from './primo-periodo-controlli-dashboard';
import { ReportViewer } from './report-viewer';
import { exportToExcel } from '@/lib/file-parser';
import { calculatePrimoPeriodoStats } from '@/lib/primo-periodo-stats';
import type { PrimoPeriodoOutputRow } from '@/lib/voti-utils';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Table as TableIcon
} from 'lucide-react';

interface PrimoPeriodoResultsPageProps {
  outputData: PrimoPeriodoOutputRow[];
  reportLines: string[];
  onBack: () => void;
}

export function PrimoPeriodoResultsPage({ outputData, reportLines, onBack }: PrimoPeriodoResultsPageProps) {
  // Calculate statistics
  const stats = React.useMemo(() => calculatePrimoPeriodoStats(outputData), [outputData]);
  
  const dataOra = reportLines.find(l => l.startsWith('Data/ora:'))?.replace('Data/ora:', '').trim() || '';

  const downloadExcel = React.useCallback(() => {
    if (outputData.length === 0) return;

    const timestamp = new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '').replace(/(\d{6})(\d{4})/, '$1-$2');
    const filename = `Voti_PrimoPeriodo_${timestamp}.xlsx`;
    
    exportToExcel(outputData, filename);
    toast.success('File Excel scaricato');
  }, [outputData]);

  const downloadCSV = React.useCallback(() => {
    if (outputData.length === 0) return;

    const csv = Papa.unparse(outputData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '').replace(/(\d{6})(\d{4})/, '$1-$2');
    link.href = url;
    link.download = `Voti_PrimoPeriodo_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('File CSV scaricato');
  }, [outputData]);

  const downloadReport = React.useCallback(() => {
    if (reportLines.length === 0) return;

    const text = reportLines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '').replace(/(\d{6})(\d{4})/, '$1-$2');
    link.href = url;
    link.download = `Report_PrimoPeriodo_${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report scaricato');
  }, [reportLines]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nuova elaborazione
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            Elaborazione Primo Periodo Completata
          </h1>
          {dataOra && (
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {dataOra}
            </p>
          )}
        </div>
      </div>

      {/* Download Section */}
      <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Scarica i File Elaborati
          </CardTitle>
          <CardDescription>
            Scarica i risultati dell&apos;elaborazione nei formati disponibili
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={downloadExcel}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Scarica Excel (.xlsx)
            </Button>
            <Button
              onClick={downloadCSV}
              variant="outline"
              size="lg"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Scarica CSV
            </Button>
            <Button
              onClick={downloadReport}
              variant="outline"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Scarica Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200">Dati Anonimizzati</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                I codici fiscali sono stati sostituiti con hash univoci non reversibili. 
                Le materie non didattiche (religione, comportamento, ecc.) sono state rimosse.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Dashboard Controlli */}
      <div className="mb-8">
        <PrimoPeriodoControlliDashboard stats={stats} reportLines={reportLines} />
      </div>

      <Separator className="my-8" />

      {/* Charts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Analisi Insufficienze Dettagliata</h2>
        <PrimoPeriodoCharts stats={stats} />
      </div>

      <Separator className="my-8" />

      {/* Materie Table */}
      <div className="mb-8">
        <PrimoPeriodoMaterieTable materie={stats.insufficienzePerMateria} />
      </div>

      <Separator className="my-8" />

      {/* Data and Report Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Dati e Report</CardTitle>
          <CardDescription>
            Visualizza i dati elaborati o il report testuale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Dati ({outputData.length} righe)
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Report Testuale
              </TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <PrimoPeriodoResultsTable data={outputData} />
            </TabsContent>
            <TabsContent value="report">
              <ReportViewer lines={reportLines} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}