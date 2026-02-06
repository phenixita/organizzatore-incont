import { ParticipantsByRound } from "./types"

export function normalizeParticipants(
  value: ParticipantsByRound | string[] | null | undefined
): ParticipantsByRound {
  if (Array.isArray(value)) {
    return { round1: value.slice(), round2: [] }
  }

  if (!value) {
    return { round1: [], round2: [] }
  }

  return {
    round1: Array.isArray(value.round1) ? value.round1.slice() : [],
    round2: Array.isArray(value.round2) ? value.round2.slice() : []
  }
}

export function getAllParticipants(value: ParticipantsByRound): string[] {
  return Array.from(new Set([...value.round1, ...value.round2])).sort()
}

export function getParticipantsForRound(
  value: ParticipantsByRound,
  round: 1 | 2
): string[] {
  return (round === 1 ? value.round1 : value.round2).slice()
}
