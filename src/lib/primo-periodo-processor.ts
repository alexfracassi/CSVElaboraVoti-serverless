"use client";

import {
  numericOrEmpty,
  isValidCF,
  base64sha1,
  findCol,
  cleanMateria,
  type PrimoPeriodoOutputRow,
  type PrimoPeriodoProcessingResult,
} from './voti-utils';

// Materie da escludere (non sono materie didattiche) - COMPORTAMENTO RIMOSSO
const MATERIE_ESCLUSE = [
  'RELIGIONE',
  'ATTIVITA ALTERNATIVA',
  'ATTIVITÀ ALTERNATIVA',
  'EDUCAZIONE CIVICA',
  'ED. CIVICA',
];

function shouldExcludeMateria(materia: string): boolean {
  const upper = materia.toUpperCase().trim();
  return MATERIE_ESCLUSE.some(esclusa => upper.includes(esclusa));
}

export async function processPrimoPeriodoFile(
  data: Record<string, string>[]
): Promise<PrimoPeriodoProcessingResult> {
  const errors: string[] = [];
  const reportLines: string[] = [];
  
  if (data.length === 0) {
    errors.push("Il file è vuoto");
    return { outputData: [], reportLines, errors };
  }
  
  const headers = Object.keys(data[0]);
  
  // Trova le colonne necessarie
  const cfIdx = findCol(headers, ["codicefiscalealunno", "codice_fiscale", "codice fiscale", "cf", "codicefiscale"]);
  const annoIdx = findCol(headers, ["anno"], false);
  const sezioneIdx = findCol(headers, ["sezione"], false);
  const quadrimestreIdx = findCol(headers, ["quadrimestre", "quadimestre", "periodo"]);
  const materiaIdx = findCol(headers, ["descrizionemateria", "descrizione_materia", "materia_desc", "materia"]);
  const votoScrittoIdx = findCol(headers, ["votoscritto", "voto_scritto", "scritto"]);
  const votoOraleIdx = findCol(headers, ["votooraleunico", "voto_orale", "orale", "voto_orale_unico"]);
  const votoPraticoIdx = findCol(headers, ["votopraticoGrafico", "voto_pratico", "pratico", "voto_pratico_grafico"]);
  const oreAssenzaIdx = findCol(headers, ["orediassenza", "ore_assenza", "assenze", "ore_di_assenza"]);
  
  // Verifica colonne obbligatorie
  if (cfIdx === null) {
    errors.push("Colonna Codice Fiscale non trovata");
    return { outputData: [], reportLines, errors };
  }
  
  if (annoIdx === null || sezioneIdx === null) {
    errors.push("Colonne Anno e/o Sezione non trovate");
    return { outputData: [], reportLines, errors };
  }
  
  if (materiaIdx === null) {
    errors.push("Colonna Materia non trovata");
    return { outputData: [], reportLines, errors };
  }
  
  const cfCol = headers[cfIdx];
  const annoCol = headers[annoIdx];
  const sezioneCol = headers[sezioneIdx];
  const quadrimestreCol = quadrimestreIdx !== null ? headers[quadrimestreIdx] : null;
  const materiaCol = headers[materiaIdx];
  const votoScrittoCol = votoScrittoIdx !== null ? headers[votoScrittoIdx] : null;
  const votoOraleCol = votoOraleIdx !== null ? headers[votoOraleIdx] : null;
  const votoPraticoCol = votoPraticoIdx !== null ? headers[votoPraticoIdx] : null;
  const oreAssenzaCol = oreAssenzaIdx !== null ? headers[oreAssenzaIdx] : null;
  
  // Genera hash per ogni CF unico
  const cfHashMap = new Map<string, string>();
  const uniqueCFs = new Set<string>();
  
  for (const row of data) {
    const cf = String(row[cfCol] || '').trim().toUpperCase();
    if (cf && isValidCF(cf)) {
      uniqueCFs.add(cf);
    }
  }
  
  for (const cf of uniqueCFs) {
    const hash = await base64sha1(cf);
    cfHashMap.set(cf, hash);
  }
  
  // Elabora i dati
  const outputRows: PrimoPeriodoOutputRow[] = [];
  let materieEscluse = 0;
  let righeProcessate = 0;
  
  for (const row of data) {
    const cf = String(row[cfCol] || '').trim().toUpperCase();
    const materia = cleanMateria(row[materiaCol] || '');
    
    // Salta materie escluse
    if (shouldExcludeMateria(materia)) {
      materieEscluse++;
      continue;
    }
    
    // Salta righe senza CF valido
    if (!cf || !isValidCF(cf)) {
      continue;
    }
    
    const hash = cfHashMap.get(cf) || '';
    const anno = String(row[annoCol] || '').trim();
    const sezione = String(row[sezioneCol] || '').trim().toUpperCase();
    const classeSigla = `${anno}${sezione}`;
    const quadrimestre = quadrimestreCol ? String(row[quadrimestreCol] || '').trim() : '1';
    
    const votoScritto = votoScrittoCol ? String(row[votoScrittoCol] || '').trim() : '';
    const votoOrale = votoOraleCol ? String(row[votoOraleCol] || '').trim() : '';
    const votoPratico = votoPraticoCol ? String(row[votoPraticoCol] || '').trim() : '';
    const oreAssenza = oreAssenzaCol ? String(row[oreAssenzaCol] || '').trim() : '';
    
    outputRows.push({
      Hash: hash,
      Classe_Sigla: classeSigla,
      Anno: anno,
      Sezione: sezione,
      Quadrimestre: quadrimestre,
      Materia: materia,
      VotoScritto: votoScritto,
      VotoScrittoNumerico: numericOrEmpty(votoScritto),
      VotoOrale: votoOrale,
      VotoOraleNumerico: numericOrEmpty(votoOrale),
      VotoPratico: votoPratico,
      VotoPraticoNumerico: numericOrEmpty(votoPratico),
      OreAssenza: oreAssenza,
      OreAssenzaNumerico: numericOrEmpty(oreAssenza),
    });
    
    righeProcessate++;
  }
  
  // Ordinamento
  outputRows.sort((a, b) => {
    const hashCmp = a.Hash.localeCompare(b.Hash);
    if (hashCmp !== 0) return hashCmp;
    
    const annoCmp = a.Anno.localeCompare(b.Anno);
    if (annoCmp !== 0) return annoCmp;
    
    const sezCmp = a.Sezione.localeCompare(b.Sezione);
    if (sezCmp !== 0) return sezCmp;
    
    return a.Materia.localeCompare(b.Materia);
  });
  
  // Report
  const now = new Date();
  reportLines.push("=".repeat(60));
  reportLines.push("REPORT ELABORAZIONE PRIMO PERIODO");
  reportLines.push(`Data/ora: ${now.toLocaleString('it-IT')}`);
  reportLines.push("=".repeat(60));
  reportLines.push("");
  
  // Statistiche generali
  reportLines.push("A) STATISTICHE GENERALI");
  reportLines.push("-".repeat(40));
  reportLines.push(`\nRighe nel file originale: ${data.length}`);
  reportLines.push(`Righe elaborate: ${righeProcessate}`);
  reportLines.push(`Materie escluse (non didattiche): ${materieEscluse}`);
  reportLines.push(`Studenti unici (CF validi): ${uniqueCFs.size}`);
  
  // Studenti per classe
  const studentiPerClasse = new Map<string, Set<string>>();
  for (const row of outputRows) {
    const key = row.Classe_Sigla;
    if (!studentiPerClasse.has(key)) {
      studentiPerClasse.set(key, new Set());
    }
    studentiPerClasse.get(key)!.add(row.Hash);
  }
  
  reportLines.push("\nNumero studenti per Classe:");
  for (const [classe, studenti] of [...studentiPerClasse.entries()].sort()) {
    reportLines.push(`  Classe ${classe}: ${studenti.size} studenti`);
  }
  
  // Materie trovate
  const materieUniche = new Set(outputRows.map(r => r.Materia));
  reportLines.push(`\nMaterie elaborate: ${materieUniche.size}`);
  
  // Analisi voti
  reportLines.push("\n" + "-".repeat(40));
  reportLines.push("\nB) ANALISI VOTI");
  reportLines.push("-".repeat(40));
  
  // Distribuzione voti orali
  const votiOrali = outputRows
    .map(r => parseFloat(r.VotoOraleNumerico))
    .filter(v => !isNaN(v));
  
  if (votiOrali.length > 0) {
    const mediaOrali = votiOrali.reduce((a, b) => a + b, 0) / votiOrali.length;
    const insuffOrali = votiOrali.filter(v => v < 6).length;
    reportLines.push(`\nVoti Orali:`);
    reportLines.push(`  Totale voti: ${votiOrali.length}`);
    reportLines.push(`  Media: ${mediaOrali.toFixed(2)}`);
    reportLines.push(`  Insufficienze (<6): ${insuffOrali} (${((insuffOrali / votiOrali.length) * 100).toFixed(1)}%)`);
  }
  
  // Distribuzione voti scritti
  const votiScritti = outputRows
    .map(r => parseFloat(r.VotoScrittoNumerico))
    .filter(v => !isNaN(v));
  
  if (votiScritti.length > 0) {
    const mediaScritti = votiScritti.reduce((a, b) => a + b, 0) / votiScritti.length;
    const insuffScritti = votiScritti.filter(v => v < 6).length;
    reportLines.push(`\nVoti Scritti:`);
    reportLines.push(`  Totale voti: ${votiScritti.length}`);
    reportLines.push(`  Media: ${mediaScritti.toFixed(2)}`);
    reportLines.push(`  Insufficienze (<6): ${insuffScritti} (${((insuffScritti / votiScritti.length) * 100).toFixed(1)}%)`);
  }
  
  // Riepilogo
  reportLines.push("\n" + "=".repeat(60));
  reportLines.push("\nRIEPILOGO");
  reportLines.push("-".repeat(40));
  reportLines.push(`Righe output: ${outputRows.length}`);
  reportLines.push(`Studenti: ${uniqueCFs.size}`);
  reportLines.push(`Classi: ${studentiPerClasse.size}`);
  reportLines.push(`Materie: ${materieUniche.size}`);
  reportLines.push("\n✅ Codici fiscali anonimizzati con hash");
  reportLines.push("✅ Materie non didattiche rimosse (escluso COMPORTAMENTO)");
  
  return { outputData: outputRows, reportLines, errors };
}