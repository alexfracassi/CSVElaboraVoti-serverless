"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ResultsTable } from "@/components/results-table";
import { PrimoPeriodoControlliDashboard } from "@/components/primo-periodo-controlli-dashboard";
import { VotiFinaliControlliDashboard } from "@/components/voti-finali-controlli-dashboard";
import { parseSpreadsheetFile, exportToExcel } from "@/lib/file-parser";
import { processVotiFiles } from "@/lib/voti-processor";
import { processPrimoPeriodoFile } from "@/lib/primo-periodo-processor";
import { calculatePrimoPeriodoStats } from "@/lib/primo-periodo-stats";
import { parseReportLines } from "@/lib/report-parser";
import type { OutputRow, PrimoPeriodoOutputRow, ProcessType } from "@/lib/voti-utils";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Play,
  Loader2,
  Info,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  FileText
} from "lucide-react";

type AppState = "upload" | "results";

export default function HomePage() {
  const [processType, setProcessType] = useState<ProcessType>("voti-finali");
  const [appState, setAppState] = useState<AppState>("upload");

  // Voti Finali state
  const [diffFile, setDiffFile] = useState<File | null>(null);
  const [allFile, setAllFile] = useState<File | null>(null);
  const [diffData, setDiffData] = useState<Record<string, string>[]>([]);
  const [allData, setAllData] = useState<Record<string, string>[]>([]);
  const [outputData, setOutputData] = useState<OutputRow[]>([]);

  // Primo Periodo state
  const [primoPeriodoFile, setPrimoPeriodoFile] = useState<File | null>(null);
  const [primoPeriodoData, setPrimoPeriodoData] = useState<Record<string, string>[]>([]);
  const [primoPeriodoOutputData, setPrimoPeriodoOutputData] = useState<PrimoPeriodoOutputRow[]>([]);

  // Common state
  const [reportLines, setReportLines] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Voti Finali handlers
  const handleDiffFileSelect = useCallback(async (file: File) => {
    setDiffFile(file);
    try {
      const data = await parseSpreadsheetFile(file);
      setDiffData(data);
      toast.success(`File differiti caricato: ${data.length} righe`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nel parsing del file differiti");
      setDiffFile(null);
      setDiffData([]);
    }
  }, []);

  const handleAllFileSelect = useCallback(async (file: File) => {
    setAllFile(file);
    try {
      const data = await parseSpreadsheetFile(file);
      setAllData(data);
      toast.success(`File completo caricato: ${data.length} righe`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nel parsing del file completo");
      setAllFile(null);
      setAllData([]);
    }
  }, []);

  // Primo Periodo handlers
  const handlePrimoPeriodoFileSelect = useCallback(async (file: File) => {
    setPrimoPeriodoFile(file);
    try {
      const data = await parseSpreadsheetFile(file);
      setPrimoPeriodoData(data);
      toast.success(`File primo periodo caricato: ${data.length} righe`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nel parsing del file");
      setPrimoPeriodoFile(null);
      setPrimoPeriodoData([]);
    }
  }, []);

  // Process handlers
  const handleProcessVotiFinali = useCallback(async () => {
    if (diffData.length === 0 || allData.length === 0) {
      toast.error("Carica entrambi i file prima di elaborare");
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setErrors([]);

    try {
      setProgress(30);
      const result = await processVotiFiles(diffData, allData);
      setProgress(80);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        toast.error("Elaborazione completata con errori");
      } else {
        toast.success(`Elaborazione completata: ${result.outputData.length} righe generate`);
      }

      setOutputData(result.outputData);
      setReportLines(result.reportLines);
      setProgress(100);

      if (result.outputData.length > 0) {
        setTimeout(() => {
          setAppState("results");
        }, 500);
      }
    } catch (error) {
      toast.error("Errore durante l'elaborazione");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [diffData, allData]);

  const handleProcessPrimoPeriodo = useCallback(async () => {
    if (primoPeriodoData.length === 0) {
      toast.error("Carica il file prima di elaborare");
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setErrors([]);

    try {
      setProgress(30);
      const result = await processPrimoPeriodoFile(primoPeriodoData);
      setProgress(80);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        toast.error("Elaborazione completata con errori");
      } else {
        toast.success(`Elaborazione completata: ${result.outputData.length} righe generate`);
      }

      setPrimoPeriodoOutputData(result.outputData);
      setReportLines(result.reportLines);
      setProgress(100);

      if (result.outputData.length > 0) {
        setTimeout(() => {
          setAppState("results");
        }, 500);
      }
    } catch (error) {
      toast.error("Errore durante l'elaborazione");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [primoPeriodoData]);

  const handleProcess = useCallback(() => {
    if (processType === "voti-finali") {
      handleProcessVotiFinali();
    } else {
      handleProcessPrimoPeriodo();
    }
  }, [processType, handleProcessVotiFinali, handleProcessPrimoPeriodo]);

  const handleBack = useCallback(() => {
    setAppState("upload");
    setOutputData([]);
    setPrimoPeriodoOutputData([]);
    setReportLines([]);
    setDiffFile(null);
    setAllFile(null);
    setDiffData([]);
    setAllData([]);
    setPrimoPeriodoFile(null);
    setPrimoPeriodoData([]);
    setErrors([]);
    setProgress(0);
  }, []);

  const handleExportVotiFinali = () => {
    if (outputData.length === 0) return;
    exportToExcel(
      outputData,
      `voti_finali_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("File Excel esportato");
  };

  const handleExportPrimoPeriodo = () => {
    if (primoPeriodoOutputData.length === 0) return;
    exportToExcel(
      primoPeriodoOutputData,
      `primo_periodo_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("File Excel esportato");
  };

  const downloadReport = useCallback(() => {
    if (reportLines.length === 0) return;
    const text = reportLines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '').replace(/(\d{6})(\d{4})/, '$1-$2');
    link.href = url;
    link.download = `Report_${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report scaricato');
  }, [reportLines]);

  const canProcessVotiFinali = diffData.length > 0 && allData.length > 0 && !isProcessing;
  const canProcessPrimoPeriodo = primoPeriodoData.length > 0 && !isProcessing;
  const canProcess = processType === "voti-finali" ? canProcessVotiFinali : canProcessPrimoPeriodo;

  // Voti Finali columns
  const votiFinaliColumns = [
    { key: "Hash", label: "Hash" },
    { key: "Classe_Sigla", label: "Classe" },
    { key: "Materia", label: "Materia" },
    {
      key: "EsitoIniziale",
      label: "Esito Iniziale",
      render: (value: unknown) => {
        const esito = String(value || "").toLowerCase();
        let className = "px-2 py-1 rounded text-xs font-medium ";
        if (esito.includes("ammesso") && !esito.includes("non")) {
          className += "bg-green-100 text-green-800";
        } else if (esito.includes("non ammesso")) {
          className += "bg-red-100 text-red-800";
        } else if (esito.includes("sospeso")) {
          className += "bg-yellow-100 text-yellow-800";
        } else {
          className += "bg-gray-100 text-gray-800";
        }
        return <span className={className}>{String(value)}</span>;
      },
    },
    { key: "EsitoInizialeNumerico", label: "Num. Iniz." },
    {
      key: "EsitoFinale",
      label: "Esito Finale",
      render: (value: unknown) => {
        const esito = String(value || "").toLowerCase();
        let className = "px-2 py-1 rounded text-xs font-medium ";
        if (esito.includes("ammesso") && !esito.includes("non")) {
          className += "bg-green-100 text-green-800";
        } else if (esito.includes("non ammesso")) {
          className += "bg-red-100 text-red-800";
        } else if (esito.includes("sospeso")) {
          className += "bg-yellow-100 text-yellow-800";
        } else {
          className += "bg-gray-100 text-gray-800";
        }
        return <span className={className}>{String(value)}</span>;
      },
    },
    { key: "EsitoFinaleNumerico", label: "Num. Fin." },
  ];

  // Primo Periodo columns
  const primoPeriodoColumns = [
    { key: "Hash", label: "Hash" },
    { key: "Classe_Sigla", label: "Classe" },
    { key: "Materia", label: "Materia" },
    {
      key: "VotoScritto",
      label: "Scritto",
      render: (value: unknown) => {
        const strVal = String(value ?? "");
        const voto = parseFloat(strVal);
        if (isNaN(voto) || strVal === "") return "-";
        let className = "px-2 py-1 rounded text-xs font-medium ";
        className += voto < 6 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
        return <span className={className}>{strVal}</span>;
      },
    },
    {
      key: "VotoOrale",
      label: "Orale",
      render: (value: unknown) => {
        const strVal = String(value ?? "");
        const voto = parseFloat(strVal);
        if (isNaN(voto) || strVal === "") return "-";
        let className = "px-2 py-1 rounded text-xs font-medium ";
        className += voto < 6 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
        return <span className={className}>{strVal}</span>;
      },
    },
    {
      key: "VotoPratico",
      label: "Pratico",
      render: (value: unknown) => {
        const strVal = String(value ?? "");
        const voto = parseFloat(strVal);
        if (isNaN(voto) || strVal === "") return "-";
        let className = "px-2 py-1 rounded text-xs font-medium ";
        className += voto < 6 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
        return <span className={className}>{strVal}</span>;
      },
    },
    { key: "OreAssenza", label: "Assenze" },
  ];

  // Results page for Primo Periodo with Dashboard
  if (appState === "results" && processType === "primo-periodo") {
    const stats = calculatePrimoPeriodoStats(primoPeriodoOutputData);
    const dataOra = reportLines.find(l => l.startsWith('Data/ora:'))?.replace('Data/ora:', '').trim() || '';

    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <Button variant="ghost" onClick={handleBack} className="mb-2 -ml-2">
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
          <Card className="mb-8 border-green-200 bg-green-50/50">
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
                  onClick={handleExportPrimoPeriodo}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Scarica Excel (.xlsx)
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
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Dati Anonimizzati</h3>
                  <p className="text-sm text-blue-700 mt-1">
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

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dati Elaborati</CardTitle>
              <CardDescription>
                {primoPeriodoOutputData.length} righe elaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable data={primoPeriodoOutputData} columns={primoPeriodoColumns} pageSize={25} />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Results page for Voti Finali with Dashboard
  if (appState === "results" && processType === "voti-finali") {
    const reportData = parseReportLines(reportLines);
    const dataOra = reportLines.find(l => l.startsWith('Data/ora:'))?.replace('Data/ora:', '').trim() || '';

    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <Button variant="ghost" onClick={handleBack} className="mb-2 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nuova elaborazione
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                Elaborazione Voti Finali Completata
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
          <Card className="mb-8 border-green-200 bg-green-50/50">
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
                  onClick={handleExportVotiFinali}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Scarica Excel (.xlsx)
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
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Dati Elaborati</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    I dati degli scrutini differiti sono stati uniti con i dati completi. 
                    Gli esiti iniziali e finali sono stati calcolati automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Dashboard Controlli Voti Finali */}
          <div className="mb-8">
            <VotiFinaliControlliDashboard reportData={reportData} />
          </div>

          <Separator className="my-8" />

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dati Elaborati</CardTitle>
              <CardDescription>
                {outputData.length} righe elaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable data={outputData} columns={votiFinaliColumns} pageSize={25} />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Upload page
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Elaborazione Voti - Serverless
          </h1>
          <p className="mt-2 text-gray-600">
            Seleziona il tipo di elaborazione e carica i file necessari
          </p>
        </div>

        {/* Process Type Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border bg-white p-1">
            <button
              onClick={() => setProcessType("voti-finali")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                processType === "voti-finali"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Voti Finali
            </button>
            <button
              onClick={() => setProcessType("primo-periodo")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                processType === "primo-periodo"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Primo Periodo
            </button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              {processType === "voti-finali" ? "Elaborazione Voti Finali" : "Elaborazione Primo Periodo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            {processType === "voti-finali" ? (
              <ol className="list-decimal list-inside space-y-1">
                <li>Carica il file degli <strong>scrutini differiti</strong> (studenti con sospensione a giugno)</li>
                <li>Carica il file <strong>completo</strong> con tutti gli studenti e le materie</li>
                <li>Clicca su <strong>Elabora File</strong> per unire i dati</li>
                <li>Visualizza i risultati e scarica i file elaborati</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                <li>Carica il file dei <strong>voti del primo periodo</strong></li>
                <li>I codici fiscali verranno <strong>anonimizzati</strong> con hash</li>
                <li>Le materie non didattiche verranno <strong>rimosse</strong></li>
                <li>Scarica il file elaborato pronto per l&apos;analisi</li>
              </ol>
            )}
          </CardContent>
        </Card>

        {/* File Upload Section */}
        {processType === "voti-finali" ? (
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  File Scrutini Differiti
                </CardTitle>
                <CardDescription>
                  File CSV o ODS con i voti degli studenti con sospensione a giugno
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFileSelect={handleDiffFileSelect}
                  selectedFile={diffFile}
                  onClear={() => { setDiffFile(null); setDiffData([]); }}
                  label="Scrutini Differiti"
                  description="Contiene: cognome, nome, materia, voto, voto_differito, esito, esito_differito"
                />
                {diffData.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {diffData.length} righe caricate
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  File Completo Studenti
                </CardTitle>
                <CardDescription>
                  File CSV o ODS con tutti gli studenti e tutte le materie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFileSelect={handleAllFileSelect}
                  selectedFile={allFile}
                  onClear={() => { setAllFile(null); setAllData([]); }}
                  label="Tutti gli Studenti"
                  description="Contiene: codice_fisc, materia_desc, valore, classe_sigla, ecc."
                />
                {allData.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {allData.length} righe caricate
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                File Voti Primo Periodo
              </CardTitle>
              <CardDescription>
                File CSV o ODS con i voti del primo quadrimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFileSelect={handlePrimoPeriodoFileSelect}
                selectedFile={primoPeriodoFile}
                onClear={() => { setPrimoPeriodoFile(null); setPrimoPeriodoData([]); }}
                label="Voti Primo Periodo"
                description="Contiene: CodiceFiscaleAlunno, Anno, Sezione, DescrizioneMateria, VotoScritto, VotoOraleUnico, ecc."
              />
              {primoPeriodoData.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {primoPeriodoData.length} righe caricate
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Process Button */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleProcess}
                disabled={!canProcess}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Elaborazione in corso...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Elabora File
                  </>
                )}
              </Button>

              {!canProcess && !isProcessing && (
                <p className="text-sm text-muted-foreground">
                  {processType === "voti-finali"
                    ? "Carica entrambi i file per procedere"
                    : "Carica il file per procedere"}
                </p>
              )}
            </div>

            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Elaborazione in corso... {progress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Errori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-destructive">{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Tutti i dati vengono elaborati localmente nel browser. Nessun dato viene inviato a server esterni.
          </p>
        </footer>
      </div>
    </main>
  );
}