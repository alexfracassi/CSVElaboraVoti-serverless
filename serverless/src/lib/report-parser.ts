"use client";

export interface StatisticheGenerali {
  studentiPerAnno: Map<string, number>;
  studentiPerSezione: Map<string, number>;
  studentiPerClasse: Map<string, number>;
}

export interface AnalisiEsiti {
  esitiIniziali: Map<string, number>;
  totaleStudenti: number;
  totaleSospesi: number;
  esitiFinaliSospesi: Map<string, { count: number; percentuale: number }>;
}

export interface ControlloCoerenza {
  titolo: string;
  descrizione: string;
  stato: 'ok' | 'warning' | 'info';
  dettagli: string[];
}

export interface ReportData {
  dataOra: string;
  statistiche: StatisticheGenerali;
  analisiEsiti: AnalisiEsiti;
  controlli: ControlloCoerenza[];
  riepilogo: {
    righeTotali: number;
    studentiTotali: number;
    studentiSospesi: number;
  };
}

export function parseReportLines(lines: string[]): ReportData {
  const result: ReportData = {
    dataOra: '',
    statistiche: {
      studentiPerAnno: new Map(),
      studentiPerSezione: new Map(),
      studentiPerClasse: new Map(),
    },
    analisiEsiti: {
      esitiIniziali: new Map(),
      totaleStudenti: 0,
      totaleSospesi: 0,
      esitiFinaliSospesi: new Map(),
    },
    controlli: [],
    riepilogo: {
      righeTotali: 0,
      studentiTotali: 0,
      studentiSospesi: 0,
    },
  };

  let currentSection = '';
  let currentControlloIndex = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Data/ora
    if (trimmed.startsWith('Data/ora:')) {
      result.dataOra = trimmed.replace('Data/ora:', '').trim();
      continue;
    }

    // Detect sections
    if (trimmed.startsWith('A) STATISTICHE GENERALI')) {
      currentSection = 'statistiche';
      continue;
    }
    if (trimmed.startsWith('Analisi ESITI')) {
      currentSection = 'esiti';
      continue;
    }
    if (trimmed.startsWith('B) CONTROLLI DI COERENZA')) {
      currentSection = 'controlli';
      continue;
    }
    if (trimmed.startsWith('RIEPILOGO')) {
      currentSection = 'riepilogo';
      continue;
    }

    // Parse statistiche
    if (currentSection === 'statistiche') {
      const annoMatch = trimmed.match(/Anno (\d): (\d+) studenti/);
      if (annoMatch) {
        result.statistiche.studentiPerAnno.set(annoMatch[1], parseInt(annoMatch[2]));
      }
      
      const sezioneMatch = trimmed.match(/Sezione ([A-Z]): (\d+) studenti/);
      if (sezioneMatch) {
        result.statistiche.studentiPerSezione.set(sezioneMatch[1], parseInt(sezioneMatch[2]));
      }
      
      const classeMatch = trimmed.match(/Classe (\d[A-Z]): (\d+) studenti/);
      if (classeMatch) {
        result.statistiche.studentiPerClasse.set(classeMatch[1], parseInt(classeMatch[2]));
      }
    }

    // Parse esiti
    if (currentSection === 'esiti') {
      // Esiti iniziali
      const esitoInizMatch = trimmed.match(/^\s*([A-Za-z\s]+): (\d+) studenti$/);
      if (esitoInizMatch && !trimmed.includes('%')) {
        result.analisiEsiti.esitiIniziali.set(esitoInizMatch[1].trim(), parseInt(esitoInizMatch[2]));
      }
      
      // Totale sospesi
      const sospesiMatch = trimmed.match(/Totale studenti con scrutinio sospeso: (\d+)/);
      if (sospesiMatch) {
        result.analisiEsiti.totaleSospesi = parseInt(sospesiMatch[1]);
      }
      
      // Esiti finali sospesi
      const esitoFinMatch = trimmed.match(/^\s*([A-Za-z\s]+): (\d+) studenti \((\d+\.?\d*)%\)$/);
      if (esitoFinMatch) {
        result.analisiEsiti.esitiFinaliSospesi.set(esitoFinMatch[1].trim(), {
          count: parseInt(esitoFinMatch[2]),
          percentuale: parseFloat(esitoFinMatch[3]),
        });
      }
    }

    // Parse controlli
    if (currentSection === 'controlli') {
      // New control section
      const controlloMatch = trimmed.match(/^(\d+)\) (.+):$/);
      if (controlloMatch) {
        currentControlloIndex++;
        result.controlli.push({
          titolo: `${controlloMatch[1]}) ${controlloMatch[2]}`,
          descrizione: '',
          stato: 'info',
          dettagli: [],
        });
        continue;
      }
      
      // Sub-control section (3a, 3b)
      const subControlloMatch = trimmed.match(/^(\d+[a-z])\) (.+)/);
      if (subControlloMatch) {
        currentControlloIndex++;
        result.controlli.push({
          titolo: `${subControlloMatch[1]}) ${subControlloMatch[2]}`,
          descrizione: '',
          stato: 'info',
          dettagli: [],
        });
        continue;
      }

      if (currentControlloIndex >= 0 && currentControlloIndex < result.controlli.length) {
        const controllo = result.controlli[currentControlloIndex];
        
        // Description line (in parentheses)
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          controllo.descrizione = trimmed.slice(1, -1);
          continue;
        }
        
        // OK status
        if (trimmed.includes('OK:') || trimmed.includes('✅')) {
          controllo.stato = 'ok';
          controllo.dettagli.push(trimmed.replace('✅', '').replace('OK:', '').trim());
          continue;
        }
        
        // Warning status
        if (trimmed.includes('ANOMALIA') || trimmed.includes('⚠️')) {
          controllo.stato = 'warning';
          controllo.dettagli.push(trimmed.replace('⚠️', '').trim());
          continue;
        }
        
        // Detail lines
        if (trimmed.startsWith('CF:') || trimmed.includes('...')) {
          controllo.dettagli.push(trimmed);
        }
        
        // Count lines
        if (trimmed.includes('studenti') && !trimmed.includes(':')) {
          controllo.dettagli.push(trimmed);
        }
      }
      
      // Studenti sospesi count
      const sospesiControlloMatch = trimmed.match(/Studenti con scrutinio sospeso: (\d+)/);
      if (sospesiControlloMatch) {
        result.riepilogo.studentiSospesi = parseInt(sospesiControlloMatch[1]);
      }
    }

    // Parse riepilogo
    if (currentSection === 'riepilogo') {
      const righeMatch = trimmed.match(/Righe totali output: (\d+)/);
      if (righeMatch) {
        result.riepilogo.righeTotali = parseInt(righeMatch[1]);
      }
      
      const studentiMatch = trimmed.match(/Studenti totali: (\d+)/);
      if (studentiMatch) {
        result.riepilogo.studentiTotali = parseInt(studentiMatch[1]);
      }
      
      const sospesiMatch = trimmed.match(/Studenti sospesi: (\d+)/);
      if (sospesiMatch) {
        result.riepilogo.studentiSospesi = parseInt(sospesiMatch[1]);
      }
    }
  }

  // Calculate totale studenti from esiti iniziali
  result.analisiEsiti.totaleStudenti = Array.from(result.analisiEsiti.esitiIniziali.values())
    .reduce((sum, count) => sum + count, 0);

  return result;
}