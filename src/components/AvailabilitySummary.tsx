import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getAvailableParticipantsForRound } from "@/lib/meeting-utils"
import { getParticipantsForRound, normalizeParticipants } from "@/lib/participants"
import { Meeting, ParticipantsByRound } from "@/lib/types"
import { ListChecks } from "@phosphor-icons/react"
import { useMemo } from "react"

function AvailabilitySection({
  round,
  participants,
  available
}: {
  round: 1 | 2
  participants: string[]
  available: string[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={round === 1 ? "default" : "secondary"}>
          Turno {round}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {available.length} {available.length === 1 ? "libero" : "liberi"}
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">
          Nessun partecipante registrato per questo turno
        </p>
      ) : available.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">
          Nessun partecipante libero in questo turno
        </p>
      ) : (
        <ScrollArea className="h-[240px] pr-4">
          <div className="space-y-2">
            {available.map((person) => (
              <Card key={`${round}-${person}`} className="bg-card hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                  <p className="font-medium text-base md:text-lg">
                    {person}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
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
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Disponibilita</CardTitle>
        </div>
        <CardDescription className="text-base">
          Persone libere per turno senza dover selezionare nulla
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvailabilitySection
          round={1}
          participants={round1Participants}
          available={round1Available}
        />

        <Separator className="my-6" />

        <AvailabilitySection
          round={2}
          participants={round2Participants}
          available={round2Available}
        />
      </CardContent>
    </Card>
  )
}
