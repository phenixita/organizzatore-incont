export interface Meeting {
  id: string
  person1: string
  person2: string
  round: 1 | 2
  createdAt: string
}

export interface PaymentStatus {
  person: string
  hasPaid: boolean
  paidAt?: string
  amount?: number
}

export const PARTICIPANTS = [
  "ALESSANDRA VERONESE",
  "ALESSIO FASSANELLI",
  "ANDREA BETTIO",
  "ANDREA PASQUINELLI",
  "ANGELA NUCIBELLA",
  "ANTONIA MACRÌ",
  "CHIARA GUAGLIONE",
  "CINZIA SIMIONI",
  "DANIELE MARCHIORI",
  "DAVIDE FORALOSSO",
  "DEVYS SANVIDO",
  "EMANUELE GUSSON",
  "ENRICO VAROTTO",
  "GIANLUIGI CIRILLI",
  "GIANMARIA ZABEO",
  "GIANNI CALAON",
  "GIORGIO SCOCCO",
  "JOSELITO LUNARDI",
  "LORENZO VISCIDI",
  "MARCO VETTORAZZO",
  "MATTEO BALDROCCO",
  "MATTEO BARIZZA",
  "MICHELE FERRACIN",
  "MICHELE ZAMPIERI",
  "MORENA CORRADIN",
  "NICOLA VERARDO",
  "PERLA SALMASO",
  "PIETRO DI BRIZIO",
  "RICCARDO GIACOMINI",
  "SAMUELE MANIN",
  "STEFANO GRIGOLETTO",
  "STEFANO TURCATO"
] as const

export type Participant = typeof PARTICIPANTS[number]
