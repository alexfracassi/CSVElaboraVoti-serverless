/**
 * CSVElaboraVoti - Google Apps Script Version
 *
 * Elaborazione e anonimizzazione voti scolastici
 * - Voti Finali: unione scrutini differiti con dati completi
 * - Primo Periodo: anonimizzazione voti primo quadrimestre
 *
 * @author CSVElaboraVoti Team
 * @license MIT
 */

// =========================
// WEB APP ENTRY POINT
// =========================

/**
 * Serve la pagina HTML principale
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('FrontEnd')
    .setTitle('Elaborazione Voti')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// =========================
// GOOGLE SHEETS INTEGRATION
// =========================

/**
 * Ottiene l'elenco dei fogli di calcolo nella cartella corrente
 */
function getAvailableSpreadsheets() {
  try {
    var thisFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet
      ? SpreadsheetApp.getActiveSpreadsheet().getId()
      : ScriptApp.getScriptId());
    var parentFolder = thisFile.getParents().hasNext()
      ? thisFile.getParents().next()
      : DriveApp.getRootFolder();

    var files = parentFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
    var result = [];

    while (files.hasNext()) {
      var file = files.next();
      result.push({
        id: file.getId(),
        name: file.getName(),
        lastUpdated: file.getLastUpdated().toISOString()
      });
    }

    // Cerca anche file Excel/CSV nella cartella
    var excelFiles = parentFolder.getFilesByType(MimeType.MICROSOFT_EXCEL);
    while (excelFiles.hasNext()) {
      var file = excelFiles.next();
      result.push({
        id: file.getId(),
        name: file.getName(),
        lastUpdated: file.getLastUpdated().toISOString(),
        type: 'excel'
      });
    }

    return result.sort(function(a, b) {
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });
  } catch (e) {
    Logger.log('Errore getAvailableSpreadsheets: ' + e.toString());
    return [];
  }
}

/**
 * Legge i dati da un foglio Google Sheets
 * @param {string} spreadsheetId - ID del foglio
 * @param {string} sheetName - Nome del foglio (opzionale, default primo foglio)
 * @returns {Object[]} Array di oggetti con i dati
 */
function readSheetData(spreadsheetId, sheetName) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];

    if (!sheet) {
      throw new Error('Foglio non trovato');
    }

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return [];
    }

    var headers = data[0].map(function(h) {
      return String(h).trim();
    });

    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j] !== null && data[i][j] !== undefined
          ? String(data[i][j]).trim()
          : '';
      }
      result.push(row);
    }

    return result;
  } catch (e) {
    Logger.log('Errore readSheetData: ' + e.toString());
    throw e;
  }
}

/**
 * Ottiene la lista dei fogli in uno spreadsheet
 */
function getSheetNames(spreadsheetId) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheets().map(function(sheet) {
      return sheet.getName();
    });
  } catch (e) {
    Logger.log('Errore getSheetNames: ' + e.toString());
    return [];
  }
}

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Rimuove accenti da una stringa
 */
function stripAccents(s) {
  if (s === null || s === undefined) return "";
  var accents = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÇçÑñ';
  var without = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNn';
  var result = '';
  for (var i = 0; i < s.length; i++) {
    var idx = accents.indexOf(s[i]);
    result += idx !== -1 ? without[idx] : s[i];
  }
  return result;
}

/**
 * Converte in maiuscolo solo lettere A-Z
 */
function AZUpper(s) {
  return stripAccents(s).toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Estrae consonanti e vocali da una stringa
 */
function consVows(s) {
  var upper = AZUpper(s);
  var cons = '';
  var vows = '';
  for (var i = 0; i < upper.length; i++) {
    if ('AEIOU'.indexOf(upper[i]) === -1) {
      cons += upper[i];
    } else {
      vows += upper[i];
    }
  }
  return { cons: cons, vows: vows };
}

/**
 * Genera i primi 6 caratteri del codice fiscale da cognome e nome
 */
function cf6FromNameSurname(cognome, nome) {
  var cvC = consVows(cognome);
  var c3 = (cvC.cons + cvC.vows + "XXX").substring(0, 3);

  var cvN = consVows(nome);
  var n3;
  if (cvN.cons.length >= 4) {
    n3 = cvN.cons[0] + cvN.cons[2] + cvN.cons[3];
  } else {
    n3 = (cvN.cons + cvN.vows + "XXX").substring(0, 3);
  }
  return c3 + n3;
}

/**
 * Normalizza spazi e maiuscolo
 */
function normalizeSpacesUpper(x) {
  var s = String(x || '').trim();
  if (s.substring(s.length - 2) === '_U') {
    s = s.substring(0, s.length - 2);
  }
  return s.toUpperCase().split(/\s+/).join(' ');
}

// =========================
// CODICE FISCALE VALIDATION
// =========================

var CF_RE = /^[A-Z0-9]{16}$/;

var ODD = {
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21
};

var EVEN = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

var MONTH_CHARS = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
var MAX_DAYS = {
  'A': 31, 'B': 29, 'C': 31, 'D': 30, 'E': 31, 'H': 30, 'L': 31, 'M': 31, 'P': 30, 'R': 31, 'S': 30, 'T': 31
};

/**
 * Calcola il carattere di controllo del CF
 */
function cfCtrl(first15) {
  var tot = 0;
  for (var i = 0; i < first15.length; i++) {
    var ch = first15[i];
    tot += (i + 1) % 2 === 1 ? (ODD[ch] || 0) : (EVEN[ch] || 0);
  }
  return String.fromCharCode((tot % 26) + 'A'.charCodeAt(0));
}

/**
 * Verifica se un codice fiscale e' valido
 */
function isValidCF(x) {
  if (x === null || x === undefined) return false;
  var cf = String(x).trim().toUpperCase();
  if (!CF_RE.test(cf)) return false;
  if (MONTH_CHARS.indexOf(cf[8]) === -1) return false;

  var d = parseInt(cf.substring(9, 11), 10);
  if (isNaN(d)) return false;
  if (!((d >= 1 && d <= 31) || (d >= 41 && d <= 71))) return false;

  var actualDay = d <= 31 ? d : d - 40;
  if (actualDay < 1 || actualDay > MAX_DAYS[cf[8]]) return false;

  return cfCtrl(cf.substring(0, 15)) === cf[15];
}

/**
 * Genera hash SHA1 base64 troncato a 5 caratteri
 */
function base64sha1(text) {
  var t = text || '';
  var signature = Utilities.computeHmacSha256Signature(t, t);
  var base64 = Utilities.base64Encode(signature);
  return base64.substring(0, 5);
}

// =========================
// COLUMN DETECTION
// =========================

/**
 * Trova l'indice di una colonna cercando tra vari alias
 */
function findCol(headers, aliases, containsOk) {
  if (containsOk === undefined) containsOk = true;

  var norm = headers.map(function(h) {
    return String(h).trim().toLowerCase();
  });

  for (var i = 0; i < norm.length; i++) {
    for (var j = 0; j < aliases.length; j++) {
      if (norm[i] === aliases[j]) return i;
    }
  }

  if (containsOk) {
    for (var i = 0; i < norm.length; i++) {
      for (var j = 0; j < aliases.length; j++) {
        if (norm[i].indexOf(aliases[j]) !== -1) return i;
      }
    }
  }

  return null;
}

/**
 * Estrae sigla classe da varie colonne
 */
function extractClassSigla(row, colSiglaName, colAnnoName, colDescName, colClasseName) {
  // 1) sigla diretta (es. "1A")
  if (colSiglaName && row[colSiglaName] && String(row[colSiglaName]).trim()) {
    var s = String(row[colSiglaName]).trim().toUpperCase().replace(/\s/g, '');
    var m = s.match(/^([1-5])([A-Z])$/);
    if (m) return m[1] + m[2];
  }

  // 2) inferenza da testi
  var anno = null;
  if (colAnnoName && row[colAnnoName] && String(row[colAnnoName]).trim()) {
    var a = String(row[colAnnoName]).match(/([1-5])/);
    if (a) anno = a[1];
  }

  var candidates = [];
  if (colDescName && row[colDescName]) candidates.push(String(row[colDescName]));
  if (colClasseName && row[colClasseName]) candidates.push(String(row[colClasseName]));

  for (var i = 0; i < candidates.length; i++) {
    var s = String(candidates[i]).toUpperCase().replace(/\s/g, '');
    var m = s.match(/([1-5])([A-Z])/);
    if (m) return m[1] + m[2];
  }

  if (anno) {
    for (var i = 0; i < candidates.length; i++) {
      var s = String(candidates[i]).toUpperCase();
      var regex = new RegExp(anno + '\\s*([A-Z])');
      var m = s.match(regex);
      if (m) return anno + m[1];
    }
  }

  return "";
}

/**
 * Separa anno e sezione da sigla classe
 */
function splitSigla(sigla) {
  var s = String(sigla).trim().toUpperCase().replace(/\s/g, '');
  var m = s.match(/^([1-5])([A-Z])$/);
  if (m) return { anno: m[1], sezione: m[2] };
  return { anno: "", sezione: "" };
}

/**
 * Converte in numerico o stringa vuota
 */
function numericOrEmpty(x) {
  var NUM_RE = /^\s*-?\d+(?:[.,]\d+)?\s*$/;
  var s = String(x || '').trim();
  if (!s || !NUM_RE.test(s)) return "";
  return s.replace(",", ".");
}

/**
 * Pulisce nome materia
 */
function cleanMateria(materia) {
  var s = String(materia).trim();
  s = s.replace(/_U$/i, '');
  s = s.replace(/\s*\(.*?\)\s*$/, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// =========================
// VOTI FINALI PROCESSING
// =========================

/**
 * Elabora i file per Voti Finali
 */
function processVotiFinali(diffData, allData) {
  var errors = [];
  var reportLines = [];

  if (diffData.length === 0) {
    errors.push("Il file degli scrutini differiti e' vuoto");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  if (allData.length === 0) {
    errors.push("Il file completo e' vuoto");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  var diffHeaders = Object.keys(diffData[0]);
  var allHeaders = Object.keys(allData[0]);

  // ------- Colonne differiti -------
  var idxCognD = findCol(diffHeaders, ["cognome"], false);
  var idxNomeD = findCol(diffHeaders, ["nome"], false);
  var idxMatD = findCol(diffHeaders, ["materia", "materia_desc"]);

  var colSiglaD = diffHeaders.indexOf("classe_sigla") !== -1 ? "classe_sigla" : null;
  var colAnnoD = diffHeaders.indexOf("classe_anno_corso") !== -1 ? "classe_anno_corso" : null;
  var colDescD = diffHeaders.indexOf("classe_indirizzo") !== -1 ? "classe_indirizzo" : null;
  var colClasseD = diffHeaders.indexOf("classe") !== -1 ? "classe" : null;

  var votoInitIdx = findCol(diffHeaders, ["voto"]);
  var votoDiffIdx = findCol(diffHeaders, ["voto_differito", "voto differito"]);
  var esitoDiffIdx = findCol(diffHeaders, ["esito_differito", "esito differito"]);
  var esitoInitIdx = findCol(diffHeaders, ["esito"], false);

  var colVotoInitD = votoInitIdx !== null ? diffHeaders[votoInitIdx] : null;
  var colVotoDiffD = votoDiffIdx !== null ? diffHeaders[votoDiffIdx] : null;
  var colEsitoDiffD = esitoDiffIdx !== null ? diffHeaders[esitoDiffIdx] : null;
  var colEsitoInitD = esitoInitIdx !== null ? diffHeaders[esitoInitIdx] : null;

  if (idxCognD === null || idxNomeD === null || idxMatD === null) {
    errors.push("Nel file differiti non trovo almeno uno tra: cognome, nome, materia");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  var cognColD = diffHeaders[idxCognD];
  var nomeColD = diffHeaders[idxNomeD];
  var matColD = diffHeaders[idxMatD];

  // ------- Colonne tutti gli studenti -------
  var cfIdx = findCol(allHeaders, ["codice_fisc", "codice fiscale", "cf", "codicefiscale"]);
  var colCfA = cfIdx !== null ? allHeaders[cfIdx] : null;

  var idxMatA = findCol(allHeaders, ["materia_desc", "materia"]);
  var valIdx = findCol(allHeaders, ["valore", "voto", "esito"]);

  if (idxMatA === null || valIdx === null) {
    errors.push("Nel file completo non trovo almeno uno tra: materia/materia_desc, valore");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  var matColA = allHeaders[idxMatA];
  var colValA = allHeaders[valIdx];

  var colSiglaA = allHeaders.indexOf("classe_sigla") !== -1 ? "classe_sigla" : null;
  var colAnnoA = allHeaders.indexOf("classe_anno_corso") !== -1 ? "classe_anno_corso" : null;
  var colDescA = allHeaders.indexOf("classe_desc") !== -1 ? "classe_desc" : null;
  var colClasseA = allHeaders.indexOf("classe") !== -1 ? "classe" : null;

  var idxCognA = findCol(allHeaders, ["cognome"], false);
  var idxNomeA = findCol(allHeaders, ["nome"], false);
  var cognColA = idxCognA !== null ? allHeaders[idxCognA] : null;
  var nomeColA = idxNomeA !== null ? allHeaders[idxNomeA] : null;

  // ------- CF6 per chiave tecnica -------
  var diffWithKeys = diffData.map(function(r) {
    var cf6 = cf6FromNameSurname(r[cognColD] || '', r[nomeColD] || '');
    var clSigla = extractClassSigla(r, colSiglaD, colAnnoD, colDescD, colClasseD);
    var matKey = normalizeSpacesUpper(r[matColD]);
    return {
      _original: r,
      _CF6: cf6,
      _CL_SIGLA: clSigla,
      _MAT_KEY: matKey,
      _KEY_SM: cf6 + '§' + clSigla.toUpperCase() + '§' + matKey,
      _KEY_S: cf6 + '§' + clSigla.toUpperCase()
    };
  });

  var allWithKeys = allData.map(function(r) {
    var cf6 = '';
    if (colCfA && r[colCfA]) {
      cf6 = String(r[colCfA]).toUpperCase().substring(0, 6);
    } else if (cognColA && nomeColA) {
      cf6 = cf6FromNameSurname(r[cognColA] || '', r[nomeColA] || '');
    }
    var clSigla = extractClassSigla(r, colSiglaA, colAnnoA, colDescA, colClasseA);
    var matKey = normalizeSpacesUpper(r[matColA]);

    return {
      _original: r,
      _CF6: cf6,
      _CL_SIGLA: clSigla,
      _MAT_KEY: matKey,
      _KEY_SM: cf6 + '§' + clSigla.toUpperCase() + '§' + matKey,
      _KEY_S: cf6 + '§' + clSigla.toUpperCase()
    };
  });

  // ------- Set di chiavi presenti nei differiti -------
  var keysSmInDiff = {};
  diffWithKeys.forEach(function(r) {
    keysSmInDiff[r._KEY_SM] = true;
  });

  // ------- Mappe dai differiti (per materia) -------
  var votoInitMap = {};
  var votoDiffMap = {};

  if (colVotoInitD) {
    diffWithKeys.forEach(function(r) {
      votoInitMap[r._KEY_SM] = String(r._original[colVotoInitD] || '').trim();
    });
  }

  if (colVotoDiffD) {
    diffWithKeys.forEach(function(r) {
      votoDiffMap[r._KEY_SM] = String(r._original[colVotoDiffD] || '').trim();
    });
  }

  // ------- Mappe per ESITO per studente -------
  var esitoInitMap = {};
  var esitoDiffMap = {};

  if (colEsitoInitD) {
    var grouped = {};
    diffWithKeys.forEach(function(r) {
      var key = r._KEY_S;
      var val = String(r._original[colEsitoInitD] || '').trim();
      if (!grouped[key]) grouped[key] = [];
      if (val) grouped[key].push(val);
    });
    for (var key in grouped) {
      var vals = grouped[key];
      if (vals.length > 0) esitoInitMap[key] = vals[vals.length - 1];
    }
  }

  if (colEsitoDiffD) {
    var grouped = {};
    diffWithKeys.forEach(function(r) {
      var key = r._KEY_S;
      var val = String(r._original[colEsitoDiffD] || '').trim();
      if (!grouped[key]) grouped[key] = [];
      if (val) grouped[key].push(val);
    });
    for (var key in grouped) {
      var vals = grouped[key];
      if (vals.length > 0) esitoDiffMap[key] = vals[vals.length - 1];
    }
  }

  // ------- Valori dal file "tutti" -------
  var initMapAll = {};
  allWithKeys.forEach(function(r) {
    initMapAll[r._KEY_SM] = String(r._original[colValA] || '');
  });

  // ------- Hash dal CF valido -------
  var hashMap = {};
  if (colCfA) {
    var grouped = {};
    allWithKeys.forEach(function(r) {
      var key = r._KEY_S;
      var cf = String(r._original[colCfA] || '').trim().toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      if (cf) grouped[key].push(cf);
    });

    for (var key in grouped) {
      var cfVals = grouped[key];
      var hc = '';
      for (var i = 0; i < cfVals.length; i++) {
        if (isValidCF(cfVals[i])) {
          hc = base64sha1(cfVals[i]);
          break;
        }
      }
      hashMap[key] = hc;
    }
  }

  // ------- Costruzione output -------
  var outputRows = [];

  allWithKeys.forEach(function(r) {
    var keySM = r._KEY_SM;
    var keyS = r._KEY_S;

    var split = splitSigla(r._CL_SIGLA);
    var anno = split.anno;
    var sezione = split.sezione;
    var classeSigla = (anno && sezione) ? anno + sezione : r._CL_SIGLA;

    var materiaOut = String(r._original[matColA] || '');
    if (materiaOut.substring(materiaOut.length - 2) === '_U') {
      materiaOut = materiaOut.substring(0, materiaOut.length - 2);
    }

    var isEsito = r._MAT_KEY === 'ESITO';

    var esitoIniz;
    var esitoFin;

    if (isEsito) {
      esitoIniz = (esitoInitMap[keyS] || initMapAll[keySM] || '').trim();
      esitoFin = (esitoDiffMap[keyS] || esitoIniz).trim();
    } else {
      if (keysSmInDiff[keySM]) {
        esitoIniz = (votoInitMap[keySM] || '').trim();
        esitoFin = (votoDiffMap[keySM] || '').trim();
        if (!esitoFin) esitoFin = esitoIniz;
      } else {
        esitoIniz = (initMapAll[keySM] || '').trim();
        esitoFin = esitoIniz;
      }
    }

    var hc = hashMap[keyS] || '';
    var hashForCsv = hc ? "'" + hc : '';

    outputRows.push({
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
  });

  // ------- Ordinamento -------
  outputRows.sort(function(a, b) {
    var hashCmp = a.Hash.localeCompare(b.Hash);
    if (hashCmp !== 0) return hashCmp;

    var annoCmp = a.Anno.localeCompare(b.Anno);
    if (annoCmp !== 0) return annoCmp;

    var sezCmp = a.Sezione.localeCompare(b.Sezione);
    if (sezCmp !== 0) return sezCmp;

    var aIsEsito = a.Materia.toUpperCase() === 'ESITO' ? 1 : 0;
    var bIsEsito = b.Materia.toUpperCase() === 'ESITO' ? 1 : 0;
    if (aIsEsito !== bIsEsito) return aIsEsito - bIsEsito;

    return a.Materia.localeCompare(b.Materia);
  });

  // ------- Report di controllo -------
  var now = new Date();
  reportLines.push("============================================================");
  reportLines.push("REPORT CONTROLLI POST-PROCESSING");
  reportLines.push("Data/ora: " + Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"));
  reportLines.push("============================================================");
  reportLines.push("");

  // A) STATISTICHE GENERALI
  reportLines.push("A) STATISTICHE GENERALI");
  reportLines.push("----------------------------------------");

  var dfStudenti = outputRows.filter(function(r) { return r.Materia !== 'ESITO'; });

  if (dfStudenti.length > 0) {
    var studentiUnici = {};
    dfStudenti.forEach(function(r) {
      var key = r.Hash + '|' + r.Anno + '|' + r.Sezione;
      if (!studentiUnici[key]) {
        studentiUnici[key] = { Hash: r.Hash, Anno: r.Anno, Sezione: r.Sezione };
      }
    });

    // Conta per Anno
    var perAnno = {};
    for (var key in studentiUnici) {
      var s = studentiUnici[key];
      perAnno[s.Anno] = (perAnno[s.Anno] || 0) + 1;
    }

    reportLines.push("\nNumero studenti per Anno:");
    Object.keys(perAnno).sort().forEach(function(anno) {
      reportLines.push("  Anno " + anno + ": " + perAnno[anno] + " studenti");
    });

    // Conta per Sezione
    var perSezione = {};
    for (var key in studentiUnici) {
      var s = studentiUnici[key];
      perSezione[s.Sezione] = (perSezione[s.Sezione] || 0) + 1;
    }

    reportLines.push("\nNumero studenti per Sezione:");
    Object.keys(perSezione).sort().forEach(function(sezione) {
      reportLines.push("  Sezione " + sezione + ": " + perSezione[sezione] + " studenti");
    });

    // Conta per Anno e Sezione
    var perAnnoSezione = {};
    for (var key in studentiUnici) {
      var s = studentiUnici[key];
      var classeKey = s.Anno + s.Sezione;
      perAnnoSezione[classeKey] = (perAnnoSezione[classeKey] || 0) + 1;
    }

    reportLines.push("\nNumero studenti per Classe (Anno+Sezione):");
    Object.keys(perAnnoSezione).sort().forEach(function(classe) {
      reportLines.push("  Classe " + classe + ": " + perAnnoSezione[classe] + " studenti");
    });
  }

  // Analisi ESITI
  var dfEsiti = outputRows.filter(function(r) { return r.Materia === 'ESITO'; });

  if (dfEsiti.length > 0) {
    reportLines.push("\n----------------------------------------");
    reportLines.push("\nAnalisi ESITI iniziali e finali:");

    // Esiti iniziali
    var esitiIniziali = {};
    dfEsiti.forEach(function(r) {
      if (r.EsitoIniziale) {
        esitiIniziali[r.EsitoIniziale] = (esitiIniziali[r.EsitoIniziale] || 0) + 1;
      }
    });

    reportLines.push("\nEsiti iniziali (giugno):");
    Object.keys(esitiIniziali).sort().forEach(function(esito) {
      reportLines.push("  " + esito + ": " + esitiIniziali[esito] + " studenti");
    });

    // Focus sui sospesi
    var dfSospesi = dfEsiti.filter(function(r) { return r.EsitoIniziale.toLowerCase() === 'sospeso'; });
    var nSospesi = dfSospesi.length;
    reportLines.push("\nTotale studenti con scrutinio sospeso: " + nSospesi);

    if (nSospesi > 0) {
      reportLines.push("\nEsiti finali degli studenti sospesi:");
      var esitiFinaliSospesi = {};
      dfSospesi.forEach(function(r) {
        if (r.EsitoFinale) {
          esitiFinaliSospesi[r.EsitoFinale] = (esitiFinaliSospesi[r.EsitoFinale] || 0) + 1;
        }
      });

      Object.keys(esitiFinaliSospesi).sort().forEach(function(esito) {
        var count = esitiFinaliSospesi[esito];
        var percentuale = (count / nSospesi) * 100;
        reportLines.push("  " + esito + ": " + count + " studenti (" + percentuale.toFixed(1) + "%)");
      });
    }
  }

  // RIEPILOGO
  reportLines.push("\n============================================================");
  reportLines.push("\nRIEPILOGO");
  reportLines.push("----------------------------------------");
  reportLines.push("Righe totali output: " + outputRows.length);
  reportLines.push("Studenti totali: " + dfEsiti.length);
  reportLines.push("\nCodici fiscali anonimizzati con hash");
  reportLines.push("Nessun dato personale nell'output");

  return { outputData: outputRows, reportLines: reportLines, errors: errors };
}

// =========================
// PRIMO PERIODO PROCESSING
// =========================

var MATERIE_ESCLUSE = [
  'RELIGIONE',
  'ATTIVITA ALTERNATIVA',
  'ATTIVITÀ ALTERNATIVA',
  'EDUCAZIONE CIVICA',
  'ED. CIVICA'
];

function shouldExcludeMateria(materia) {
  var upper = materia.toUpperCase().trim();
  for (var i = 0; i < MATERIE_ESCLUSE.length; i++) {
    if (upper.indexOf(MATERIE_ESCLUSE[i]) !== -1) return true;
  }
  return false;
}

/**
 * Elabora il file per Primo Periodo
 */
function processPrimoPeriodo(data) {
  var errors = [];
  var reportLines = [];

  if (data.length === 0) {
    errors.push("Il file e' vuoto");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  var headers = Object.keys(data[0]);

  // Trova le colonne necessarie
  var cfIdx = findCol(headers, ["codicefiscalealunno", "codice_fiscale", "codice fiscale", "cf", "codicefiscale"]);
  var annoIdx = findCol(headers, ["anno"], false);
  var sezioneIdx = findCol(headers, ["sezione"], false);
  var quadrimestreIdx = findCol(headers, ["quadrimestre", "quadimestre", "periodo"]);
  var materiaIdx = findCol(headers, ["descrizionemateria", "descrizione_materia", "materia_desc", "materia"]);
  var votoScrittoIdx = findCol(headers, ["votoscritto", "voto_scritto", "scritto"]);
  var votoOraleIdx = findCol(headers, ["votooraleunico", "voto_orale", "orale", "voto_orale_unico"]);
  var votoPraticoIdx = findCol(headers, ["votopraticoGrafico", "voto_pratico", "pratico", "voto_pratico_grafico"]);
  var oreAssenzaIdx = findCol(headers, ["orediassenza", "ore_assenza", "assenze", "ore_di_assenza"]);

  // Verifica colonne obbligatorie
  if (cfIdx === null) {
    errors.push("Colonna Codice Fiscale non trovata");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  if (annoIdx === null || sezioneIdx === null) {
    errors.push("Colonne Anno e/o Sezione non trovate");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  if (materiaIdx === null) {
    errors.push("Colonna Materia non trovata");
    return { outputData: [], reportLines: reportLines, errors: errors };
  }

  var cfCol = headers[cfIdx];
  var annoCol = headers[annoIdx];
  var sezioneCol = headers[sezioneIdx];
  var quadrimestreCol = quadrimestreIdx !== null ? headers[quadrimestreIdx] : null;
  var materiaCol = headers[materiaIdx];
  var votoScrittoCol = votoScrittoIdx !== null ? headers[votoScrittoIdx] : null;
  var votoOraleCol = votoOraleIdx !== null ? headers[votoOraleIdx] : null;
  var votoPraticoCol = votoPraticoIdx !== null ? headers[votoPraticoIdx] : null;
  var oreAssenzaCol = oreAssenzaIdx !== null ? headers[oreAssenzaIdx] : null;

  // Genera hash per ogni CF unico
  var cfHashMap = {};
  var uniqueCFs = {};

  data.forEach(function(row) {
    var cf = String(row[cfCol] || '').trim().toUpperCase();
    if (cf && isValidCF(cf)) {
      uniqueCFs[cf] = true;
    }
  });

  for (var cf in uniqueCFs) {
    cfHashMap[cf] = base64sha1(cf);
  }

  // Elabora i dati
  var outputRows = [];
  var materieEscluse = 0;
  var righeProcessate = 0;

  data.forEach(function(row) {
    var cf = String(row[cfCol] || '').trim().toUpperCase();
    var materia = cleanMateria(row[materiaCol] || '');

    // Salta materie escluse
    if (shouldExcludeMateria(materia)) {
      materieEscluse++;
      return;
    }

    // Salta righe senza CF valido
    if (!cf || !isValidCF(cf)) {
      return;
    }

    var hash = cfHashMap[cf] || '';
    var anno = String(row[annoCol] || '').trim();
    var sezione = String(row[sezioneCol] || '').trim().toUpperCase();
    var classeSigla = anno + sezione;
    var quadrimestre = quadrimestreCol ? String(row[quadrimestreCol] || '').trim() : '1';

    var votoScritto = votoScrittoCol ? String(row[votoScrittoCol] || '').trim() : '';
    var votoOrale = votoOraleCol ? String(row[votoOraleCol] || '').trim() : '';
    var votoPratico = votoPraticoCol ? String(row[votoPraticoCol] || '').trim() : '';
    var oreAssenza = oreAssenzaCol ? String(row[oreAssenzaCol] || '').trim() : '';

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
      OreAssenzaNumerico: numericOrEmpty(oreAssenza)
    });

    righeProcessate++;
  });

  // Ordinamento
  outputRows.sort(function(a, b) {
    var hashCmp = a.Hash.localeCompare(b.Hash);
    if (hashCmp !== 0) return hashCmp;

    var annoCmp = a.Anno.localeCompare(b.Anno);
    if (annoCmp !== 0) return annoCmp;

    var sezCmp = a.Sezione.localeCompare(b.Sezione);
    if (sezCmp !== 0) return sezCmp;

    return a.Materia.localeCompare(b.Materia);
  });

  // Report
  var now = new Date();
  reportLines.push("============================================================");
  reportLines.push("REPORT ELABORAZIONE PRIMO PERIODO");
  reportLines.push("Data/ora: " + Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"));
  reportLines.push("============================================================");
  reportLines.push("");

  // Statistiche generali
  reportLines.push("A) STATISTICHE GENERALI");
  reportLines.push("----------------------------------------");
  reportLines.push("\nRighe nel file originale: " + data.length);
  reportLines.push("Righe elaborate: " + righeProcessate);
  reportLines.push("Materie escluse (non didattiche): " + materieEscluse);
  reportLines.push("Studenti unici (CF validi): " + Object.keys(uniqueCFs).length);

  // Studenti per classe
  var studentiPerClasse = {};
  outputRows.forEach(function(row) {
    var key = row.Classe_Sigla;
    if (!studentiPerClasse[key]) studentiPerClasse[key] = {};
    studentiPerClasse[key][row.Hash] = true;
  });

  reportLines.push("\nNumero studenti per Classe:");
  Object.keys(studentiPerClasse).sort().forEach(function(classe) {
    var count = Object.keys(studentiPerClasse[classe]).length;
    reportLines.push("  Classe " + classe + ": " + count + " studenti");
  });

  // Materie trovate
  var materieUniche = {};
  outputRows.forEach(function(r) { materieUniche[r.Materia] = true; });
  reportLines.push("\nMaterie elaborate: " + Object.keys(materieUniche).length);

  // Analisi voti
  reportLines.push("\n----------------------------------------");
  reportLines.push("\nB) ANALISI VOTI");
  reportLines.push("----------------------------------------");

  // Distribuzione voti orali
  var votiOrali = outputRows
    .map(function(r) { return parseFloat(r.VotoOraleNumerico); })
    .filter(function(v) { return !isNaN(v); });

  if (votiOrali.length > 0) {
    var sommaOrali = votiOrali.reduce(function(a, b) { return a + b; }, 0);
    var mediaOrali = sommaOrali / votiOrali.length;
    var insuffOrali = votiOrali.filter(function(v) { return v < 6; }).length;
    reportLines.push("\nVoti Orali:");
    reportLines.push("  Totale voti: " + votiOrali.length);
    reportLines.push("  Media: " + mediaOrali.toFixed(2));
    reportLines.push("  Insufficienze (<6): " + insuffOrali + " (" + ((insuffOrali / votiOrali.length) * 100).toFixed(1) + "%)");
  }

  // Distribuzione voti scritti
  var votiScritti = outputRows
    .map(function(r) { return parseFloat(r.VotoScrittoNumerico); })
    .filter(function(v) { return !isNaN(v); });

  if (votiScritti.length > 0) {
    var sommaScritti = votiScritti.reduce(function(a, b) { return a + b; }, 0);
    var mediaScritti = sommaScritti / votiScritti.length;
    var insuffScritti = votiScritti.filter(function(v) { return v < 6; }).length;
    reportLines.push("\nVoti Scritti:");
    reportLines.push("  Totale voti: " + votiScritti.length);
    reportLines.push("  Media: " + mediaScritti.toFixed(2));
    reportLines.push("  Insufficienze (<6): " + insuffScritti + " (" + ((insuffScritti / votiScritti.length) * 100).toFixed(1) + "%)");
  }

  // Riepilogo
  reportLines.push("\n============================================================");
  reportLines.push("\nRIEPILOGO");
  reportLines.push("----------------------------------------");
  reportLines.push("Righe output: " + outputRows.length);
  reportLines.push("Studenti: " + Object.keys(uniqueCFs).length);
  reportLines.push("Classi: " + Object.keys(studentiPerClasse).length);
  reportLines.push("Materie: " + Object.keys(materieUniche).length);
  reportLines.push("\nCodici fiscali anonimizzati con hash");
  reportLines.push("Materie non didattiche rimosse (escluso COMPORTAMENTO)");

  return { outputData: outputRows, reportLines: reportLines, errors: errors };
}

// =========================
// OUTPUT FUNCTIONS
// =========================

/**
 * Scrive i risultati in un nuovo foglio Google Sheets
 */
function writeResultsToSheet(outputData, sheetName) {
  if (outputData.length === 0) {
    throw new Error("Nessun dato da scrivere");
  }

  var ss = SpreadsheetApp.create(sheetName);
  var sheet = ss.getActiveSheet();

  // Scrivi intestazioni
  var headers = Object.keys(outputData[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Scrivi dati
  var rows = outputData.map(function(row) {
    return headers.map(function(h) { return row[h]; });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Formatta
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Auto-resize colonne
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return {
    id: ss.getId(),
    url: ss.getUrl(),
    name: sheetName
  };
}

/**
 * Genera CSV come stringa
 */
function generateCSV(outputData) {
  if (outputData.length === 0) return "";

  var headers = Object.keys(outputData[0]);
  var lines = [headers.join(',')];

  outputData.forEach(function(row) {
    var values = headers.map(function(h) {
      var val = String(row[h] || '');
      // Escape virgole e virgolette
      if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

// =========================
// MAIN API FUNCTIONS (called from frontend)
// =========================

/**
 * API: Elabora Voti Finali
 */
function apiProcessVotiFinali(diffSpreadsheetId, diffSheetName, allSpreadsheetId, allSheetName) {
  try {
    var diffData = readSheetData(diffSpreadsheetId, diffSheetName);
    var allData = readSheetData(allSpreadsheetId, allSheetName);

    var result = processVotiFinali(diffData, allData);

    if (result.errors.length > 0) {
      return { success: false, errors: result.errors };
    }

    // Crea nuovo spreadsheet con risultati
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd-HHmm");
    var outputSheet = writeResultsToSheet(result.outputData, "Voti_Complessivo_" + timestamp);

    return {
      success: true,
      outputUrl: outputSheet.url,
      outputId: outputSheet.id,
      reportLines: result.reportLines,
      rowCount: result.outputData.length,
      csv: generateCSV(result.outputData)
    };
  } catch (e) {
    Logger.log('Errore apiProcessVotiFinali: ' + e.toString());
    return { success: false, errors: [e.toString()] };
  }
}

/**
 * API: Elabora Primo Periodo
 */
function apiProcessPrimoPeriodo(spreadsheetId, sheetName) {
  try {
    var data = readSheetData(spreadsheetId, sheetName);

    var result = processPrimoPeriodo(data);

    if (result.errors.length > 0) {
      return { success: false, errors: result.errors };
    }

    // Crea nuovo spreadsheet con risultati
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd-HHmm");
    var outputSheet = writeResultsToSheet(result.outputData, "PrimoPeriodo_" + timestamp);

    return {
      success: true,
      outputUrl: outputSheet.url,
      outputId: outputSheet.id,
      reportLines: result.reportLines,
      rowCount: result.outputData.length,
      csv: generateCSV(result.outputData)
    };
  } catch (e) {
    Logger.log('Errore apiProcessPrimoPeriodo: ' + e.toString());
    return { success: false, errors: [e.toString()] };
  }
}

/**
 * API: Elabora Voti Finali da dati già parsati (file upload dal frontend)
 */
function processVotiFinaliFromData(diffData, allData) {
  try {
    var result = processVotiFinali(diffData, allData);

    if (result.errors.length > 0) {
      return { success: false, errors: result.errors };
    }

    return {
      success: true,
      outputData: result.outputData,
      reportLines: result.reportLines,
      rowCount: result.outputData.length
    };
  } catch (e) {
    Logger.log('Errore processVotiFinaliFromData: ' + e.toString());
    return { success: false, errors: [e.toString()] };
  }
}

/**
 * API: Elabora Primo Periodo da dati già parsati (file upload dal frontend)
 */
function processPrimoPeriodoFromData(data) {
  try {
    var result = processPrimoPeriodo(data);

    if (result.errors.length > 0) {
      return { success: false, errors: result.errors };
    }

    return {
      success: true,
      outputData: result.outputData,
      reportLines: result.reportLines,
      rowCount: result.outputData.length
    };
  } catch (e) {
    Logger.log('Errore processPrimoPeriodoFromData: ' + e.toString());
    return { success: false, errors: [e.toString()] };
  }
}

/**
 * API: Ottieni fogli disponibili
 */
function apiGetSpreadsheets() {
  return getAvailableSpreadsheets();
}

/**
 * API: Ottieni nomi fogli in uno spreadsheet
 */
function apiGetSheetNames(spreadsheetId) {
  return getSheetNames(spreadsheetId);
}

/**
 * API: Preview dati da un foglio (prime 5 righe)
 */
function apiPreviewSheet(spreadsheetId, sheetName) {
  try {
    var data = readSheetData(spreadsheetId, sheetName);
    var preview = data.slice(0, 5);
    var headers = data.length > 0 ? Object.keys(data[0]) : [];
    return {
      success: true,
      headers: headers,
      preview: preview,
      totalRows: data.length
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
