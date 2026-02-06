import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getAllParticipants, normalizeParticipants } from "@/lib/participants"
import { ParticipantsByRound } from "@/lib/types"
import { UserCircle, UsersThree } from "@phosphor-icons/react"
import { useMemo, useState } from "react"

export default function ParticipantsList() {
  const [participants] = useAzureStorage<ParticipantsByRound | string[]>(
    "participants",
    { round1: [], round2: [] }
  )
  const [searchTerm, setSearchTerm] = useState("")

  const participantsByRound = useMemo(
    () => normalizeParticipants(participants),
    [participants]
  )

  const participantsList = useMemo(
    () => getAllParticipants(participantsByRound),
    [participantsByRound]
  )

  const round1Set = useMemo(
    () => new Set(participantsByRound.round1),
    [participantsByRound]
  )

  const round2Set = useMemo(
    () => new Set(participantsByRound.round2),
    [participantsByRound]
  )

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
          Elenco di tutte le persone disponibili
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Totale Partecipanti</p>
              <p className="text-xs text-muted-foreground">Persone disponibili nel roster</p>
            </div>
            <p className="text-4xl font-bold text-primary">
              {participantsList.length}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="participant-search" className="text-sm font-medium text-foreground">
            Cerca partecipante
          </label>
          <Input
            id="participant-search"
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
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nessun partecipante trovato con "{searchTerm}"
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredParticipants.map((person) => {
                const isRound1 = round1Set.has(person)
                const isRound2 = round2Set.has(person)
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
                          {isRound1 && (
                            <Badge variant="default" className="text-xs">
                              Turno 1
                            </Badge>
                          )}
                          {isRound2 && (
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
      </CardContent>
    </Card>
  )
}
