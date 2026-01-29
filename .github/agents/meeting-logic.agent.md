---
description: 'Implement and validate meeting scheduling logic with round/pair constraints'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
---

# Meeting Logic Instructions

You are in Meeting Logic mode. Your primary objective is to implement and maintain the scheduling rules for 1-on-1 meetings. Follow this structured process:

## Phase 1: Domain Understanding

1. **Review Domain Types**:
   - Core type in [src/lib/types.ts](src/lib/types.ts):
     ```ts
     interface Meeting { id: string; person1: string; person2: string; round: 1 | 2; createdAt: string }
     ```
   - `PARTICIPANTS` constant array of ~32 names (Italian uppercase format)
   - `Participant` type derived from `PARTICIPANTS` array

2. **Understand Business Rules**:
   - Two rounds per event (round 1 and round 2)
   - Each person can have only ONE meeting per round
   - A pair can meet only ONCE across all rounds (no repeat partners)
   - All constraint checks live in [src/lib/meeting-utils.ts](src/lib/meeting-utils.ts)

## Phase 2: Working with Utilities

3. **Available Utility Functions**:
   - `personHasMeetingInRound(person, round, meetings)` → boolean
   - `getAvailablePartners(person, round, meetings, participants)` → string[]
   - `getMeetingsByRound(meetings, round)` → Meeting[]
   - `getMeetingsForPerson(meetings, person)` → Meeting[]
   - `getPartnerForMeeting(meeting, person)` → string
   - `meetingExists(meetings, person1, person2, round)` → boolean
   - `meetingPairExistsAnyRound(meetings, person1, person2)` → boolean

4. **Constraint Implementation**:
   - `getAvailablePartners` is the key filter - excludes:
     - The person themselves
     - Anyone already paired with this person in ANY round
     - Anyone who already has a meeting in THIS round
   - Always validate before creating: check all three conditions

## Phase 3: Adding/Modifying Logic

5. **When Adding New Constraints**:
   - Add helper function to [src/lib/meeting-utils.ts](src/lib/meeting-utils.ts)
   - Keep functions pure (no side effects, no storage access)
   - Export for use in components
   - Follow existing naming: `verbNounInContext` pattern

6. **Validation in Components**:
   - See [src/components/AddMeeting.tsx](src/components/AddMeeting.tsx) for validation flow
   - Triple-check before insert: `personHasMeetingInRound`, `meetingExists`, `meetingPairExistsAnyRound`
   - Show user-friendly Italian error messages via `toast.error()`

## Phase 4: Testing & Quality

7. **Manual Testing Strategy**:
   - Add several meetings to round 1, verify partners become unavailable
   - Try same pair in round 2 - should be blocked
   - Fill a round completely, verify all participants show "già impegnato"
   - Edge cases: first meeting, last available partner, all slots full

8. **Final Report**:
   - Summarize constraint changes
   - Document any new utility functions
   - Note edge cases considered

## Meeting Logic Guidelines
- **Round Type**: Always use literal `1 | 2`, never string or arbitrary number
- **ID Generation**: Use `${Date.now()}-${Math.random()}` format for uniqueness
- **Pair Symmetry**: `meetingPairExistsAnyRound` checks both orderings (A-B and B-A)
- **Immutability**: Never mutate meetings array; always spread into new array
- **Participant Source**: Always use `PARTICIPANTS` constant, not hardcoded names

Remember: The `getAvailablePartners` function is the single source of truth for who can meet whom.
