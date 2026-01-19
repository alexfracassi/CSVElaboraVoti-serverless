"use client";

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileUploadZone } from './file-upload-zone';
import { ProcessSelector } from './process-selector';
import { ResultsPage } from './results-page';
import { PrimoPeriodoResultsPage } from './primo-periodo-results-page';
import { processVotiFiles } from '@/lib/voti-processor';
import { processPrimoPeriodoFile } from '@/lib/primo-periodo-processor';
import { parseSpreadsheetFile } from '@/lib/file-parser';
import type { OutputRow, PrimoPeriodoOutputRow, ProcessType } from '@/lib/voti-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  FileSpreadsheet, 
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

type AppState = 'upload' | 'results';

export function VotiComplessivoApp() {
  const [processType, setProcessType] = useState<ProcessType>('voti-finali');
  const [appState, setAppState] = useState<AppState>('upload');
  
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
      toast.error(error instanceof Error ? error.message : 'Errore nel parsing del file differiti');
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
      toast.error(error instanceof Error ? error.message : 'Errore nel parsing del file completo');
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
      toast.error(error instanceof Error ? error.message : 'Errore nel parsing del file');
      setPrimoPeriodoFile(null);
      setPrimoPeriodoData([]);
    }
  }, []);

  // Process handlers
  const handleProcessVotiFinali = useCallback(async () => {
    if (diffData.length === 0 || allData.length === 0) {
      toast.error('Carica entrambi i file prima di elaborare');
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
        toast.error('Elaborazione completata con errori');
      } else {
        toast.success(`Elaborazione completata: ${result.outputData.length} righe generate`);
      }

      setOutputData(result.outputData);
      setReportLines(result.reportLines);
      setProgress(100);

      if (result.errors.length === 0 && result.outputData.length > 0) {
        setTimeout(() => {
          setAppState('results');
        }, 500);
      }
    } catch (error) {
      toast.error('Errore durante l\'elaborazione');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [diffData, allData]);

  const handleProcessPrimoPeriodo = useCallback(async () => {
    if (primoPeriodoData.length === 0) {
      toast.error('Carica il file prima di elaborare');
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
        toast.error('Elaborazione completata con errori');
      } else {
        toast.success(`Elaborazione completata: ${result.outputData.length} righe generate`);
      }

      setPrimoPeriodoOutputData(result.outputData);
      setReportLines(result.reportLines);
      setProgress(100);

      if (result.errors.length === 0 && result.outputData.length > 0) {
        setTimeout(() => {
          setAppState('results');
        }, 500);
      }
    } catch (error) {
      toast.error('Errore durante l\'elaborazione');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [primoPeriodoData]);

  const handleProcess = useCallback(() => {
    if (processType === 'voti-finali') {
      handleProcessVotiFinali();
    } else {
      handleProcessPrimoPeriodo();
    }
  }, [processType, handleProcessVotiFinali, handleProcessPrimoPeriodo]);

  const handleBack = useCallback(() => {
    setAppState('upload');
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

  const clearDiffFile = useCallback(() => {
    setDiffFile(null);
    setDiffData([]);
  }, []);

  const clearAllFile = useCallback(() => {
    setAllFile(null);
    setAllData([]);
  }, []);

  const clearPrimoPeriodoFile = useCallback(() => {
    setPrimoPeriodoFile(null);
    setPrimoPeriodoData([]);
  }, []);

  const canProcessVotiFinali = diffData.length > 0 && allData.length > 0 && !isProcessing;
  const canProcessPrimoPeriodo = primoPeriodoData.length > 0 && !isProcessing;
  const canProcess = processType === 'voti-finali' ? canProcessVotiFinali : canProcessPrimoPeriodo;

  // Show results page
  if (appState === 'results') {
    if (processType === 'voti-finali' && outputData.length > 0) {
      return (
        <ResultsPage 
          outputData={outputData} 
          reportLines={reportLines} 
          onBack={handleBack} 
        />
      );
    }
    if (processType === 'primo-periodo' && primoPeriodoOutputData.length > 0) {
      return (
        <PrimoPeriodoResultsPage 
          outputData={primoPeriodoOutputData} 
          reportLines={reportLines} 
          onBack={handleBack} 
        />
      );
    }
  }

  // Show upload page
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Elaborazione Voti</h1>
        <p className="text-muted-foreground">
          Seleziona il tipo di elaborazione e carica i file necessari
        </p>
      </div>

      {/* Process Type Selector */}
      <ProcessSelector value={processType} onChange={setProcessType} />

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5" />
            {processType === 'voti-finali' ? 'Elaborazione Voti Finali' : 'Elaborazione Primo Periodo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-300">
          {processType === 'voti-finali' ? (
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
      {processType === 'voti-finali' ? (
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
                onClear={clearDiffFile}
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
                onClear={clearAllFile}
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
              onClear={clearPrimoPeriodoFile}
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
                {processType === 'voti-finali' 
                  ? 'Carica entrambi i file per procedere'
                  : 'Carica il file per procedere'}
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
    </div>
  );
}