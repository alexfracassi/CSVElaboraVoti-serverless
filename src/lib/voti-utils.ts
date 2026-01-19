"use client";

// =========================
// Utility di normalizzazione
// =========================

export function stripAccents(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function AZUpper(s: string): string {
  return stripAccents(s).toUpperCase().replace(/[^A-Z]/g, '');
}

export function consVows(s: string): { cons: string; vows: string } {
  const upper = AZUpper(s);
  const cons = upper.split('').filter(ch => !'AEIOU'.includes(ch)).join('');
  const vows = upper.split('').filter(ch => 'AEIOU'.includes(ch)).join('');
  return { cons, vows };
}

export function cf6FromNameSurname(cognome: string, nome: string): string {
  const { cons: cCons, vows: cVows } = consVows(cognome);
  const c3 = (cCons + cVows + "XXX").slice(0, 3);
  
  const { cons: nCons, vows: nVows } = consVows(nome);
  let n3: string;
  if (nCons.length >= 4) {
    n3 = nCons[0] + nCons[2] + nCons[3];
  } else {
    n3 = (nCons + nVows + "XXX").slice(0, 3);
  }
  return c3 + n3;
}

export function normalizeSpacesUpper(x: string | null | undefined): string {
  let s = String(x ?? '').trim();
  if (s.endsWith('_U')) {
    s = s.slice(0, -2);
  }
  return s.toUpperCase().split(/\s+/).join(' ');
}

// =========================
// Codice Fiscale: validazione e hashing
// =========================

const CF_RE = /^[A-Z0-9]{16}$/;

const ODD: Record<string, number> = {
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21
};

const EVEN: Record<string, number> = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

const MONTH_CHARS = new Set(['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T']);
const MAX_DAYS: Record<string, number> = {
  'A': 31, 'B': 29, 'C': 31, 'D': 30, 'E': 31, 'H': 30, 'L': 31, 'M': 31, 'P': 30, 'R': 31, 'S': 30, 'T': 31
};

function cfCtrl(first15: string): string {
  let tot = 0;
  for (let i = 0; i < first15.length; i++) {
    const ch = first15[i];
    tot += (i + 1) % 2 === 1 ? (ODD[ch] ?? 0) : (EVEN[ch] ?? 0);
  }
  return String.fromCharCode((tot % 26) + 'A'.charCodeAt(0));
}

export function isValidCF(x: string | null | undefined): boolean {
  if (x === null || x === undefined) return false;
  const cf = String(x).trim().toUpperCase();
  if (!CF_RE.test(cf)) return false;
  if (!MONTH_CHARS.has(cf[8])) return false;
  
  const d = parseInt(cf.slice(9, 11), 10);
  if (isNaN(d)) return false;
  if (!((d >= 1 && d <= 31) || (d >= 41 && d <= 71))) return false;
  
  const actualDay = d <= 31 ? d : d - 40;
  if (actualDay < 1 || actualDay > MAX_DAYS[cf[8]]) return false;
  
  return cfCtrl(cf.slice(0, 15)) === cf[15];
}

export async function base64sha1(text: string | null | undefined): Promise<string> {
  const t = text ?? '';
  const encoder = new TextEncoder();
  const data = encoder.encode(t);
  
  // Use SubtleCrypto for HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return base64.slice(0, 5);
}

// =========================
// Ricerca colonne e parsing classe
// =========================

export function findCol(headers: string[], aliases: string[], containsOk: boolean = true): number | null {
  const norm = headers.map(h => String(h).trim().toLowerCase());
  
  for (let i = 0; i < norm.length; i++) {
    if (aliases.includes(norm[i])) return i;
  }
  
  if (containsOk) {
    for (let i = 0; i < norm.length; i++) {
      for (const a of aliases) {
        if (norm[i].includes(a)) return i;
      }
    }
  }
  
  return null;
}

export function extractClassSigla(
  row: Record<string, string>,
  colSiglaName?: string | null,
  colAnnoName?: string | null,
  colDescName?: string | null,
  colClasseName?: string | null
): string {
  // 1) sigla diretta (es. "1A")
  if (colSiglaName && row[colSiglaName] && String(row[colSiglaName]).trim()) {
    const s = String(row[colSiglaName]).trim().toUpperCase().replace(/\s/g, '');
    const m = s.match(/^([1-5])([A-Z])$/);
    if (m) return `${m[1]}${m[2]}`;
  }
  
  // 2) inferenza da testi
  let anno: string | null = null;
  if (colAnnoName && row[colAnnoName] && String(row[colAnnoName]).trim()) {
    const a = String(row[colAnnoName]).match(/([1-5])/);
    if (a) anno = a[1];
  }
  
  const candidates: string[] = [];
  if (colDescName && row[colDescName]) candidates.push(String(row[colDescName]));
  if (colClasseName && row[colClasseName]) candidates.push(String(row[colClasseName]));
  
  for (const c of candidates) {
    const s = String(c).toUpperCase().replace(/\s/g, '');
    const m = s.match(/([1-5])([A-Z])/);
    if (m) return `${m[1]}${m[2]}`;
  }
  
  if (anno) {
    for (const c of candidates) {
      const s = String(c).toUpperCase();
      const regex = new RegExp(`${anno}\\s*([A-Z])`);
      const m = s.match(regex);
      if (m) return `${anno}${m[1]}`;
    }
  }
  
  return "";
}

export function splitSigla(sigla: string): { anno: string; sezione: string } {
  const s = String(sigla).trim().toUpperCase().replace(/\s/g, '');
  const m = s.match(/^([1-5])([A-Z])$/);
  if (m) return { anno: m[1], sezione: m[2] };
  return { anno: "", sezione: "" };
}

// =========================
// Util: numerico o stringa vuota
// =========================

const NUM_RE = /^\s*-?\d+(?:[.,]\d+)?\s*$/;

export function numericOrEmpty(x: string | null | undefined): string {
  const s = String(x ?? '').trim();
  if (!s || !NUM_RE.test(s)) return "";
  return s.replace(",", ".");
}

// =========================
// Pulizia nome materia
// =========================

export function cleanMateria(materia: string): string {
  let s = String(materia).trim();
  
  // Rimuovi suffissi comuni
  s = s.replace(/_U$/i, '');
  s = s.replace(/\s*\(.*?\)\s*$/, ''); // Rimuovi parentesi finali
  
  // Normalizza spazi
  s = s.replace(/\s+/g, ' ').trim();
  
  return s;
}

// =========================
// Types
// =========================

export type ProcessType = 'voti-finali' | 'primo-periodo';

// Output per voti finali - SENZA colonna CF (solo Hash per privacy)
export interface OutputRow {
  Hash: string;
  Materia: string;
  Classe_Sigla: string;
  Anno: string;
  Sezione: string;
  EsitoIniziale: string;
  EsitoInizialeNumerico: string;
  EsitoFinale: string;
  EsitoFinaleNumerico: string;
}

export interface PrimoPeriodoOutputRow {
  Hash: string;
  Classe_Sigla: string;
  Anno: string;
  Sezione: string;
  Quadrimestre: string;
  Materia: string;
  VotoScritto: string;
  VotoScrittoNumerico: string;
  VotoOrale: string;
  VotoOraleNumerico: string;
  VotoPratico: string;
  VotoPraticoNumerico: string;
  OreAssenza: string;
  OreAssenzaNumerico: string;
}

export interface ProcessingResult {
  outputData: OutputRow[];
  reportLines: string[];
  errors: string[];
}

export interface PrimoPeriodoProcessingResult {
  outputData: PrimoPeriodoOutputRow[];
  reportLines: string[];
  errors: string[];
}

export interface ColumnInfo {
  cognomeIdx: number | null;
  nomeIdx: number | null;
  materiaIdx: number | null;
  cfCol: string | null;
  valCol: string | null;
  siglaCol: string | null;
  annoCol: string | null;
  descCol: string | null;
  classeCol: string | null;
  votoInitCol: string | null;
  votoDiffCol: string | null;
  esitoInitCol: string | null;
  esitoDiffCol: string | null;
}