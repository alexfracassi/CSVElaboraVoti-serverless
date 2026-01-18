"use client";

import {
  normalizeSpacesUpper,
  numericOrEmpty,
  isValidCF,
  base64sha1,
  findCol,
  cleanMateria,
  type PrimoPeriodoOutputRow,
  type PrimoPeriodoProcessingResult,
} from './voti-utils';

// Materie da escludere (non sono materie didattiche)
const MATERIE_ESCLUSE = [
  'RELIGIONE',
  'ATTIVITA ALTERNATIVA',
  'ATTIVITÀ ALTERNATIVA',
  'COMPORTAMENTO',
  'CONDOTTA',
  'EDUCAZIONE CIVICA',
  'ED. CIVICA',
];

function shouldExcludeMateria(materia: string): boolean {
  const upper = materia.toUpperCase().trim();
  return MATERIE_ESCLUSE.some(esclusa => upper.includes(esclusa));
}

// Helper to safely get column value
function getColValue(row: Record<string, string>, colName: string | null): string {
  if (!colName) return '';
  return String(row[colName] || '').trim();
}

export async function processPrimoPeriodoFile(
  data: Record<string, string>[]
): Promise<PrimoPeriodoProcessingResult> {
  const errors: string[] = [];
  const reportLines: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    errors.push("Il file è vuoto");
    return { outputData: [], reportLines, errors };
  }

  const headers = Object.keys(data[0]);

  // ===== COLUMN DETECTION =====
  // Required columns (will error if not found)
  const cfIdx = findCol(headers, ["codicefiscalealunno", "codice_fiscale", "codice fiscale", "cf", "codicefiscale", "codice_fisc"]);
  const materiaIdx = findCol(headers, ["descrizionemateria", "descrizione_materia", "materia_desc", "materia", "disciplina"]);

  // Optional columns (will use empty values if not found)
  const annoIdx = findCol(headers, ["anno", "anno_corso", "classe_anno"], false);
  const sezioneIdx = findCol(headers, ["sezione", "sez", "classe_sezione"], false);
  const classeSiglaIdx = findCol(headers, ["classe_sigla", "classe", "classesigla"]);
  const quadrimestreIdx = findCol(headers, ["quadrimestre", "quadimestre", "periodo", "trimestre"]);
  const votoScrittoIdx = findCol(headers, ["votoscritto", "voto_scritto", "scritto", "voto scritto"]);
  const votoOraleIdx = findCol(headers, ["votooraleunico", "voto_orale", "orale", "voto_orale_unico", "voto orale"]);
  const votoPraticoIdx = findCol(headers, ["votopraticografico", "voto_pratico", "pratico", "voto_pratico_grafico", "voto pratico"]);
  const oreAssenzaIdx = findCol(headers, ["orediassenza", "ore_assenza", "assenze", "ore_di_assenza", "ore assenza"]);

  // Track what columns were found for the report
  const columnsFound: string[] = [];
  const columnsMissing: string[] = [];

  // Check required columns
  if (cfIdx === null) {
    errors.push("Colonna Codice Fiscale non trovata (cercate: codicefiscalealunno, codice_fiscale, cf, codicefiscale)");
    return { outputData: [], reportLines, errors };
  }
  columnsFound.push(`CF: ${headers[cfIdx]}`);

  if (materiaIdx === null) {
    errors.push("Colonna Materia non trovata (cercate: descrizionemateria, materia_desc, materia, disciplina)");
    return { outputData: [], reportLines, errors };
  }
  columnsFound.push(`Materia: ${headers[materiaIdx]}`);

  // Check optional columns and track
  const cfCol = headers[cfIdx];
  const materiaCol = headers[materiaIdx];

  // Anno/Sezione - can be derived from classe_sigla if needed
  let annoCol: string | null = null;
  let sezioneCol: string | null = null;
  let classeSiglaCol: string | null = null;

  if (annoIdx !== null && sezioneIdx !== null) {
    annoCol = headers[annoIdx];
    sezioneCol = headers[sezioneIdx];
    columnsFound.push(`Anno: ${annoCol}`);
    columnsFound.push(`Sezione: ${sezioneCol}`);
  } else if (classeSiglaIdx !== null) {
    classeSiglaCol = headers[classeSiglaIdx];
    columnsFound.push(`Classe: ${classeSiglaCol} (will extract Anno/Sezione)`);
  } else {
    columnsMissing.push("Anno/Sezione o Classe_Sigla");
    warnings.push("Colonne Anno/Sezione o Classe non trovate - la classe sarà vuota");
  }

  const quadrimestreCol = quadrimestreIdx !== null ? headers[quadrimestreIdx] : null;
  if (quadrimestreCol) columnsFound.push(`Quadrimestre: ${quadrimestreCol}`);
  else columnsMissing.push("Quadrimestre (default: 1)");

  const votoScrittoCol = votoScrittoIdx !== null ? headers[votoScrittoIdx] : null;
  if (votoScrittoCol) columnsFound.push(`VotoScritto: ${votoScrittoCol}`);
  else columnsMissing.push("VotoScritto");

  const votoOraleCol = votoOraleIdx !== null ? headers[votoOraleIdx] : null;
  if (votoOraleCol) columnsFound.push(`VotoOrale: ${votoOraleCol}`);
  else columnsMissing.push("VotoOrale");

  const votoPraticoCol = votoPraticoIdx !== null ? headers[votoPraticoIdx] : null;
  if (votoPraticoCol) columnsFound.push(`VotoPratico: ${votoPraticoCol}`);
  else columnsMissing.push("VotoPratico");

  const oreAssenzaCol = oreAssenzaIdx !== null ? headers[oreAssenzaIdx] : null;
  if (oreAssenzaCol) columnsFound.push(`OreAssenza: ${oreAssenzaCol}`);
  else columnsMissing.push("OreAssenza");

  // Generate hash for each unique CF
  const cfHashMap = new Map<string, string>();
  const uniqueCFs = new Set<string>();
  let invalidCFCount = 0;

  for (const row of data) {
    const cf = String(row[cfCol] || '').trim().toUpperCase();
    if (cf) {
      if (isValidCF(cf)) {
        uniqueCFs.add(cf);
      } else {
        invalidCFCount++;
      }
    }
  }

  for (const cf of uniqueCFs) {
    const hash = await base64sha1(cf);
    cfHashMap.set(cf, hash);
  }

  // Process data
  const outputRows: PrimoPeriodoOutputRow[] = [];
  let materieEscluse = 0;
  let righeProcessate = 0;
  let righeSkippate = 0;

  for (const row of data) {
    const cf = String(row[cfCol] || '').trim().toUpperCase();
    const materia = cleanMateria(row[materiaCol] || '');

    // Skip excluded subjects
    if (shouldExcludeMateria(materia)) {
      materieEscluse++;
      continue;
    }

    // Skip rows without valid CF
    if (!cf || !isValidCF(cf)) {
      righeSkippate++;
      continue;
    }

    const hash = cfHashMap.get(cf) || '';

    // Extract anno/sezione from appropriate columns
    let anno = '';
    let sezione = '';

    if (annoCol && sezioneCol) {
      anno = getColValue(row, annoCol);
      sezione = getColValue(row, sezioneCol).toUpperCase();
    } else if (classeSiglaCol) {
      // Try to parse from classe_sigla (e.g., "3A" -> anno=3, sezione=A)
      const sigla = getColValue(row, classeSiglaCol).toUpperCase().replace(/\s/g, '');
      const match = sigla.match(/^([1-5])([A-Z]+)$/);
      if (match) {
        anno = match[1];
        sezione = match[2];
      } else {
        // Just use the whole value as-is
        anno = sigla;
      }
    }

    const classeSigla = anno && sezione ? `${anno}${sezione}` : (anno || sezione || '');
    const quadrimestre = getColValue(row, quadrimestreCol) || '1';

    const votoScritto = getColValue(row, votoScrittoCol);
    const votoOrale = getColValue(row, votoOraleCol);
    const votoPratico = getColValue(row, votoPraticoCol);
    const oreAssenza = getColValue(row, oreAssenzaCol);

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

  // Sort output
  outputRows.sort((a, b) => {
    const hashCmp = a.Hash.localeCompare(b.Hash);
    if (hashCmp !== 0) return hashCmp;

    const annoCmp = a.Anno.localeCompare(b.Anno);
    if (annoCmp !== 0) return annoCmp;

    const sezCmp = a.Sezione.localeCompare(b.Sezione);
    if (sezCmp !== 0) return sezCmp;

    return a.Materia.localeCompare(b.Materia);
  });

  // ===== REPORT =====
  const now = new Date();
  reportLines.push("=".repeat(60));
  reportLines.push("REPORT ELABORAZIONE PRIMO PERIODO");
  reportLines.push(`Data/ora: ${now.toLocaleString('it-IT')}`);
  reportLines.push("=".repeat(60));
  reportLines.push("");

  // Column detection report
  reportLines.push("RILEVAMENTO COLONNE");
  reportLines.push("-".repeat(40));
  reportLines.push("\n✅ Colonne trovate:");
  for (const col of columnsFound) {
    reportLines.push(`   - ${col}`);
  }

  if (columnsMissing.length > 0) {
    reportLines.push("\n⚠️  Colonne non trovate (opzionali):");
    for (const col of columnsMissing) {
      reportLines.push(`   - ${col}`);
    }
  }

  if (warnings.length > 0) {
    reportLines.push("\n⚠️  Avvisi:");
    for (const w of warnings) {
      reportLines.push(`   - ${w}`);
    }
  }

  // General statistics
  reportLines.push("\n" + "-".repeat(40));
  reportLines.push("\nA) STATISTICHE GENERALI");
  reportLines.push("-".repeat(40));
  reportLines.push(`\nRighe nel file originale: ${data.length}`);
  reportLines.push(`Righe elaborate: ${righeProcessate}`);
  reportLines.push(`Righe skippate (CF non valido): ${righeSkippate}`);
  reportLines.push(`CF non validi trovati: ${invalidCFCount}`);
  reportLines.push(`Materie escluse (non didattiche): ${materieEscluse}`);
  reportLines.push(`Studenti unici (CF validi): ${uniqueCFs.size}`);

  // Students per class
  const studentiPerClasse = new Map<string, Set<string>>();
  for (const row of outputRows) {
    const key = row.Classe_Sigla || '(classe non specificata)';
    if (!studentiPerClasse.has(key)) {
      studentiPerClasse.set(key, new Set());
    }
    studentiPerClasse.get(key)!.add(row.Hash);
  }

  reportLines.push("\nNumero studenti per Classe:");
  for (const [classe, studenti] of [...studentiPerClasse.entries()].sort()) {
    reportLines.push(`  Classe ${classe}: ${studenti.size} studenti`);
  }

  // Unique subjects
  const materieUniche = new Set(outputRows.map(r => r.Materia));
  reportLines.push(`\nMaterie elaborate: ${materieUniche.size}`);

  // Grade analysis (only if grades were found)
  reportLines.push("\n" + "-".repeat(40));
  reportLines.push("\nB) ANALISI VOTI");
  reportLines.push("-".repeat(40));

  // Oral grades
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
  } else if (votoOraleCol) {
    reportLines.push(`\nVoti Orali: nessun voto numerico trovato`);
  } else {
    reportLines.push(`\nVoti Orali: colonna non presente nel file`);
  }

  // Written grades
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
  } else if (votoScrittoCol) {
    reportLines.push(`\nVoti Scritti: nessun voto numerico trovato`);
  } else {
    reportLines.push(`\nVoti Scritti: colonna non presente nel file`);
  }

  // Practical grades
  const votiPratici = outputRows
    .map(r => parseFloat(r.VotoPraticoNumerico))
    .filter(v => !isNaN(v));

  if (votiPratici.length > 0) {
    const mediaPratici = votiPratici.reduce((a, b) => a + b, 0) / votiPratici.length;
    const insuffPratici = votiPratici.filter(v => v < 6).length;
    reportLines.push(`\nVoti Pratici:`);
    reportLines.push(`  Totale voti: ${votiPratici.length}`);
    reportLines.push(`  Media: ${mediaPratici.toFixed(2)}`);
    reportLines.push(`  Insufficienze (<6): ${insuffPratici} (${((insuffPratici / votiPratici.length) * 100).toFixed(1)}%)`);
  } else if (votoPraticoCol) {
    reportLines.push(`\nVoti Pratici: nessun voto numerico trovato`);
  } else {
    reportLines.push(`\nVoti Pratici: colonna non presente nel file`);
  }

  // Summary
  reportLines.push("\n" + "=".repeat(60));
  reportLines.push("\nRIEPILOGO");
  reportLines.push("-".repeat(40));
  reportLines.push(`Righe output: ${outputRows.length}`);
  reportLines.push(`Studenti: ${uniqueCFs.size}`);
  reportLines.push(`Classi: ${studentiPerClasse.size}`);
  reportLines.push(`Materie: ${materieUniche.size}`);
  reportLines.push("\n✅ Codici fiscali anonimizzati con hash");
  reportLines.push("✅ Materie non didattiche rimosse");

  return { outputData: outputRows, reportLines, errors };
}
