"use client";

import React from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StatisticsCards } from './statistics-cards';
import { EsitiChart } from './esiti-chart';
import { ControlliDashboard } from './controlli-dashboard';
import { ResultsTable } from './results-table';
import { parseReportLines, type ReportData } from '@/lib/report-parser';
import { exportToExcel } from '@/lib/file-parser';
import type { OutputRow } from '@/lib/voti-utils';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface ResultsPageProps {
  outputData: OutputRow[];
  reportLines: string[];
  onBack: () => void;
}

export function ResultsPage({ outputData, reportLines, onBack }: ResultsPageProps) {
  const reportData: ReportData = React.useMemo(() => {
    return parseReportLines(reportLines);
  }, [reportLines]);

  const downloadExcel = React.useCallback(() => {
    if (outputData.length === 0) return;

    const timestamp = new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '').replace(/(\d{6})(\d{4})/, '$1-$2');
    const filename = `Voti_Complessivo_${timestamp}.xlsx`;
    
    const excelData = outputData.map(row => ({
      ...row,
      Hash: row.Hash.replace(/^'/, '')
    }));
    
    exportToExcel(excelData, filename);
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
    link.download = `Voti_Complessivo_${timestamp}.csv`;
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
    link.download = `Controlli_${timestamp}.txt`;
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
            Elaborazione Completata
          </h1>
          {reportData.dataOra && (
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {reportData.dataOra}
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
              Scarica Report Controlli
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Riepilogo</h2>
        <StatisticsCards data={reportData} />
      </div>

      <Separator className="my-8" />

      {/* Charts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Analisi Esiti</h2>
        <EsitiChart data={reportData} />
      </div>

      <Separator className="my-8" />

      {/* Controlli */}
      <div className="mb-8">
        <ControlliDashboard controlli={reportData.controlli} />
      </div>

      <Separator className="my-8" />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dati Elaborati</CardTitle>
          <CardDescription>
            Visualizza e cerca tra le {outputData.length} righe elaborate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsTable data={outputData} />
        </CardContent>
      </Card>
    </div>
  );
}