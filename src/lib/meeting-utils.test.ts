import { describe, expect, it } from "vitest"
import {
    getAvailableParticipantsForRound,
    getAvailablePartners,
    getMeetingsByRound,
    getMeetingsForPerson,
    getPartnerForMeeting,
    meetingExists,
    meetingPairExistsAnyRound,
    personHasMeetingInRound
} from "./meeting-utils"
import type { Meeting } from "./types"

const buildMeeting = (person1: string, person2: string, round: 1 | 2): Meeting => ({
  id: `${person1}-${person2}-${round}`,
  person1,
  person2,
  round,
  createdAt: new Date().toISOString()
})

describe("meeting-utils", () => {
  it("detects if a person has a meeting in a round", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]

    expect(personHasMeetingInRound("Anna", 1, meetings)).toBe(true)
    expect(personHasMeetingInRound("Bob", 1, meetings)).toBe(true)
    expect(personHasMeetingInRound("Anna", 2, meetings)).toBe(false)
  })

  it("handles casing and whitespace in names", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]

    expect(personHasMeetingInRound("  anna ", 1, meetings)).toBe(true)
    expect(getMeetingsForPerson(meetings, "BOB")).toHaveLength(1)
  })

  it("accepts string rounds for matching", () => {
    const meetings = [
      {
        ...buildMeeting("Anna", "Bob", 1),
        round: "2"
      } as unknown as Meeting
    ]

    expect(personHasMeetingInRound("Anna", 2, meetings)).toBe(true)
  })

  it("returns available participants for a round", () => {
    const meetings = [
      buildMeeting("Anna", "Bob", 1),
      buildMeeting("Cara", "Dani", 2)
    ]
    const round1Participants = ["Anna", "Bob", "Cara"]

    expect(
      getAvailableParticipantsForRound(1, meetings, round1Participants)
    ).toEqual(["Cara"])
  })

  it("treats duplicates with different casing as the same person", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]
    const round1Participants = ["ANNA", " anna ", "Bob", "Cara"]

    expect(
      getAvailableParticipantsForRound(1, meetings, round1Participants)
    ).toEqual(["Cara"])
  })

  it("excludes busy or already-met partners", () => {
    const meetings = [
      buildMeeting("Anna", "Bob", 1),
      buildMeeting("Cara", "Dani", 1),
      buildMeeting("Anna", "Cara", 2)
    ]
    const participants = ["Anna", "Bob", "Cara", "Dani"]

    expect(
      getAvailablePartners("Anna", 1, meetings, participants)
    ).toEqual([])
  })

  it("returns partners that are free in the round", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]
    const participants = ["Anna", "Bob", "Cara"]

    expect(
      getAvailablePartners("Anna", 1, meetings, participants)
    ).toEqual(["Cara"])
  })

  it("avoids partners already met in another round", () => {
    const meetings = [
      buildMeeting("Anna", "Bob", 1),
      buildMeeting("Anna", "Cara", 2)
    ]
    const participants = ["Anna", "Bob", "Cara", "Dani"]

    expect(
      getAvailablePartners("Anna", 1, meetings, participants)
    ).toEqual(["Dani"])
  })

  it("matches meetings by round and person", () => {
    const meetings = [
      buildMeeting("Anna", "Bob", 1),
      buildMeeting("Anna", "Cara", 2),
      buildMeeting("Dani", "Eva", 1)
    ]

    expect(getMeetingsByRound(meetings, 1)).toHaveLength(2)
    expect(getMeetingsForPerson(meetings, "Anna")).toHaveLength(2)
  })

  it("ignores meetings with invalid rounds", () => {
    const meetings = [
      buildMeeting("Anna", "Bob", 1),
      {
        ...buildMeeting("Cara", "Dani", 1),
        round: 3
      } as unknown as Meeting,
      {
        ...buildMeeting("Eva", "Fede", 1),
        round: "x"
      } as unknown as Meeting
    ]

    expect(getMeetingsByRound(meetings, 1)).toHaveLength(1)
    expect(getMeetingsByRound(meetings, 2)).toHaveLength(0)
  })

  it("finds partner for a meeting", () => {
    const meeting = buildMeeting("Anna", "Bob", 1)

    expect(getPartnerForMeeting(meeting, "Anna")).toBe("Bob")
    expect(getPartnerForMeeting(meeting, "Bob")).toBe("Anna")
  })

  it("falls back to person2 when person is not part of meeting", () => {
    const meeting = buildMeeting("Anna", "Bob", 1)

    expect(getPartnerForMeeting(meeting, "Cara")).toBe("Bob")
  })

  it("checks if a meeting exists in a round", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]

    expect(meetingExists(meetings, "Anna", "Bob", 1)).toBe(true)
    expect(meetingExists(meetings, "Bob", "Anna", 1)).toBe(true)
    expect(meetingExists(meetings, "Anna", "Bob", 2)).toBe(false)
  })

  it("checks if a pair exists in any round", () => {
    const meetings = [buildMeeting("Anna", "Bob", 1)]

    expect(meetingPairExistsAnyRound(meetings, "Anna", "Bob")).toBe(true)
    expect(meetingPairExistsAnyRound(meetings, "Bob", "Anna")).toBe(true)
    expect(meetingPairExistsAnyRound(meetings, "Anna", "Cara")).toBe(false)
  })
})
