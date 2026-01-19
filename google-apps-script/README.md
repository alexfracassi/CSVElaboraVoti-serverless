# CSVElaboraVoti - Google Apps Script

Elaborazione e anonimizzazione voti scolastici per commissioni INVALSI.

**Il vantaggio principale:** questo script vive nel Google Drive della scuola, sopravvive al turnover dei volontari, e non richiede account esterni o billing.

## Funzionalità

### 1. Voti Finali (Scrutini Differiti)
Unisce i dati degli scrutini differiti (settembre) con il file completo degli studenti:
- Matching automatico studenti tramite CF6 (primi 6 caratteri del codice fiscale calcolati da nome/cognome)
- Unione voti iniziali (giugno) e finali (settembre)
- Anonimizzazione dei codici fiscali con hash SHA-256
- Report di controllo con verifiche di coerenza

### 2. Primo Periodo (Primo Quadrimestre)
Elabora i voti del primo quadrimestre:
- Validazione codici fiscali italiani (con checksum)
- Anonimizzazione automatica con hash
- Rimozione materie non didattiche (Religione, Ed. Civica, ecc.)
- Statistiche su insufficienze e assenze

## Setup Rapido

### Passo 1: Crea il Progetto Apps Script

1. Vai su [script.google.com](https://script.google.com)
2. Clicca **Nuovo progetto**
3. Rinomina il progetto (es. "Elaborazione Voti")

### Passo 2: Aggiungi i File

1. Nel file `Codice.gs` esistente, copia tutto il contenuto di `BackEnd.gs`
2. Clicca **+** > **HTML** e crea un file chiamato `FrontEnd`
3. Copia il contenuto di `FrontEnd.html` nel nuovo file

### Passo 3: Deploy come Web App

1. Clicca **Esegui deploy** > **Nuovo deployment**
2. Clicca l'ingranaggio accanto a "Tipo" e seleziona **App web**
3. Configura:
   - **Descrizione**: "Elaborazione Voti v1.0"
   - **Esegui come**: Il tuo account
   - **Chi ha accesso**: "Chiunque con un account Google" (o "Solo utenti nel mio dominio" per G Suite)
4. Clicca **Esegui deploy**
5. **Autorizza** l'app quando richiesto
6. Copia l'**URL** del web app

### Passo 4: Usa l'Applicazione

1. Apri l'URL del web app nel browser
2. Seleziona il tipo di elaborazione (Voti Finali o Primo Periodo)
3. Seleziona i fogli Google Sheets da elaborare
4. Clicca "Elabora"
5. Scarica i risultati

## Struttura File

```
google-apps-script/
├── BackEnd.gs      # Logica di elaborazione e API
├── FrontEnd.html   # Interfaccia utente
└── README.md       # Questa documentazione
```

## Formato File Input

### Voti Finali - File Scrutini Differiti
| Colonna | Descrizione |
|---------|-------------|
| cognome | Cognome studente |
| nome | Nome studente |
| materia | Nome materia |
| voto | Voto iniziale (giugno) |
| voto_differito | Voto finale (settembre) |
| esito | Esito iniziale |
| esito_differito | Esito finale |
| classe_sigla | Sigla classe (es. 3A) |

### Voti Finali - File Completo
| Colonna | Descrizione |
|---------|-------------|
| codice_fisc | Codice fiscale completo |
| materia_desc | Descrizione materia |
| valore | Voto/esito |
| classe_sigla | Sigla classe |
| classe_anno_corso | Anno (1-5) |

### Primo Periodo
| Colonna | Descrizione |
|---------|-------------|
| CodiceFiscaleAlunno | Codice fiscale completo |
| Anno | Anno di corso (1-5) |
| Sezione | Sezione (A, B, C...) |
| DescrizioneMateria | Nome materia |
| VotoScritto | Voto scritto |
| VotoOraleUnico | Voto orale |
| VotoPraticoGrafico | Voto pratico |
| OreDiAssenza | Ore di assenza |
| Quadrimestre | Numero quadrimestre |

## Output

L'elaborazione genera:

1. **Nuovo Google Sheets** con i dati elaborati e anonimizzati
2. **File CSV** scaricabile
3. **Report testuale** con statistiche e controlli

### Colonne Output Voti Finali
- Hash (CF anonimizzato)
- Materia
- Classe_Sigla
- Anno
- Sezione
- EsitoIniziale
- EsitoInizialeNumerico
- EsitoFinale
- EsitoFinaleNumerico

### Colonne Output Primo Periodo
- Hash
- Classe_Sigla
- Anno
- Sezione
- Quadrimestre
- Materia
- VotoScritto / VotoScrittoNumerico
- VotoOrale / VotoOraleNumerico
- VotoPratico / VotoPraticoNumerico
- OreAssenza / OreAssenzaNumerico

## Privacy e Sicurezza

- I codici fiscali vengono **anonimizzati** con hash SHA-256
- Solo i primi 5 caratteri dell'hash vengono usati (collision-resistant per dataset scolastici)
- **Nessun dato personale** (nome, cognome, CF) appare nell'output
- L'elaborazione avviene interamente nei server Google
- I dati non escono dal dominio Google Workspace della scuola

## Limitazioni Google Apps Script

- **Timeout**: 6 minuti per esecuzione (sufficiente per ~50.000 righe)
- **Quota**: Vedi [limiti Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
- **URL**: L'URL del web app è "brutto" ma stabile (salva nei preferiti!)

## Aggiornamenti

Per aggiornare l'app:
1. Modifica il codice in Apps Script
2. Vai su **Esegui deploy** > **Gestisci deployment**
3. Clicca la matita per modificare
4. Cambia **Versione** in "Nuovo deployment"
5. Clicca **Esegui deploy**

## Sviluppo Locale (Opzionale)

Per sviluppare localmente con [clasp](https://github.com/google/clasp):

```bash
# Installa clasp
npm install -g @google/clasp

# Login
clasp login

# Clona il progetto esistente
clasp clone <SCRIPT_ID>

# Oppure crea nuovo progetto
clasp create --type webapp --title "Elaborazione Voti"

# Push modifiche
clasp push

# Apri editor online
clasp open
```

## Troubleshooting

### "Autorizzazione richiesta"
L'app richiede permessi per:
- Leggere/scrivere Google Sheets
- Accedere a Google Drive
- Eseguire come web app

Questi permessi sono necessari per funzionare.

### "Script function not found"
Verifica che le funzioni `doGet()` e le funzioni `api*` siano presenti in BackEnd.gs.

### "Timeout exceeded"
Il file potrebbe essere troppo grande. Prova a:
- Dividere il file in parti più piccole
- Rimuovere righe vuote
- Verificare che non ci siano formule pesanti

### I file non appaiono nella lista
L'app cerca file nella stessa cartella Drive del progetto. Sposta i file lì o modifica `getAvailableSpreadsheets()` per cercare altrove.

## Licenza

MIT License - Libero uso per scopi educativi.

## Supporto

Per problemi o suggerimenti, contatta il team INVALSI della tua scuola.

---

**Nota**: Questo progetto è stato migrato dalla versione Next.js/serverless per garantire continuità operativa e indipendenza da servizi esterni.
