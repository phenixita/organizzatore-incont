import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getAvailableParticipantsForRound } from "@/lib/meeting-utils"
import { getParticipantsForRound, normalizeParticipants } from "@/lib/participants"
import { Meeting, ParticipantsByRound } from "@/lib/types"
import { ListChecks } from "@phosphor-icons/react"
import { useMemo } from "react"

function AvailabilityTable({
  round,
  participants,
  available
}: {
  round: 1 | 2
  participants: string[]
  available: string[]
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={round === 1 ? "default" : "secondary"}>
          Turno {round}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {available.length} {available.length === 1 ? "libero" : "liberi"}
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">
          Nessun partecipante registrato
        </p>
      ) : available.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">
          Nessun partecipante libero
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Partecipante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {available.map((person, idx) => (
              <TableRow key={`${round}-${person}`}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">{person}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default function AvailabilitySummary() {
  const [meetings] = useAzureStorage<Meeting[]>("meetings", [])
  const [participants] = useAzureStorage<ParticipantsByRound | string[]>(
    "participants",
    { round1: [], round2: [] }
  )

  const participantsByRound = useMemo(
    () => normalizeParticipants(participants),
    [participants]
  )

  const round1Participants = useMemo(
    () => getParticipantsForRound(participantsByRound, 1).sort(),
    [participantsByRound]
  )

  const round2Participants = useMemo(
    () => getParticipantsForRound(participantsByRound, 2).sort(),
    [participantsByRound]
  )

  const round1Available = useMemo(
    () => getAvailableParticipantsForRound(1, meetings || [], round1Participants),
    [meetings, round1Participants]
  )

  const round2Available = useMemo(
    () => getAvailableParticipantsForRound(2, meetings || [], round2Participants),
    [meetings, round2Participants]
  )

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ListChecks size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Disponibilita</CardTitle>
        </div>
        <CardDescription>
          Persone libere per turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AvailabilityTable
          round={1}
          participants={round1Participants}
          available={round1Available}
        />

        <AvailabilityTable
          round={2}
          participants={round2Participants}
          available={round2Available}
        />
      </CardContent>
    </Card>
  )
}
