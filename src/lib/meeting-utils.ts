import { Meeting } from "./types"

function normalizeParticipant(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeRound(value: unknown): 1 | 2 | null {
  if (value === 1 || value === 2) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return parsed === 1 || parsed === 2 ? parsed : null
  }
  return null
}

function meetingRoundMatches(meeting: Meeting, round: 1 | 2): boolean {
  return normalizeRound(meeting.round) === round
}

export function personHasMeetingInRound(
  person: string,
  round: 1 | 2,
  allMeetings: Meeting[]
): boolean {
  const normalizedPerson = normalizeParticipant(person)
  return allMeetings.some(
    (m) => meetingRoundMatches(m, round) && (
      normalizeParticipant(m.person1) === normalizedPerson ||
      normalizeParticipant(m.person2) === normalizedPerson
    )
  )
}

export function getAvailablePartners(
  currentPerson: string,
  round: 1 | 2,
  allMeetings: Meeting[],
  allParticipants: readonly string[]
): string[] {
  const normalizedCurrent = normalizeParticipant(currentPerson)
  const meetingsForRound = allMeetings.filter((m) => meetingRoundMatches(m, round))
  const allMeetingsForPerson = allMeetings.filter(
    (m) =>
      normalizeParticipant(m.person1) === normalizedCurrent ||
      normalizeParticipant(m.person2) === normalizedCurrent
  )
  
  const alreadyPairedWith = new Set<string>()
  const peopleWithMeetings = new Set<string>()
  const alreadyPairedInAnyRound = new Set<string>()
  
  meetingsForRound.forEach((meeting) => {
    const normalizedPerson1 = normalizeParticipant(meeting.person1)
    const normalizedPerson2 = normalizeParticipant(meeting.person2)
    peopleWithMeetings.add(normalizedPerson1)
    peopleWithMeetings.add(normalizedPerson2)
    
    if (normalizedPerson1 === normalizedCurrent) {
      alreadyPairedWith.add(normalizedPerson2)
    } else if (normalizedPerson2 === normalizedCurrent) {
      alreadyPairedWith.add(normalizedPerson1)
    }
  })

  allMeetingsForPerson.forEach((meeting) => {
    const normalizedPerson1 = normalizeParticipant(meeting.person1)
    const normalizedPerson2 = normalizeParticipant(meeting.person2)
    if (normalizedPerson1 === normalizedCurrent) {
      alreadyPairedInAnyRound.add(normalizedPerson2)
    } else if (normalizedPerson2 === normalizedCurrent) {
      alreadyPairedInAnyRound.add(normalizedPerson1)
    }
  })
  
  return allParticipants.filter(
    (participant) => {
      const normalizedParticipant = normalizeParticipant(participant)
      return normalizedParticipant !== normalizedCurrent &&
        !alreadyPairedWith.has(normalizedParticipant) &&
        !alreadyPairedInAnyRound.has(normalizedParticipant) &&
        !peopleWithMeetings.has(normalizedParticipant)
    }
  )
}

export function getAvailableParticipantsForRound(
  round: 1 | 2,
  allMeetings: Meeting[],
  participantsForRound: readonly string[]
): string[] {
  const busyPeople = new Set<string>()

  allMeetings.forEach((meeting) => {
    if (!meetingRoundMatches(meeting, round)) {
      return
    }
    busyPeople.add(normalizeParticipant(meeting.person1))
    busyPeople.add(normalizeParticipant(meeting.person2))
  })

  return participantsForRound.filter(
    (person) => !busyPeople.has(normalizeParticipant(person))
  )
}

export function getMeetingsByRound(meetings: Meeting[], round: 1 | 2): Meeting[] {
  return meetings.filter((m) => meetingRoundMatches(m, round))
}

export function getMeetingsForPerson(meetings: Meeting[], person: string): Meeting[] {
  const normalizedPerson = normalizeParticipant(person)
  return meetings.filter(
    (m) =>
      normalizeParticipant(m.person1) === normalizedPerson ||
      normalizeParticipant(m.person2) === normalizedPerson
  )
}

export function getPartnerForMeeting(meeting: Meeting, person: string): string {
  const normalizedPerson = normalizeParticipant(person)
  if (normalizeParticipant(meeting.person1) === normalizedPerson) {
    return meeting.person2
  }
  if (normalizeParticipant(meeting.person2) === normalizedPerson) {
    return meeting.person1
  }
  return meeting.person2
}

export function meetingExists(
  meetings: Meeting[],
  person1: string,
  person2: string,
  round: 1 | 2
): boolean {
  const normalizedPerson1 = normalizeParticipant(person1)
  const normalizedPerson2 = normalizeParticipant(person2)
  return meetings.some(
    (m) =>
      meetingRoundMatches(m, round) &&
      ((normalizeParticipant(m.person1) === normalizedPerson1 &&
        normalizeParticipant(m.person2) === normalizedPerson2) ||
        (normalizeParticipant(m.person1) === normalizedPerson2 &&
          normalizeParticipant(m.person2) === normalizedPerson1))
  )
}

export function meetingPairExistsAnyRound(
  meetings: Meeting[],
  person1: string,
  person2: string
): boolean {
  const normalizedPerson1 = normalizeParticipant(person1)
  const normalizedPerson2 = normalizeParticipant(person2)
  return meetings.some(
    (m) =>
      (normalizeParticipant(m.person1) === normalizedPerson1 &&
        normalizeParticipant(m.person2) === normalizedPerson2) ||
      (normalizeParticipant(m.person1) === normalizedPerson2 &&
        normalizeParticipant(m.person2) === normalizedPerson1)
  )
}
