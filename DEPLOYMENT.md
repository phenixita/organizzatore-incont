# Guida al Deployment su Azure

Questa guida fornisce istruzioni dettagliate per il deployment dell'applicazione Organizzatore Incontri su Azure Static Web Apps.

## Panoramica dell'Architettura

L'applicazione utilizza:
- **Azure Static Web Apps**: Hosting dell'applicazione React
- **Azure Blob Storage**: Persistenza dei dati (key-value store) con supporto per ETags
- **Azure Table Storage**: Infrastruttura preparata per accesso concorrente avanzato (uso futuro)
- **GitHub Actions**: CI/CD automatico

### Gestione della Concorrenza

L'applicazione è progettata per supportare **accesso simultaneo da parte di più utenti**:

- **Optimistic Concurrency Control**: Utilizza ETags di Azure Storage per rilevare conflitti
- **Retry Automatico**: Gestisce automaticamente i conflitti con exponential backoff (fino a 3 tentativi)
- **Refresh Periodico**: Aggiorna i dati ogni 30 secondi per mostrare modifiche di altri utenti
- **CORS Configurato**: Espone gli header ETag necessari per il controllo di concorrenza

Per dettagli tecnici completi, consulta [CONCURRENCY.md](../CONCURRENCY.md).

## Prerequisiti

Prima di iniziare, assicurati di avere:

1. ✅ Account Azure attivo con una subscription
2. ✅ Azure CLI installata ([guida installazione](https://docs.microsoft.com/cli/azure/install-azure-cli))
3. ✅ Git installato
4. ✅ Permessi di amministratore sul repository GitHub
5. ✅ Node.js 18 o superiore (per sviluppo locale)

## Verifica Prerequisiti

```bash
# Verifica Azure CLI
az --version

# Login ad Azure
az login

# Verifica subscription attiva
az account show

# Se hai più subscription, seleziona quella corretta
az account set --subscription "Nome o ID della subscription"
```

## Deployment Passo-Passo

### Step 1: Clone del Repository

```bash
git clone https://github.com/phenixita/organizzatore-incont.git
cd organizzatore-incont
```

### Step 2: Deployment Risorse Azure

Esegui lo script di deployment automatico:

**macOS/Linux (bash):**
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh [nome-progetto] [ambiente] [location]
```

**Windows / PowerShell Core (pwsh):**
```powershell
cd infrastructure
./deploy.ps1 [nome-progetto] [ambiente] [location]
```

**Parametri:**
- `nome-progetto` (opzionale, default: `orgincont`): Prefisso per le risorse Azure
- `ambiente` (opzionale, default: `dev`): Può essere `dev`, `staging`, o `prod`
- `location` (opzionale, default: `westeurope`): Regione Azure

**Esempio per ambiente di produzione:**
```bash
./deploy.sh organizzatore prod westeurope
```
```powershell
./deploy.ps1 organizzatore prod westeurope
```

**Cosa fa lo script:**
1. Crea un Resource Group in Azure
2. Deploya l'Azure Static Web App
3. Deploya l'Azure Storage Account con container blob e tabella
4. Configura CORS per consentire l'accesso da browser ed esporre ETags
5. Genera SAS token per blob e table storage
6. Fornisce istruzioni per la configurazione finale

### Step 3: Salva gli Output del Deployment

Lo script fornirà informazioni importanti:
- **Static Web App Name**: Nome della Static Web App creata
- **Static Web App URL**: URL pubblico dell'applicazione
- **Storage Account Name**: Nome dello storage account
- **Deployment Token**: Token per GitHub Actions

**⚠️ IMPORTANTE:** Salva queste informazioni in un posto sicuro!

### Step 4: Configura GitHub Secret

1. Vai sul repository GitHub: `https://github.com/phenixita/organizzatore-incont`
2. Clicca su **Settings** > **Secrets and variables** > **Actions**
3. Clicca su **New repository secret**
4. Nome: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Valore: Incolla il deployment token fornito dallo script
6. Clicca **Add secret**

### Step 5: Genera il SAS Token per Storage

Il SAS (Shared Access Signature) token permette all'applicazione di accedere allo storage.

```bash
# Sostituisci i valori con quelli del tuo deployment
STORAGE_ACCOUNT="nome-storage-account"
CONTAINER_NAME="app-data"

# Genera token valido per 1 anno
az storage container generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --name $CONTAINER_NAME \
  --permissions racwdl \
  --expiry $(date -u -d "1 year" '+%Y-%m-%dT%H:%MZ') \
  --auth-mode key \
  --output tsv
```

**Note:**
- Su macOS usa: `date -u -v+1y '+%Y-%m-%dT%H:%MZ'`
- Il comando restituirà una stringa che inizia con `sv=...`
- Aggiungi un `?` all'inizio quando lo usi: `?sv=...`

### Step 6: Configura Environment Variables nella Static Web App

1. Vai al [Portale Azure](https://portal.azure.com)
2. Cerca e apri la tua Static Web App
3. Nel menu laterale, clicca su **Configuration**
4. Clicca su **Application settings**
5. Aggiungi le seguenti variabili (clicca **+ Add** per ciascuna):

| Nome | Valore |
|------|--------|
| `VITE_AZURE_STORAGE_ACCOUNT` | Nome dello storage account (es: `orgincontprodabc12345`) |
| `VITE_AZURE_STORAGE_CONTAINER` | `app-data` |
| `VITE_AZURE_STORAGE_SAS` | Il SAS token completo con `?` iniziale (es: `?sv=2021-06-08&ss=b...`) |

6. Clicca **Save** in alto

### Step 7: Trigger del Deployment

Il deployment avviene automaticamente via GitHub Actions quando fai push sul branch `main`:

```bash
git push origin main
```

**Monitoraggio:**
1. Vai su GitHub > Actions tab
2. Vedrai il workflow "Azure Static Web Apps CI/CD" in esecuzione
3. Clicca per vedere i dettagli e i log

### Step 8: Verifica del Deployment

1. Attendi che il workflow GitHub Actions sia completato (circa 2-5 minuti)
2. Visita l'URL della tua Static Web App
3. Testa le funzionalità:
   - Aggiungi un nuovo incontro
   - Verifica che i dati persistano dopo il refresh della pagina
   - Controlla le altre sezioni (Per Turno, Per Persona, Pagamenti)

## Deployment Manuale (Alternativo)

Se preferisci non usare lo script automatico:

### 1. Crea Resource Group
```bash
az group create \
  --name orgincont-prod-rg \
  --location westeurope
```

### 2. Deploy Template Bicep
```bash
az deployment group create \
  --resource-group orgincont-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters projectName=orgincont environment=prod location=westeurope
```

### 3. Segui Step 3-8 della guida automatica

## Configurazione Avanzata

### Personalizzare le Regioni Azure

Regioni Azure disponibili per Static Web Apps:
- `westeurope` - Europa Occidentale (consigliato per Italia)
- `northeurope` - Europa del Nord
- `eastus2` - USA Est 2
- `westus2` - USA Ovest 2
- `centralus` - USA Centrale

### Modificare lo SKU della Static Web App

Per abilitare funzionalità enterprise, modifica `infrastructure/modules/staticwebapp.bicep`:

```bicep
param sku string = 'Standard'  // Cambia da 'Free' a 'Standard'
```

**Funzionalità Standard SKU:**
- Dominio personalizzato con SSL
- Autenticazione avanzata
- Maggior banda e storage
- SLA al 99.95%

### Configurare un Custom Domain

1. Nel portale Azure, vai alla tua Static Web App
2. Clicca su **Custom domains**
3. Clicca **+ Add**
4. Segui le istruzioni per configurare il DNS

## Troubleshooting

### Problema: Build Fallisce

**Sintomi:** GitHub Actions workflow fallisce durante il build

**Soluzioni:**
```bash
# Test locale del build
npm install
npm run build

# Se ci sono errori TypeScript
npm run build -- --mode production
```

### Problema: Dati non Persistono

**Sintomi:** I dati spariscono dopo il refresh

**Cause possibili:**
1. SAS token non configurato correttamente
2. SAS token scaduto
3. Permessi insufficienti

**Soluzioni:**
1. Verifica le environment variables nella Static Web App Configuration
2. Rigenera il SAS token con il comando dello Step 5
3. Assicurati che il SAS token abbia permessi `racwdl`
4. Controlla la console del browser (F12) per errori

### Problema: CORS Errors

**Sintomi:** Errori CORS nella console del browser o ETags non accessibili

**Soluzione:**
Il template Bicep configura già CORS con supporto per ETags. Se il problema persiste:

```bash
# Verifica CORS su Blob Storage
az storage cors list \
  --services b \
  --account-name <storage-account-name>

# Aggiungi/aggiorna CORS con ETag support
az storage cors add \
  --services b \
  --methods GET PUT POST DELETE HEAD OPTIONS \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "etag,x-ms-*,ETag,*" \
  --max-age 3600 \
  --account-name <storage-account-name>
```

**Nota:** Per produzione, limita `--origins` al dominio della tua app e assicurati che gli ETags siano esposti tramite `exposed-headers`.

### Problema: Conflitti di Scrittura Concorrente

**Sintomi:** Errori "Failed to save after 3 attempts" nella console

**Cause possibili:**
1. Alta concorrenza (molti utenti modificano simultaneamente)
2. Problemi di rete intermittenti
3. ETags non configurati correttamente

**Soluzioni:**
1. Verifica che CORS esponga gli header ETag (vedi sopra)
2. Controlla la console browser per errori 412 (Precondition Failed)
3. Riduci l'intervallo di refresh se necessario (in `useAzureStorageWithRefresh`)
4. Per alta concorrenza, considera la migrazione ad Azure Table Storage

Per maggiori dettagli sulla gestione della concorrenza, consulta [CONCURRENCY.md](../CONCURRENCY.md).

### Problema: GitHub Actions non Triggera

**Sintomi:** Push non avvia il deployment

**Soluzioni:**
1. Verifica che il file `.github/workflows/azure-static-web-apps.yml` esista
2. Controlla che il secret `AZURE_STATIC_WEB_APPS_API_TOKEN` sia configurato
3. Vai su Settings > Actions > General e verifica che i workflows siano abilitati

## Manutenzione

### Rinnovo SAS Token

Il SAS token ha una scadenza. Prima della scadenza:

1. Genera un nuovo token (Step 5)
2. Aggiorna la variabile `VITE_AZURE_STORAGE_SAS` nella Static Web App Configuration
3. Non serve rideploy, la nuova configurazione si applica automaticamente

### Backup dei Dati

I dati sono salvati come blob JSON in Azure Storage:

```bash
# Download di tutti i dati
az storage blob download-batch \
  --account-name <storage-account-name> \
  --source app-data \
  --destination ./backup \
  --pattern "*.json"
```

### Monitoraggio

Nel portale Azure:
1. Vai alla Static Web App
2. Clicca su **Metrics** per vedere traffico e performance
3. Clicca su **Logs** per diagnostica avanzata

## Costi Stimati

**Ambiente Development/Test:**
- Static Web App (Free tier): €0/mese
- Storage Account (LRS, <1GB): ~€0.02/mese
- **Totale: ~€0.02/mese**

**Ambiente Production (con traffico moderato):**
- Static Web App (Standard tier): ~€8/mese
- Storage Account (LRS, <1GB): ~€0.02/mese
- Bandwidth: ~€0.05/GB
- **Totale: ~€10-15/mese**

## Risorse Utili

- [Documentazione Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Documentazione Azure Blob Storage](https://docs.microsoft.com/azure/storage/blobs/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Supporto

Per problemi specifici:
1. Controlla i log in GitHub Actions
2. Verifica i log nel portale Azure (Static Web App > Log Stream)
3. Apri un issue su GitHub con dettagli e screenshot
4. Contatta il supporto Azure per problemi di infrastruttura

## Checklist Finale

Prima di considerare il deployment completato:

- [ ] Resource Group creato in Azure
- [ ] Static Web App deployata e raggiungibile
- [ ] Storage Account creato con container `app-data` e tabella `meetings`
- [ ] CORS configurato per esporre ETags
- [ ] SAS Token generato e configurato
- [ ] GitHub Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` configurato
- [ ] Environment variables configurate nella Static Web App
- [ ] GitHub Actions workflow completato con successo
- [ ] Applicazione accessibile via URL pubblico
- [ ] Test funzionalità: aggiungere/visualizzare incontri
- [ ] Test persistenza dati dopo refresh
- [ ] Test accesso concorrente (aprire 2+ tab e modificare simultaneamente)
- [ ] Verifica notifiche di aggiornamento dati esterni
- [ ] Test gestione pagamenti (con password)
- [ ] Backup della configurazione salvato

## Prossimi Passi

Dopo il deployment:
1. Configura un custom domain (opzionale)
2. Imposta il monitoraggio con Azure Application Insights
3. Configura alert per downtime
4. Pianifica rinnovo SAS token
5. Documenta la configurazione per il team
