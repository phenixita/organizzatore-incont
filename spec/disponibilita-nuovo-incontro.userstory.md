Come partecipante, voglio vedere nella sezione "Nuovo incontro" solo i nomi disponibili sia per "Chi sei?" sia per "Con chi ti vuoi incontrare?" in modo da poter prenotare senza errori.

## Acceptance Criteria
- **Scenario:** Mostrare solo i partecipanti disponibili nel turno selezionato
  - **Given** che l'utente ha selezionato un turno
  - **When** apre la lista "Chi sei?"
  - **Then** vede solo i nomi delle persone disponibili per quel turno
- **Scenario:** Escludere chi ha gia' un incontro nello stesso turno
  - **Given** che l'utente ha selezionato un turno
  - **When** apre la lista "Con chi ti vuoi incontrare?"
  - **Then** non vede persone che hanno gia' un incontro in quel turno
- **Scenario:** Escludere chi ha gia' incontrato la stessa persona
  - **Given** che l'utente ha selezionato un turno e ha scelto se stesso
  - **When** apre la lista "Con chi ti vuoi incontrare?"
  - **Then** non vede persone gia' incontrate in un altro turno
- **Scenario:** Escludere chi ha gia' un incontro in entrambi i turni
  - **Given** che l'utente sta creando un nuovo incontro
  - **When** apre le liste "Chi sei?" e "Con chi ti vuoi incontrare?"
  - **Then** non vede i nomi delle persone che hanno gia' un incontro nel primo e nel secondo turno
