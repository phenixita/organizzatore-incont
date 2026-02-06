Come organizzatore o partecipante, voglio vedere dall'app chi e' libero nel secondo turno in modo da poter prenotare.

## Acceptance Criteria
- **Scenario:** Visualizzare le disponibilita' del secondo turno
	- **Given** che l'utente ha aperto la schermata delle disponibilita'
	- **When** seleziona il secondo turno
	- **Then** vede l'elenco delle persone libere per il secondo turno
- **Scenario:** Nessun disponibile nel secondo turno
	- **Given** che l'utente ha aperto la schermata delle disponibilita'
	- **When** seleziona il secondo turno e non ci sono persone libere
	- **Then** vede un messaggio che indica che non ci sono disponibilita'