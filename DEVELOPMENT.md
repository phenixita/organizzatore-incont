# Guida Sviluppo Locale

Guida rapida per sviluppare e testare l'applicazione localmente.

## Setup Iniziale

### 1. Prerequisiti
- Node.js 18 o superiore
- npm o yarn
- Git

### 2. Clone e Installazione

```bash
# Clone repository
git clone https://github.com/phenixita/organizzatore-incont.git
cd organizzatore-incont

# Installa dipendenze
npm install
```

### 3. Configurazione

Hai due opzioni per lo sviluppo locale:

#### Opzione A: localStorage (Consigliato per Development)

**Nessuna configurazione necessaria!** L'applicazione usa automaticamente localStorage se Azure Storage non è configurato.

**Pro:**
- Setup immediato
- Nessuna dipendenza esterna
- Perfetto per sviluppo e test

**Contro:**
- Dati salvati solo nel browser locale
- Dati persi se cancelli la cache del browser

#### Opzione B: Azure Storage (Per Testing Produzione)

Se vuoi testare con Azure Storage:

```bash
# Copia template
cp .env.example .env.local

# Modifica .env.local con i tuoi valori Azure
VITE_AZURE_STORAGE_ACCOUNT=your-storage-account
VITE_AZURE_STORAGE_CONTAINER=app-data
VITE_AZURE_STORAGE_SAS=?sv=2021-06-08&ss=...
```

## Comandi di Sviluppo

### Avvia Dev Server

```bash
npm run dev
```

Apri http://localhost:5173 nel browser.

**Caratteristiche:**
- ⚡ Hot Module Replacement (HMR)
- 🔄 Auto-reload su modifiche
- 💨 Fast Refresh per React

### Build per Produzione

```bash
npm run build
```

Output in `dist/`

### Preview Build di Produzione

```bash
npm run build
npm run preview
```

Serve la build di produzione su http://localhost:4173

### Linting

```bash
npm run lint
```

Controlla errori di codice e stile.

## Struttura Progetto

```
src/
├── components/          # Componenti React
│   ├── ui/             # Componenti UI base (shadcn/ui)
│   ├── AddMeeting.tsx  # Form aggiunta incontri
│   ├── SummaryByRound.tsx
│   ├── SummaryByPerson.tsx
│   └── PaymentTracker.tsx
├── hooks/              # Custom React hooks
│   └── useAzureStorage.ts  # Hook per storage
├── lib/                # Utility e logica business
│   ├── types.ts        # TypeScript types
│   ├── meeting-utils.ts # Utility per incontri
│   └── utils.ts        # Utility generiche
├── styles/             # CSS e tema
│   └── theme.css       # Variabili colore
├── App.tsx             # Componente principale
└── main.tsx            # Entry point
```

## Sviluppo Componenti

### Aggiungere un Nuovo Componente

```bash
# Crea file componente
touch src/components/MyComponent.tsx
```

```tsx
// src/components/MyComponent.tsx
import { useAzureStorage } from "@/hooks/useAzureStorage"

export default function MyComponent() {
  const [data, setData] = useAzureStorage<string[]>("my-key", [])
  
  return (
    <div>
      {/* UI */}
    </div>
  )
}
```

### Usare il Storage Hook

```tsx
import { useAzureStorage } from "@/hooks/useAzureStorage"

// Nel componente
const [meetings, setMeetings] = useAzureStorage<Meeting[]>("meetings", [])

// Lettura
console.log(meetings)

// Scrittura
setMeetings([...meetings, newMeeting])

// Update funzionale
setMeetings(current => [...current, newMeeting])
```

## Testing Funzionalità

### Test Completo Flusso

1. **Avvia app**: `npm run dev`
2. **Aggiungi incontro**:
   - Seleziona persona
   - Seleziona turno (1 o 2)
   - Seleziona partner
   - Clicca "Programma Incontro"
3. **Verifica riepilogo**:
   - Vai a "Per Turno": vedi l'incontro
   - Vai a "Per Persona": cerca la persona e vedi l'incontro
4. **Test persistenza**:
   - Refresh pagina (F5)
   - I dati devono essere ancora presenti
5. **Test pagamenti**:
   - Vai a "Pagamenti"
   - Vedi totale raccolto
   - Configura password in localStorage: 
     - F12 > Console
     - `localStorage.setItem("kv:treasurer-password", JSON.stringify("test123"))`
     - Refresh
     - Inserisci "test123" come password
   - Marca persone come pagate

### Testare con Dati di Test

```javascript
// Nella console del browser (F12)

// Aggiungi password tesoriere
localStorage.setItem("kv:treasurer-password", JSON.stringify("test123"))

// Aggiungi importo pagamento
localStorage.setItem("kv:payment-amount", JSON.stringify(25))

// Aggiungi incontri di test
const testMeetings = [
  {
    id: "1",
    person1: "ALESSANDRA VERONESE",
    person2: "ANDREA BETTIO",
    round: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    person1: "DAVIDE FORALOSSO",
    person2: "ENRICO VAROTTO",
    round: 2,
    createdAt: new Date().toISOString()
  }
]
localStorage.setItem("kv:meetings", JSON.stringify(testMeetings))

// Refresh pagina
location.reload()
```

## Debug

### Aprire DevTools

Premi `F12` o:
- Chrome/Edge: Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
- Firefox: Ctrl+Shift+K (Windows) / Cmd+Option+K (Mac)

### Controllare Storage

**localStorage:**
1. F12 > Application (Chrome) / Storage (Firefox)
2. Local Storage > http://localhost:5173
3. Vedi tutte le chiavi `kv:*`

**Console:**
```javascript
// Vedi tutti i dati
Object.keys(localStorage)
  .filter(k => k.startsWith('kv:'))
  .forEach(k => console.log(k, localStorage.getItem(k)))

// Cancella tutti i dati
Object.keys(localStorage)
  .filter(k => k.startsWith('kv:'))
  .forEach(k => localStorage.removeItem(k))
```

### Controllare Network (Azure Storage)

1. F12 > Network tab
2. Filter: `blob.core.windows.net`
3. Reload page
4. Vedi richieste GET/PUT allo storage

**Stati HTTP:**
- `200`: Success
- `404`: Blob non trovato (normale per nuovo dato)
- `403`: SAS token invalido/scaduto
- `CORS error`: Problema CORS configuration

## Troubleshooting Comune

### Build Errors

**Errore TypeScript:**
```bash
# Fai check manuale
npx tsc --noEmit
```

**Dependency issues:**
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Non Funziona

```bash
# Restart server
# Ctrl+C per fermare
npm run dev
```

### Port Already in Use

```bash
# Cambia porta
npm run dev -- --port 3000
```

O trova e killa processo:
```bash
# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Styling Non Applicato

- Verifica importazioni CSS in `main.tsx`
- Controlla che Tailwind sia configurato in `vite.config.ts`
- Prova rebuild: `npm run build`

## Best Practices

### 1. Commit Frequenti

```bash
git add .
git commit -m "feat: descrizione breve"
git push
```

### 2. Branch per Feature

```bash
git checkout -b feature/nome-feature
# ... sviluppo ...
git push origin feature/nome-feature
# Crea PR su GitHub
```

### 3. Code Style

- Usa ESLint: `npm run lint`
- Format code: Prettier (se configurato)
- Segui convenzioni React Hooks

### 4. TypeScript

- Definisci types in `lib/types.ts`
- Non usare `any` quando possibile
- Usa type inference

### 5. Performance

- Usa `useCallback` e `useMemo` quando appropriato
- Evita re-render non necessari
- Lazy load componenti pesanti

## Workflow Tipico

### Nuova Feature

```bash
# 1. Update main
git checkout main
git pull

# 2. Nuova branch
git checkout -b feature/my-feature

# 3. Sviluppa
# ... modifica file ...
npm run dev  # test continuo

# 4. Test
npm run build  # verifica build
npm run lint   # verifica code style

# 5. Commit
git add .
git commit -m "feat: aggiunta feature X"

# 6. Push e PR
git push origin feature/my-feature
# Crea PR su GitHub
```

### Bug Fix

```bash
git checkout -b fix/bug-description
# ... fix ...
git commit -m "fix: corretto bug X"
git push origin fix/bug-description
```

## Risorse

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Supporto

Problemi durante sviluppo?
1. Cerca issue simili su GitHub
2. Controlla documentazione delle dipendenze
3. Chiedi al team
4. Apri nuovo issue con dettagli completi
