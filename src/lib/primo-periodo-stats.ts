"use client";

import type { PrimoPeriodoOutputRow } from './voti-utils';

export interface MateriaStats {
  materia: string;
  totaleVoti: number;
  insufficienze: number;
  percentualeInsuff: number;
  media: number;
  votiNC: number;
}

export interface StudenteInsuffStats {
  hash: string;
  anno: string;
  numeroInsufficienze: number;
}

export interface DistribuzioneInsufficienze {
  categoria: string;
  count: number;
  percentuale: number;
  colore: string;
}

export interface StudenteConProblemi {
  hash: string;
  classe: string;
  problema: string;
  dettaglio: string;
}

export interface PrimoPeriodoStats {
  // Statistiche generali
  totaleStudenti: number;
  totaleClassi: number;
  totaleMaterie: number;
  totaleRighe: number;
  
  // Insufficienze per materia
  insufficienzePerMateria: MateriaStats[];
  
  // Distribuzione studenti per numero insufficienze (tutta la scuola)
  distribuzioneScuola: DistribuzioneInsufficienze[];
  
  // Distribuzione studenti per numero insufficienze (per anno)
  distribuzionePerAnno: Map<string, DistribuzioneInsufficienze[]>;
  
  // Studenti per anno
  studentiPerAnno: Map<string, number>;
  
  // Medie generali
  mediaVotiOrali: number;
  mediaVotiScritti: number;
  percentualeInsuffTotale: number;
  
  // Nuovi controlli
  studentiConNC: StudenteConProblemi[];
  studentiConMolteAssenze: StudenteConProblemi[];
  totaleVotiNC: number;
  sogliaAssenze: number;
}

function isVotoNC(voto: string): boolean {
  const upper = voto.toUpperCase().trim();
  return upper === 'NC' || upper === 'N.C.' || upper === 'N/C' || upper === 'NON CLASSIFICATO';
}

function getVotoMigliore(row: PrimoPeriodoOutputRow): number | null {
  const voti: number[] = [];
  
  if (row.VotoOraleNumerico) {
    const v = parseFloat(row.VotoOraleNumerico);
    if (!isNaN(v)) voti.push(v);
  }
  if (row.VotoScrittoNumerico) {
    const v = parseFloat(row.VotoScrittoNumerico);
    if (!isNaN(v)) voti.push(v);
  }
  if (row.VotoPraticoNumerico) {
    const v = parseFloat(row.VotoPraticoNumerico);
    if (!isNaN(v)) voti.push(v);
  }
  
  if (voti.length === 0) return null;
  
  return voti.reduce((a, b) => a + b, 0) / voti.length;
}

function hasVotoNC(row: PrimoPeriodoOutputRow): boolean {
  return isVotoNC(row.VotoOrale) || isVotoNC(row.VotoScritto) || isVotoNC(row.VotoPratico);
}

function getDistribuzioneColori(): string[] {
  return [
    '#22c55e', // 0 insuff - verde
    '#84cc16', // 1 insuff - lime
    '#eab308', // 2 insuff - giallo
    '#f97316', // 3 insuff - arancione
    '#ef4444', // 4+ insuff - rosso
  ];
}

export function calculatePrimoPeriodoStats(data: PrimoPeriodoOutputRow[]): PrimoPeriodoStats {
  const colori = getDistribuzioneColori();
  const SOGLIA_ASSENZE = 50; // Soglia per "molte assenze"
  
  const uniqueStudents = new Set(data.map(r => r.Hash));
  const uniqueClasses = new Set(data.map(r => r.Classe_Sigla));
  const uniqueMaterie = new Set(data.map(r => r.Materia));
  
  const studentiPerAnno = new Map<string, Set<string>>();
  for (const row of data) {
    if (!studentiPerAnno.has(row.Anno)) {
      studentiPerAnno.set(row.Anno, new Set());
    }
    studentiPerAnno.get(row.Anno)!.add(row.Hash);
  }
  
  const studentiPerAnnoCount = new Map<string, number>();
  for (const [anno, studenti] of studentiPerAnno) {
    studentiPerAnnoCount.set(anno, studenti.size);
  }
  
  // Insufficienze per materia (con conteggio NC)
  const materiaStats = new Map<string, { totale: number; insuff: number; somma: number; nc: number }>();
  
  for (const row of data) {
    if (!materiaStats.has(row.Materia)) {
      materiaStats.set(row.Materia, { totale: 0, insuff: 0, somma: 0, nc: 0 });
    }
    
    const stats = materiaStats.get(row.Materia)!;
    
    if (hasVotoNC(row)) {
      stats.nc++;
      stats.totale++;
    } else {
      const voto = getVotoMigliore(row);
      if (voto !== null) {
        stats.totale++;
        stats.somma += voto;
        if (voto < 6) {
          stats.insuff++;
        }
      }
    }
  }
  
  const insufficienzePerMateria: MateriaStats[] = [];
  for (const [materia, stats] of materiaStats) {
    const votiValidi = stats.totale - stats.nc;
    insufficienzePerMateria.push({
      materia,
      totaleVoti: stats.totale,
      insufficienze: stats.insuff,
      percentualeInsuff: votiValidi > 0 ? (stats.insuff / votiValidi) * 100 : 0,
      media: votiValidi > 0 ? stats.somma / votiValidi : 0,
      votiNC: stats.nc,
    });
  }
  
  insufficienzePerMateria.sort((a, b) => b.percentualeInsuff - a.percentualeInsuff);
  
  // Calcola insufficienze per studente
  const insuffPerStudente = new Map<string, { anno: string; count: number }>();
  
  for (const row of data) {
    const voto = getVotoMigliore(row);
    if (voto === null) continue;
    
    if (!insuffPerStudente.has(row.Hash)) {
      insuffPerStudente.set(row.Hash, { anno: row.Anno, count: 0 });
    }
    
    if (voto < 6) {
      insuffPerStudente.get(row.Hash)!.count++;
    }
  }
  
  const distribuzioneScuola = calculateDistribuzione(
    Array.from(insuffPerStudente.values()).map(s => s.count),
    colori
  );
  
  const distribuzionePerAnno = new Map<string, DistribuzioneInsufficienze[]>();
  const anni = [...new Set(data.map(r => r.Anno))].sort();
  
  for (const anno of anni) {
    const studentiAnno = Array.from(insuffPerStudente.entries())
      .filter(([_, s]) => s.anno === anno)
      .map(([_, s]) => s.count);
    
    distribuzionePerAnno.set(anno, calculateDistribuzione(studentiAnno, colori));
  }
  
  const votiOrali = data
    .map(r => parseFloat(r.VotoOraleNumerico))
    .filter(v => !isNaN(v));
  
  const votiScritti = data
    .map(r => parseFloat(r.VotoScrittoNumerico))
    .filter(v => !isNaN(v));
  
  const mediaVotiOrali = votiOrali.length > 0 
    ? votiOrali.reduce((a, b) => a + b, 0) / votiOrali.length 
    : 0;
  
  const mediaVotiScritti = votiScritti.length > 0 
    ? votiScritti.reduce((a, b) => a + b, 0) / votiScritti.length 
    : 0;
  
  const tuttiVoti = data
    .map(r => getVotoMigliore(r))
    .filter((v): v is number => v !== null);
  
  const insuffTotali = tuttiVoti.filter(v => v < 6).length;
  const percentualeInsuffTotale = tuttiVoti.length > 0 
    ? (insuffTotali / tuttiVoti.length) * 100 
    : 0;
  
  // Trova studenti con NC
  const studentiConNCMap = new Map<string, { classe: string; materie: string[] }>();
  let totaleVotiNC = 0;
  
  for (const row of data) {
    if (hasVotoNC(row)) {
      totaleVotiNC++;
      if (!studentiConNCMap.has(row.Hash)) {
        studentiConNCMap.set(row.Hash, { classe: row.Classe_Sigla, materie: [] });
      }
      studentiConNCMap.get(row.Hash)!.materie.push(row.Materia);
    }
  }
  
  const studentiConNC: StudenteConProblemi[] = Array.from(studentiConNCMap.entries()).map(([hash, info]) => ({
    hash,
    classe: info.classe,
    problema: 'NC',
    dettaglio: `${info.materie.length} materie: ${info.materie.slice(0, 3).join(', ')}${info.materie.length > 3 ? '...' : ''}`
  }));
  
  // Trova studenti con molte assenze
  const assenzePerStudente = new Map<string, { classe: string; totaleAssenze: number; materie: number }>();
  
  for (const row of data) {
    const assenze = parseFloat(row.OreAssenzaNumerico);
    if (!isNaN(assenze)) {
      if (!assenzePerStudente.has(row.Hash)) {
        assenzePerStudente.set(row.Hash, { classe: row.Classe_Sigla, totaleAssenze: 0, materie: 0 });
      }
      const info = assenzePerStudente.get(row.Hash)!;
      info.totaleAssenze += assenze;
      info.materie++;
    }
  }
  
  const studentiConMolteAssenze: StudenteConProblemi[] = Array.from(assenzePerStudente.entries())
    .filter(([_, info]) => info.totaleAssenze >= SOGLIA_ASSENZE)
    .map(([hash, info]) => ({
      hash,
      classe: info.classe,
      problema: 'Assenze',
      dettaglio: `${info.totaleAssenze} ore totali`
    }))
    .sort((a, b) => parseInt(b.dettaglio) - parseInt(a.dettaglio));
  
  return {
    totaleStudenti: uniqueStudents.size,
    totaleClassi: uniqueClasses.size,
    totaleMaterie: uniqueMaterie.size,
    totaleRighe: data.length,
    insufficienzePerMateria,
    distribuzioneScuola,
    distribuzionePerAnno,
    studentiPerAnno: studentiPerAnnoCount,
    mediaVotiOrali,
    mediaVotiScritti,
    percentualeInsuffTotale,
    studentiConNC,
    studentiConMolteAssenze,
    totaleVotiNC,
    sogliaAssenze: SOGLIA_ASSENZE,
  };
}

function calculateDistribuzione(
  insufficienze: number[],
  colori: string[]
): DistribuzioneInsufficienze[] {
  const totale = insufficienze.length;
  if (totale === 0) return [];
  
  const categorie = [
    { label: 'Nessuna insuff.', min: 0, max: 0 },
    { label: '1 insufficienza', min: 1, max: 1 },
    { label: '2 insufficienze', min: 2, max: 2 },
    { label: '3 insufficienze', min: 3, max: 3 },
    { label: '4+ insufficienze', min: 4, max: Infinity },
  ];
  
  return categorie.map((cat, index) => {
    const count = insufficienze.filter(n => n >= cat.min && n <= cat.max).length;
    return {
      categoria: cat.label,
      count,
      percentuale: (count / totale) * 100,
      colore: colori[index],
    };
  });
}