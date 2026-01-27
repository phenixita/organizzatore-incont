# Organizzatore Incontri 1-a-1

Un'applicazione per organizzare incontri 1-a-1 tra 32 persone in due turni, con gestione dei pagamenti.

## 🚀 Deployment su Azure

Questa applicazione è configurata per essere ospitata su **Azure Static Web Apps** con **Azure Blob Storage** per la persistenza dei dati.

### Prerequisiti

- Account Azure attivo
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) installata
- Account GitHub con accesso al repository
- Node.js 18+ per lo sviluppo locale

### Deployment Automatico

1. **Esegui lo script di deployment:**

**macOS/Linux (bash):**
```bash
cd infrastructure
./deploy.sh [project-name] [environment] [location]
```

**Windows / PowerShell Core (pwsh):**
```powershell
cd infrastructure
./deploy.ps1 [project-name] [environment] [location]
```

Parametri (tutti opzionali, con valori di default):
- `project-name`: Nome del progetto (default: `orgincont`)
- `environment`: Ambiente (`dev`, `staging`, `prod`) (default: `dev`)
- `location`: Regione Azure (default: `westeurope`)

Esempio:
```bash
./deploy.sh organizzatore prod westeurope
```
```powershell
./deploy.ps1 organizzatore prod westeurope
```

2. **Configura GitHub Secret:**

Dopo il deployment, lo script ti fornirà un token. Aggiungilo al repository GitHub:
- Vai su Settings > Secrets and variables > Actions
- Crea un nuovo secret chiamato `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Incolla il token fornito dallo script

3. **Genera e configura il SAS Token:**

Esegui il comando fornito dallo script per generare il SAS token per Azure Storage:

```bash
az storage container generate-sas \
  --account-name <storage-account-name> \
  --name app-data \
  --permissions racwdl \
  --expiry <date> \
  --auth-mode key \
  --output tsv
```

4. **Configura le variabili d'ambiente nella Static Web App:**

Nel portale Azure:
- Vai alla tua Static Web App
- Seleziona "Configuration" nel menu laterale
- Aggiungi le seguenti variabili in "Application settings":
  - `VITE_AZURE_STORAGE_ACCOUNT`: nome dello storage account
  - `VITE_AZURE_STORAGE_CONTAINER`: `app-data`
  - `VITE_AZURE_STORAGE_SAS`: il SAS token generato (include il `?` all'inizio)

5. **Push al repository:**

Il workflow GitHub Actions deploierà automaticamente l'applicazione:

```bash
git push origin main
```

### Deployment Manuale con Azure CLI

Se preferisci un approccio manuale:

1. **Crea il Resource Group:**
```bash
az group create --name orgincont-rg --location westeurope
```

2. **Deploy i template Bicep:**
```bash
az deployment group create \
  --resource-group orgincont-rg \
  --template-file infrastructure/main.bicep \
  --parameters projectName=orgincont environment=prod
```

3. Segui i passi 2-5 della sezione "Deployment Automatico"

### Verifica del Deployment

Dopo il deployment:
1. L'applicazione sarà disponibile all'URL della Static Web App (fornito dallo script)
2. I dati verranno salvati automaticamente in Azure Blob Storage
3. Ogni push al branch `main` triggerà un nuovo deployment

## 💻 Sviluppo Locale

### Installazione

```bash
npm install
```

### Configurazione Locale

Per sviluppare localmente, hai due opzioni:

**Opzione 1: Usa localStorage (più semplice)**
- Non serve configurazione
- I dati vengono salvati solo nel browser locale
- Perfetto per sviluppo e test

**Opzione 2: Connettiti ad Azure Storage**
1. Copia il file `.env.example` in `.env.local`
2. Compila le variabili con i valori del tuo deployment Azure:
```bash
cp .env.example .env.local
# Modifica .env.local con i tuoi valori
```

### Avvio del Server di Sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

### Build per Produzione

```bash
npm run build
```

I file compilati saranno nella cartella `dist/`

### Linting

```bash
npm run lint
```

## 📁 Struttura del Progetto

```
organizzatore-incont/
├── src/
│   ├── components/       # Componenti React
│   ├── hooks/           # Custom hooks (incluso useAzureStorage)
│   ├── lib/             # Utility e tipi
│   └── styles/          # File CSS
├── infrastructure/      # Template Bicep e script di deployment
│   ├── modules/        # Moduli Bicep riutilizzabili
│   ├── main.bicep      # Template principale
│   ├── deploy.sh       # Script di deployment (bash)
│   └── deploy.ps1      # Script di deployment (pwsh)
├── .github/
│   └── workflows/      # GitHub Actions per CI/CD
├── staticwebapp.config.json  # Configurazione Azure Static Web App
└── package.json
```

## 🔧 Funzionalità

- ✅ Programmazione incontri 1-a-1 per 32 partecipanti
- ✅ Gestione di due turni separati
- ✅ Riepilogo per turno e per persona
- ✅ Sistema di gestione pagamenti con autenticazione
- ✅ Persistenza dati su Azure Blob Storage
- ✅ Fallback automatico a localStorage per sviluppo locale
- ✅ Interfaccia responsive per mobile e desktop

## 🔐 Sicurezza

- Tutti i dati sono trasmessi via HTTPS
- L'accesso allo storage è controllato tramite SAS token con scadenza
- Il SAS token non è mai esposto nel codice frontend
- CORS configurato per limitare l'accesso al solo dominio dell'applicazione

## 📝 Configurazione dei Dati

L'applicazione supporta la configurazione tramite chiavi salvate nello storage:

- `event-title`: Titolo dell'evento
- `event-description`: Descrizione dell'evento
- `event-date`: Data dell'evento
- `treasurer-password`: Password per l'accesso alla gestione pagamenti
- `payment-amount`: Importo del pagamento per persona
- `meetings`: Array degli incontri programmati
- `payments`: Array degli stati di pagamento

## 🤝 Contribuire

Contributi, issues e feature requests sono benvenuti!

## 📄 Licenza

Questo progetto usa componenti UI da Shadcn/ui ed è basato su tecnologie open source.

## 🆘 Supporto

Per problemi o domande:
1. Controlla la documentazione Azure Static Web Apps
2. Verifica i log nel portale Azure
3. Controlla le GitHub Actions per errori di deployment
4. Apri un issue su GitHub

## 🎯 Roadmap

- [ ] Esportazione dati in Excel/PDF
- [ ] Notifiche email per promemoria incontri
- [ ] Integrazione con calendario (Google Calendar, Outlook)
- [ ] Dashboard amministratore avanzata
