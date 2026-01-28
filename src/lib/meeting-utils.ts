import { Meeting } from "./types"

export function personHasMeetingInRound(
  person: string,
  round: 1 | 2,
  allMeetings: Meeting[]
): boolean {
  return allMeetings.some(
    (m) => m.round === round && (m.person1 === person || m.person2 === person)
  )
}

export function getAvailablePartners(
  currentPerson: string,
  round: 1 | 2,
  allMeetings: Meeting[],
  allParticipants: readonly string[]
): string[] {
  const meetingsForRound = allMeetings.filter((m) => m.round === round)
  const allMeetingsForPerson = allMeetings.filter(
    (m) => m.person1 === currentPerson || m.person2 === currentPerson
  )
  
  const alreadyPairedWith = new Set<string>()
  const peopleWithMeetings = new Set<string>()
  const alreadyPairedInAnyRound = new Set<string>()
  
  meetingsForRound.forEach((meeting) => {
    peopleWithMeetings.add(meeting.person1)
    peopleWithMeetings.add(meeting.person2)
    
    if (meeting.person1 === currentPerson) {
      alreadyPairedWith.add(meeting.person2)
    } else if (meeting.person2 === currentPerson) {
      alreadyPairedWith.add(meeting.person1)
    }
  })

  allMeetingsForPerson.forEach((meeting) => {
    if (meeting.person1 === currentPerson) {
      alreadyPairedInAnyRound.add(meeting.person2)
    } else if (meeting.person2 === currentPerson) {
      alreadyPairedInAnyRound.add(meeting.person1)
    }
  })
  
  return allParticipants.filter(
    (participant) =>
      participant !== currentPerson && 
      !alreadyPairedWith.has(participant) &&
      !alreadyPairedInAnyRound.has(participant) &&
      !peopleWithMeetings.has(participant)
  )
}

export function getMeetingsByRound(meetings: Meeting[], round: 1 | 2): Meeting[] {
  return meetings.filter((m) => m.round === round)
}

export function getMeetingsForPerson(meetings: Meeting[], person: string): Meeting[] {
  return meetings.filter(
    (m) => m.person1 === person || m.person2 === person
  )
}

export function getPartnerForMeeting(meeting: Meeting, person: string): string {
  return meeting.person1 === person ? meeting.person2 : meeting.person1
}

export function meetingExists(
  meetings: Meeting[],
  person1: string,
  person2: string,
  round: 1 | 2
): boolean {
  return meetings.some(
    (m) =>
      m.round === round &&
      ((m.person1 === person1 && m.person2 === person2) ||
        (m.person1 === person2 && m.person2 === person1))
  )
}

export function meetingPairExistsAnyRound(
  meetings: Meeting[],
  person1: string,
  person2: string
): boolean {
  return meetings.some(
    (m) =>
      (m.person1 === person1 && m.person2 === person2) ||
      (m.person1 === person2 && m.person2 === person1)
  )
}
