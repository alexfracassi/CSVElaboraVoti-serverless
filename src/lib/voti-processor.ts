"use client";

import {
  cf6FromNameSurname,
  normalizeSpacesUpper,
  extractClassSigla,
  splitSigla,
  numericOrEmpty,
  isValidCF,
  base64sha1,
  findCol,
  type OutputRow,
  type ProcessingResult,
} from './voti-utils';

// Type for rows with computed keys
type RowWithKeys = Record<string, string> & {
  _CF6: string;
  _CL_SIGLA: string;
  _MAT_KEY: string;
  _KEY_SM: string;
  _KEY_S: string;
};

export async function processVotiFiles(
  diffData: Record<string, string>[],
  allData: Record<string, string>[]
): Promise<ProcessingResult> {
  const errors: string[] = [];
  const reportLines: string[] = [];
  
  if (diffData.length === 0) {
    errors.push("Il file degli scrutini differiti è vuoto");
    return { outputData: [], reportLines, errors };
  }
  
  if (allData.length === 0) {
    errors.push("Il file completo è vuoto");
    return { outputData: [], reportLines, errors };
  }
  
  const diffHeaders = Object.keys(diffData[0]);
  const allHeaders = Object.keys(allData[0]);
  
  // ------- Colonne differiti -------
  const idxCognD = findCol(diffHeaders, ["cognome"], false);
  const idxNomeD = findCol(diffHeaders, ["nome"], false);
  const idxMatD = findCol(diffHeaders, ["materia", "materia_desc"]);
  
  const colSiglaD = diffHeaders.includes("classe_sigla") ? "classe_sigla" : null;
  const colAnnoD = diffHeaders.includes("classe_anno_corso") ? "classe_anno_corso" : null;
  const colDescD = diffHeaders.includes("classe_indirizzo") ? "classe_indirizzo" : null;
  const colClasseD = diffHeaders.includes("classe") ? "classe" : null;
  
  const votoInitIdx = findCol(diffHeaders, ["voto"]);
  const votoDiffIdx = findCol(diffHeaders, ["voto_differito", "voto differito"]);
  const esitoDiffIdx = findCol(diffHeaders, ["esito_differito", "esito differito"]);
  const esitoInitIdx = findCol(diffHeaders, ["esito"], false);
  
  const colVotoInitD = votoInitIdx !== null ? diffHeaders[votoInitIdx] : null;
  const colVotoDiffD = votoDiffIdx !== null ? diffHeaders[votoDiffIdx] : null;
  const colEsitoDiffD = esitoDiffIdx !== null ? diffHeaders[esitoDiffIdx] : null;
  const colEsitoInitD = esitoInitIdx !== null ? diffHeaders[esitoInitIdx] : null;
  
  if (idxCognD === null || idxNomeD === null || idxMatD === null) {
    errors.push("Nel file differiti non trovo almeno uno tra: cognome, nome, materia");
    return { outputData: [], reportLines, errors };
  }
  
  const cognColD = diffHeaders[idxCognD];
  const nomeColD = diffHeaders[idxNomeD];
  const matColD = diffHeaders[idxMatD];
  
  // ------- Colonne tutti gli studenti -------
  const cfIdx = findCol(allHeaders, ["codice_fisc", "codice fiscale", "cf", "codicefiscale"]);
  const colCfA = cfIdx !== null ? allHeaders[cfIdx] : null;
  
  const idxMatA = findCol(allHeaders, ["materia_desc", "materia"]);
  const valIdx = findCol(allHeaders, ["valore", "voto", "esito"]);
  
  if (idxMatA === null || valIdx === null) {
    errors.push("Nel file completo non trovo almeno uno tra: materia/materia_desc, valore");
    return { outputData: [], reportLines, errors };
  }
  
  const matColA = allHeaders[idxMatA];
  const colValA = allHeaders[valIdx];
  
  const colSiglaA = allHeaders.includes("classe_sigla") ? "classe_sigla" : null;
  const colAnnoA = allHeaders.includes("classe_anno_corso") ? "classe_anno_corso" : null;
  const colDescA = allHeaders.includes("classe_desc") ? "classe_desc" : null;
  const colClasseA = allHeaders.includes("classe") ? "classe" : null;
  
  const idxCognA = findCol(allHeaders, ["cognome"], false);
  const idxNomeA = findCol(allHeaders, ["nome"], false);
  const cognColA = idxCognA !== null ? allHeaders[idxCognA] : null;
  const nomeColA = idxNomeA !== null ? allHeaders[idxNomeA] : null;
  
  // ------- CF6 per chiave tecnica -------
  const diffWithKeys: RowWithKeys[] = diffData.map(r => {
    const cf6 = cf6FromNameSurname(r[cognColD] || '', r[nomeColD] || '');
    const clSigla = extractClassSigla(r, colSiglaD, colAnnoD, colDescD, colClasseD);
    const matKey = normalizeSpacesUpper(r[matColD]);
    return {
      ...r,
      _CF6: cf6,
      _CL_SIGLA: clSigla,
      _MAT_KEY: matKey,
      _KEY_SM: `${cf6}§${clSigla.toUpperCase()}§${matKey}`,
      _KEY_S: `${cf6}§${clSigla.toUpperCase()}`
    };
  });
  
  const allWithKeys: RowWithKeys[] = allData.map(r => {
    let cf6 = '';
    if (colCfA && r[colCfA]) {
      cf6 = String(r[colCfA]).toUpperCase().slice(0, 6);
    } else if (cognColA && nomeColA) {
      cf6 = cf6FromNameSurname(r[cognColA] || '', r[nomeColA] || '');
    }
    const clSigla = extractClassSigla(r, colSiglaA, colAnnoA, colDescA, colClasseA);
    const matKey = normalizeSpacesUpper(r[matColA]);
    
    return {
      ...r,
      _CF6: cf6,
      _CL_SIGLA: clSigla,
      _MAT_KEY: matKey,
      _KEY_SM: `${cf6}§${clSigla.toUpperCase()}§${matKey}`,
      _KEY_S: `${cf6}§${clSigla.toUpperCase()}`
    };
  });
  
  // ------- Set di chiavi presenti nei differiti -------
  const keysSmInDiff = new Set(diffWithKeys.map(r => r._KEY_SM));
  
  // ------- Mappe dai differiti (per materia) -------
  const votoInitMap = new Map<string, string>();
  const votoDiffMap = new Map<string, string>();
  
  if (colVotoInitD) {
    for (const r of diffWithKeys) {
      votoInitMap.set(r._KEY_SM, String(r[colVotoInitD] || '').trim());
    }
  }
  
  if (colVotoDiffD) {
    for (const r of diffWithKeys) {
      votoDiffMap.set(r._KEY_SM, String(r[colVotoDiffD] || '').trim());
    }
  }
  
  // ------- Mappe per ESITO per studente -------
  const esitoInitMap = new Map<string, string>();
  const esitoDiffMap = new Map<string, string>();
  
  if (colEsitoInitD) {
    const grouped = new Map<string, string[]>();
    for (const r of diffWithKeys) {
      const key = r._KEY_S;
      const val = String(r[colEsitoInitD] || '').trim();
      if (!grouped.has(key)) grouped.set(key, []);
      if (val) grouped.get(key)!.push(val);
    }
    for (const [key, vals] of grouped) {
      if (vals.length > 0) esitoInitMap.set(key, vals[vals.length - 1]);
    }
  }
  
  if (colEsitoDiffD) {
    const grouped = new Map<string, string[]>();
    for (const r of diffWithKeys) {
      const key = r._KEY_S;
      const val = String(r[colEsitoDiffD] || '').trim();
      if (!grouped.has(key)) grouped.set(key, []);
      if (val) grouped.get(key)!.push(val);
    }
    for (const [key, vals] of grouped) {
      if (vals.length > 0) esitoDiffMap.set(key, vals[vals.length - 1]);
    }
  }
  
  // ------- Valori dal file "tutti" -------
  const initMapAll = new Map<string, string>();
  for (const r of allWithKeys) {
    initMapAll.set(r._KEY_SM, String(r[colValA] || ''));
  }
  
  // ------- Hash dal CF valido -------
  const hashMap = new Map<string, string>();
  if (colCfA) {
    const grouped = new Map<string, string[]>();
    for (const r of allWithKeys) {
      const key = r._KEY_S;
      const cf = String(r[colCfA] || '').trim().toUpperCase();
      if (!grouped.has(key)) grouped.set(key, []);
      if (cf) grouped.get(key)!.push(cf);
    }
    
    for (const [key, cfVals] of grouped) {
      let hc = '';
      for (const c of cfVals) {
        if (isValidCF(c)) {
          hc = await base64sha1(c);
          break;
        }
      }
      hashMap.set(key, hc);
    }
  }
  
  // ------- Costruzione output -------
  const outputRows: OutputRow[] = [];
  
  for (const r of allWithKeys) {
    const keySM = r._KEY_SM;
    const keyS = r._KEY_S;
    
    const CF = colCfA ? String(r[colCfA] || '').trim() : '';
    const { anno, sezione } = splitSigla(r._CL_SIGLA);
    const classeSigla = (anno && sezione) ? `${anno}${sezione}` : r._CL_SIGLA;
    
    let materiaOut = String(r[matColA] || '');
    if (materiaOut.endsWith('_U')) {
      materiaOut = materiaOut.slice(0, -2);
    }
    
    const isEsito = r._MAT_KEY === 'ESITO';
    
    let esitoIniz: string;
    let esitoFin: string;
    
    if (isEsito) {
      esitoIniz = (esitoInitMap.get(keyS) || initMapAll.get(keySM) || '').trim();
      esitoFin = (esitoDiffMap.get(keyS) || esitoIniz).trim();
    } else {
      if (keysSmInDiff.has(keySM)) {
        esitoIniz = (votoInitMap.get(keySM) || '').trim();
        esitoFin = (votoDiffMap.get(keySM) || '').trim();
        if (!esitoFin) esitoFin = esitoIniz;
      } else {
        esitoIniz = (initMapAll.get(keySM) || '').trim();
        esitoFin = esitoIniz;
      }
    }
    
    const hc = hashMap.get(keyS) || '';
    const hashForCsv = hc ? `'${hc}` : '';
    
    outputRows.push({
      CF,
      Hash: hashForCsv,
      Materia: materiaOut,
      Classe_Sigla: classeSigla,
      Anno: anno,
      Sezione: sezione,
      EsitoIniziale: esitoIniz,
      EsitoInizialeNumerico: numericOrEmpty(esitoIniz),
      EsitoFinale: esitoFin,
      EsitoFinaleNumerico: numericOrEmpty(esitoFin)
    });
  }
  
  // ------- Ordinamento -------
  outputRows.sort((a, b) => {
    const cfCmp = a.CF.localeCompare(b.CF);
    if (cfCmp !== 0) return cfCmp;
    
    const annoCmp = a.Anno.localeCompare(b.Anno);
    if (annoCmp !== 0) return annoCmp;
    
    const sezCmp = a.Sezione.localeCompare(b.Sezione);
    if (sezCmp !== 0) return sezCmp;
    
    const aIsEsito = a.Materia.toUpperCase() === 'ESITO' ? 1 : 0;
    const bIsEsito = b.Materia.toUpperCase() === 'ESITO' ? 1 : 0;
    if (aIsEsito !== bIsEsito) return aIsEsito - bIsEsito;
    
    return a.Materia.localeCompare(b.Materia);
  });
  
  // ------- Report di controllo -------
  const now = new Date();
  reportLines.push("=".repeat(60));
  reportLines.push("REPORT CONTROLLI POST-PROCESSING");
  reportLines.push(`Data/ora: ${now.toLocaleString('it-IT')}`);
  reportLines.push("=".repeat(60));
  reportLines.push("");
  
  // A) STATISTICHE GENERALI
  reportLines.push("A) STATISTICHE GENERALI");
  reportLines.push("-".repeat(40));
  
  const dfStudenti = outputRows.filter(r => r.Materia !== 'ESITO');
  
  if (dfStudenti.length > 0) {
    const studentiUnici = new Map<string, { CF: string; Anno: string; Sezione: string }>();
    for (const r of dfStudenti) {
      const key = `${r.CF}|${r.Anno}|${r.Sezione}`;
      if (!studentiUnici.has(key)) {
        studentiUnici.set(key, { CF: r.CF, Anno: r.Anno, Sezione: r.Sezione });
      }
    }
    
    // Conta per Anno
    const perAnno = new Map<string, number>();
    for (const s of studentiUnici.values()) {
      perAnno.set(s.Anno, (perAnno.get(s.Anno) || 0) + 1);
    }
    
    reportLines.push("\nNumero studenti per Anno:");
    for (const [anno, count] of [...perAnno.entries()].sort()) {
      reportLines.push(`  Anno ${anno}: ${count} studenti`);
    }
    
    // Conta per Sezione
    const perSezione = new Map<string, number>();
    for (const s of studentiUnici.values()) {
      perSezione.set(s.Sezione, (perSezione.get(s.Sezione) || 0) + 1);
    }
    
    reportLines.push("\nNumero studenti per Sezione:");
    for (const [sezione, count] of [...perSezione.entries()].sort()) {
      reportLines.push(`  Sezione ${sezione}: ${count} studenti`);
    }
    
    // Conta per Anno e Sezione
    const perAnnoSezione = new Map<string, number>();
    for (const s of studentiUnici.values()) {
      const key = `${s.Anno}${s.Sezione}`;
      perAnnoSezione.set(key, (perAnnoSezione.get(key) || 0) + 1);
    }
    
    reportLines.push("\nNumero studenti per Classe (Anno+Sezione):");
    for (const [classe, count] of [...perAnnoSezione.entries()].sort()) {
      reportLines.push(`  Classe ${classe}: ${count} studenti`);
    }
  }
  
  // Analisi ESITI
  const dfEsiti = outputRows.filter(r => r.Materia === 'ESITO');
  
  if (dfEsiti.length > 0) {
    reportLines.push("\n" + "-".repeat(40));
    reportLines.push("\nAnalisi ESITI iniziali e finali:");
    
    // Esiti iniziali
    const esitiIniziali = new Map<string, number>();
    for (const r of dfEsiti) {
      if (r.EsitoIniziale) {
        esitiIniziali.set(r.EsitoIniziale, (esitiIniziali.get(r.EsitoIniziale) || 0) + 1);
      }
    }
    
    reportLines.push("\nEsiti iniziali (giugno):");
    for (const [esito, count] of [...esitiIniziali.entries()].sort()) {
      reportLines.push(`  ${esito}: ${count} studenti`);
    }
    
    // Focus sui sospesi
    const dfSospesi = dfEsiti.filter(r => r.EsitoIniziale.toLowerCase() === 'sospeso');
    const nSospesi = dfSospesi.length;
    reportLines.push(`\nTotale studenti con scrutinio sospeso: ${nSospesi}`);
    
    if (nSospesi > 0) {
      reportLines.push("\nEsiti finali degli studenti sospesi:");
      const esitiFinaliSospesi = new Map<string, number>();
      for (const r of dfSospesi) {
        if (r.EsitoFinale) {
          esitiFinaliSospesi.set(r.EsitoFinale, (esitiFinaliSospesi.get(r.EsitoFinale) || 0) + 1);
        }
      }
      
      for (const [esito, count] of [...esitiFinaliSospesi.entries()].sort()) {
        const percentuale = (count / nSospesi) * 100;
        reportLines.push(`  ${esito}: ${count} studenti (${percentuale.toFixed(1)}%)`);
      }
    }
  }
  
  // B) CONTROLLI DI COERENZA
  reportLines.push("\n" + "=".repeat(60));
  reportLines.push("\nB) CONTROLLI DI COERENZA");
  reportLines.push("-".repeat(40));
  
  // COMPORTAMENTO RIMOSSO dalla lista delle materie escluse nei controlli
  const ESCLUDI_MATERIE = ['ESITO', 'ASSENZE', 'CREDITO'];
  
  const isMateriaValida = (materia: string): boolean => {
    const materiaUpper = materia.toUpperCase();
    return !ESCLUDI_MATERIE.some(esclusa => materiaUpper.includes(esclusa));
  };
  
  const cfSospesi = new Set(
    dfEsiti.filter(r => r.EsitoIniziale.toLowerCase() === 'sospeso').map(r => r.CF)
  );
  
  if (cfSospesi.size > 0) {
    reportLines.push(`\nStudenti con scrutinio sospeso: ${cfSospesi.size}`);
    
    // Check 1: Voti iniziali dei sospesi
    reportLines.push("\n1) Controllo voti iniziali studenti sospesi:");
    reportLines.push("   (dovrebbero avere almeno una insufficienza nelle materie didattiche)");
    
    const anomalieVotiAlti: Array<{ cf: string; minVoto: number }> = [];
    for (const cf of cfSospesi) {
      const materieStud = outputRows.filter(r => r.CF === cf && isMateriaValida(r.Materia));
      const votiNumerici = materieStud
        .map(r => parseFloat(r.EsitoInizialeNumerico))
        .filter(v => !isNaN(v));
      
      if (votiNumerici.length > 0) {
        const minVoto = Math.min(...votiNumerici);
        if (minVoto >= 6) {
          anomalieVotiAlti.push({ cf, minVoto });
        }
      }
    }
    
    if (anomalieVotiAlti.length > 0) {
      reportLines.push(`\n   ⚠️  ANOMALIA: ${anomalieVotiAlti.length} studenti sospesi senza insufficienze:`);
      for (const { cf, minVoto } of anomalieVotiAlti.slice(0, 5)) {
        reportLines.push(`      CF: ${cf.slice(0, 6)}... - voto minimo: ${minVoto}`);
      }
    } else {
      reportLines.push("   ✅ OK: Tutti gli studenti sospesi hanno almeno un'insufficienza");
    }
    
    // Check 2: Per studenti ammessi dopo sospensione
    reportLines.push("\n2) Controllo voti finali studenti sospesi poi ammessi:");
    reportLines.push("   (dovrebbero avere tutti voti >= 6)");
    
    const cfAmmessiDopoSosp = new Set(
      dfEsiti.filter(r => 
        r.EsitoIniziale.toLowerCase() === 'sospeso' && 
        r.EsitoFinale.toLowerCase() === 'ammesso'
      ).map(r => r.CF)
    );
    
    if (cfAmmessiDopoSosp.size > 0) {
      reportLines.push(`   Studenti ammessi dopo sospensione: ${cfAmmessiDopoSosp.size}`);
      
      const anomalieVotiBassiFinali: Array<{ cf: string; voto: number; materia: string }> = [];
      for (const cf of cfAmmessiDopoSosp) {
        const materieStud = outputRows.filter(r => r.CF === cf && isMateriaValida(r.Materia));
        
        for (const r of materieStud) {
          const votoFinale = parseFloat(r.EsitoFinaleNumerico);
          if (!isNaN(votoFinale) && votoFinale < 6) {
            anomalieVotiBassiFinali.push({ cf, voto: votoFinale, materia: r.Materia });
            break;
          }
        }
      }
      
      if (anomalieVotiBassiFinali.length > 0) {
        reportLines.push(`\n   ⚠️  ANOMALIA: ${anomalieVotiBassiFinali.length} studenti ammessi con insufficienze:`);
        for (const { cf, voto, materia } of anomalieVotiBassiFinali.slice(0, 5)) {
          reportLines.push(`      CF: ${cf.slice(0, 6)}... - ${materia}: ${voto}`);
        }
      } else {
        reportLines.push("   ✅ OK: Tutti gli studenti ammessi hanno voti >= 6");
      }
    }
    
    // Check 3: Materie con scrutinio differito
    reportLines.push("\n3) Controllo materie con voti modificati:");
    reportLines.push("   (solo materie didattiche)");
    
    const cfNonAmmessiDopoSosp = new Set(
      dfEsiti.filter(r => 
        r.EsitoIniziale.toLowerCase() === 'sospeso' && 
        r.EsitoFinale.toLowerCase() !== 'ammesso'
      ).map(r => r.CF)
    );
    
    if (cfAmmessiDopoSosp.size > 0) {
      reportLines.push(`\n   3a) Studenti AMMESSI dopo sospensione (${cfAmmessiDopoSosp.size} studenti):`);
      
      const materieModificateAmmessi = outputRows.filter(r =>
        cfAmmessiDopoSosp.has(r.CF) &&
        isMateriaValida(r.Materia) &&
        r.EsitoIniziale !== r.EsitoFinale
      );
      
      if (materieModificateAmmessi.length > 0) {
        reportLines.push(`       Materie con voto modificato: ${materieModificateAmmessi.length}`);
        
        const anomalieAmmessi: Array<{ cf: string; materia: string; votoIniz: number; votoFin: number; motivo: string }> = [];
        for (const row of materieModificateAmmessi) {
          const votoIniz = parseFloat(row.EsitoInizialeNumerico);
          const votoFin = parseFloat(row.EsitoFinaleNumerico);
          
          if (!isNaN(votoIniz) && !isNaN(votoFin)) {
            if (votoIniz >= 6) {
              anomalieAmmessi.push({ cf: row.CF, materia: row.Materia, votoIniz, votoFin, motivo: 'Voto iniziale già sufficiente' });
            } else if (votoFin < 6) {
              anomalieAmmessi.push({ cf: row.CF, materia: row.Materia, votoIniz, votoFin, motivo: 'Voto finale ancora insufficiente' });
            } else if (votoFin < votoIniz) {
              anomalieAmmessi.push({ cf: row.CF, materia: row.Materia, votoIniz, votoFin, motivo: 'Voto finale diminuito' });
            }
          }
        }
        
        if (anomalieAmmessi.length > 0) {
          reportLines.push(`\n       ⚠️  ANOMALIE in ${anomalieAmmessi.length} casi:`);
          for (const { cf, materia, votoIniz, votoFin, motivo } of anomalieAmmessi.slice(0, 5)) {
            reportLines.push(`          ${cf.slice(0, 6)}... - ${materia.slice(0, 30)}: ${votoIniz}->${votoFin} (${motivo})`);
          }
        } else {
          reportLines.push("       ✅ OK: Tutti i voti modificati sono coerenti (da <6 a >=6)");
        }
      } else {
        reportLines.push("       Nessuna materia modificata");
      }
    }
    
    if (cfNonAmmessiDopoSosp.size > 0) {
      reportLines.push(`\n   3b) Studenti NON AMMESSI dopo sospensione (${cfNonAmmessiDopoSosp.size} studenti):`);
      reportLines.push("       (dovrebbero avere almeno un voto finale < 6)");
      
      const anomalieNonAmmessi: Array<{ cf: string; minVoto: number }> = [];
      for (const cf of cfNonAmmessiDopoSosp) {
        const materieStud = outputRows.filter(r => r.CF === cf && isMateriaValida(r.Materia));
        const votiFinali = materieStud
          .map(r => parseFloat(r.EsitoFinaleNumerico))
          .filter(v => !isNaN(v));
        
        if (votiFinali.length > 0) {
          const minVotoFinale = Math.min(...votiFinali);
          if (minVotoFinale >= 6) {
            anomalieNonAmmessi.push({ cf, minVoto: minVotoFinale });
          }
        }
      }
      
      if (anomalieNonAmmessi.length > 0) {
        reportLines.push(`\n       ⚠️  ANOMALIA: ${anomalieNonAmmessi.length} studenti non ammessi senza insufficienze:`);
        for (const { cf, minVoto } of anomalieNonAmmessi.slice(0, 5)) {
          reportLines.push(`          CF: ${cf.slice(0, 6)}... - voto minimo: ${minVoto}`);
        }
      } else {
        reportLines.push("       ✅ OK: Tutti i non ammessi hanno almeno un'insufficienza finale");
      }
    }
  } else {
    reportLines.push("\nNessuno studente con scrutinio sospeso trovato.");
  }
  
  // RIEPILOGO
  reportLines.push("\n" + "=".repeat(60));
  reportLines.push("\nRIEPILOGO");
  reportLines.push("-".repeat(40));
  reportLines.push(`Righe totali output: ${outputRows.length}`);
  reportLines.push(`Studenti totali: ${dfEsiti.length}`);
  reportLines.push(`Studenti sospesi: ${cfSospesi.size}`);
  
  return { outputData: outputRows, reportLines, errors };
}