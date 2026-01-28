import { useAzureStorage } from "@/hooks/useAzureStorage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { UsersThree, UserCircle } from "@phosphor-icons/react"
import { Meeting } from "@/lib/types"
import { useState } from "react"

export default function ParticipantsList() {
  const [meetings] = useAzureStorage<Meeting[]>("meetings", [])
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique participants who are registered to at least one meeting
  const participants = new Set<string>()
  ;(meetings || []).forEach((meeting) => {
    participants.add(meeting.person1)
    participants.add(meeting.person2)
  })

  const participantsList = Array.from(participants).sort()

  // Count meetings per participant
  const getMeetingCountForPerson = (person: string): { round1: boolean; round2: boolean } => {
    const personMeetings = (meetings || []).filter(
      (m) => m.person1 === person || m.person2 === person
    )
    return {
      round1: personMeetings.some((m) => m.round === 1),
      round2: personMeetings.some((m) => m.round === 2)
    }
  }

  const filteredParticipants = participantsList.filter((person) =>
    person.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersThree size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Partecipanti Iscritti</CardTitle>
        </div>
        <CardDescription className="text-base">
          Elenco di tutte le persone iscritte ad almeno un turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Totale Partecipanti</p>
              <p className="text-xs text-muted-foreground">Persone iscritte ad almeno un incontro</p>
            </div>
            <p className="text-4xl font-bold text-primary">
              {participantsList.length}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Cerca partecipante
          </label>
          <Input
            placeholder="Cerca per nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        {participantsList.length === 0 ? (
          <div className="text-center py-12">
            <UserCircle size={48} weight="duotone" className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Nessun partecipante iscritto ancora
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Inizia ad aggiungere incontri nella scheda "Nuovo Incontro"
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredParticipants.map((person) => {
                const meetingInfo = getMeetingCountForPerson(person)
                return (
                  <Card
                    key={person}
                    className="bg-card hover:bg-muted/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <UserCircle size={24} weight="duotone" className="text-primary flex-shrink-0" />
                          <p className="font-medium text-base md:text-lg">
                            {person}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {meetingInfo.round1 && (
                            <Badge variant="default" className="text-xs">
                              Turno 1
                            </Badge>
                          )}
                          {meetingInfo.round2 && (
                            <Badge variant="secondary" className="text-xs">
                              Turno 2
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {filteredParticipants.length === 0 && participantsList.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nessun partecipante trovato con "{searchTerm}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
