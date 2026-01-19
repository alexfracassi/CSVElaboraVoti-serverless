"use client";

import type { PrimoPeriodoOutputRow } from './voti-utils';

export interface MateriaStats {
  materia: string;
  totaleVoti: number;
  insufficienze: number;
  percentualeInsuff: number;
  media: number;
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

// Nuovo: studente con NC
export interface StudenteConNC {
  hash: string;
  classe: string;
  materieNC: string[];
}

// Nuovo: studente con assenze elevate
export interface StudenteConAssenzeElevate {
  hash: string;
  classe: string;
  oreAssenzaTotali: number;
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
  
  // Nuovo: studenti con NC (Non Classificato)
  studentiConNC: StudenteConNC[];
  totaleNC: number;
  
  // Nuovo: studenti con assenze elevate (>50 ore)
  studentiConAssenzeElevate: StudenteConAssenzeElevate[];
  sogliaAssenzeElevate: number;
}

// Funzione per verificare se un voto è NC (Non Classificato)
function isNC(voto: string): boolean {
  if (!voto) return false;
  const upper = voto.toUpperCase().trim();
  return upper === 'NC' || upper === 'N.C.' || upper === 'N/C' || upper === 'NON CLASSIFICATO';
}

function getVotoMigliore(row: PrimoPeriodoOutputRow): number | null {
  // Prende il voto migliore tra scritto, orale e pratico
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
  
  // Per determinare insufficienza, prendiamo la media dei voti disponibili
  return voti.reduce((a, b) => a + b, 0) / voti.length;
}

// Verifica se una riga ha almeno un voto NC
function hasNC(row: PrimoPeriodoOutputRow): boolean {
  return isNC(row.VotoScritto) || isNC(row.VotoOrale) || isNC(row.VotoPratico);
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
  const SOGLIA_ASSENZE = 50; // ore
  
  // Calcola statistiche base
  const uniqueStudents = new Set(data.map(r => r.Hash));
  const uniqueClasses = new Set(data.map(r => r.Classe_Sigla));
  const uniqueMaterie = new Set(data.map(r => r.Materia));
  
  // Studenti per anno
  const studentiPerAnno = new Map<string, Set<string>>();
  for (const row of data) {
    if (!studentiPerAnno.has(row.Anno)) {
      studentiPerAnno.set(row.Anno, new Set());
    }
    studentiPerAnno.get(row.Anno)!.add(row.Hash);
  }
  
  // Converti in Map<string, number>
  const studentiPerAnnoCount = new Map<string, number>();
  for (const [anno, studenti] of studentiPerAnno) {
    studentiPerAnnoCount.set(anno, studenti.size);
  }
  
  // Insufficienze per materia
  const materiaStats = new Map<string, { totale: number; insuff: number; somma: number }>();
  
  for (const row of data) {
    const voto = getVotoMigliore(row);
    if (voto === null) continue;
    
    if (!materiaStats.has(row.Materia)) {
      materiaStats.set(row.Materia, { totale: 0, insuff: 0, somma: 0 });
    }
    
    const stats = materiaStats.get(row.Materia)!;
    stats.totale++;
    stats.somma += voto;
    if (voto < 6) {
      stats.insuff++;
    }
  }
  
  const insufficienzePerMateria: MateriaStats[] = [];
  for (const [materia, stats] of materiaStats) {
    insufficienzePerMateria.push({
      materia,
      totaleVoti: stats.totale,
      insufficienze: stats.insuff,
      percentualeInsuff: stats.totale > 0 ? (stats.insuff / stats.totale) * 100 : 0,
      media: stats.totale > 0 ? stats.somma / stats.totale : 0,
    });
  }
  
  // Ordina per percentuale insufficienze decrescente
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
  
  // Distribuzione tutta la scuola
  const distribuzioneScuola = calculateDistribuzione(
    Array.from(insuffPerStudente.values()).map(s => s.count),
    colori
  );
  
  // Distribuzione per anno
  const distribuzionePerAnno = new Map<string, DistribuzioneInsufficienze[]>();
  const anni = [...new Set(data.map(r => r.Anno))].sort();
  
  for (const anno of anni) {
    const studentiAnno = Array.from(insuffPerStudente.entries())
      .filter(([_, s]) => s.anno === anno)
      .map(([_, s]) => s.count);
    
    distribuzionePerAnno.set(anno, calculateDistribuzione(studentiAnno, colori));
  }
  
  // Medie generali
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
  
  // Percentuale insufficienze totale
  const tuttiVoti = data
    .map(r => getVotoMigliore(r))
    .filter((v): v is number => v !== null);
  
  const insuffTotali = tuttiVoti.filter(v => v < 6).length;
  const percentualeInsuffTotale = tuttiVoti.length > 0 
    ? (insuffTotali / tuttiVoti.length) * 100 
    : 0;
  
  // NUOVO: Calcola studenti con NC
  const studentiNCMap = new Map<string, { classe: string; materie: Set<string> }>();
  for (const row of data) {
    if (hasNC(row)) {
      if (!studentiNCMap.has(row.Hash)) {
        studentiNCMap.set(row.Hash, { classe: row.Classe_Sigla, materie: new Set() });
      }
      studentiNCMap.get(row.Hash)!.materie.add(row.Materia);
    }
  }
  
  const studentiConNC: StudenteConNC[] = Array.from(studentiNCMap.entries())
    .map(([hash, info]) => ({
      hash,
      classe: info.classe,
      materieNC: Array.from(info.materie).sort()
    }))
    .sort((a, b) => a.classe.localeCompare(b.classe) || b.materieNC.length - a.materieNC.length);
  
  // NUOVO: Calcola studenti con assenze elevate
  const assenzePerStudente = new Map<string, { classe: string; totale: number }>();
  for (const row of data) {
    const ore = parseFloat(row.OreAssenzaNumerico);
    if (!isNaN(ore) && ore > 0) {
      if (!assenzePerStudente.has(row.Hash)) {
        assenzePerStudente.set(row.Hash, { classe: row.Classe_Sigla, totale: 0 });
      }
      assenzePerStudente.get(row.Hash)!.totale += ore;
    }
  }
  
  const studentiConAssenzeElevate: StudenteConAssenzeElevate[] = Array.from(assenzePerStudente.entries())
    .filter(([_, info]) => info.totale > SOGLIA_ASSENZE)
    .map(([hash, info]) => ({
      hash,
      classe: info.classe,
      oreAssenzaTotali: Math.round(info.totale)
    }))
    .sort((a, b) => b.oreAssenzaTotali - a.oreAssenzaTotali);
  
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
    // Nuovi campi
    studentiConNC,
    totaleNC: studentiConNC.length,
    studentiConAssenzeElevate,
    sogliaAssenzeElevate: SOGLIA_ASSENZE,
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