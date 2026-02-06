export interface Meeting {
  id: string
  person1: string
  person2: string
  round: 1 | 2
  createdAt: string
}

export interface ParticipantsByRound {
  round1: string[]
  round2: string[]
}
