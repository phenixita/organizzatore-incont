import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getAllParticipants, normalizeParticipants } from "@/lib/participants"
import { ParticipantsByRound } from "@/lib/types"
import { UsersThree } from "@phosphor-icons/react"
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersThree size={24} weight="duotone" className="text-primary" />
            <CardTitle className="text-xl md:text-2xl">Partecipanti Iscritti</CardTitle>
          </div>
          <Badge variant="outline" className="text-base px-3">
            {participantsList.length}
          </Badge>
        </div>
        <CardDescription>
          Elenco di tutte le persone disponibili
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          id="participant-search"
          placeholder="Cerca per nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10"
        />

        {participantsList.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            Nessun partecipante iscritto
          </p>
        ) : filteredParticipants.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            Nessun partecipante trovato con "{searchTerm}"
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Turni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((person, idx) => {
                const isRound1 = round1Set.has(person)
                const isRound2 = round2Set.has(person)
                return (
                  <TableRow key={person}>
                    <TableCell className="text-center text-muted-foreground text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{person}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {isRound1 && (
                          <Badge variant="default" className="text-xs px-1.5 py-0">1</Badge>
                        )}
                        {isRound2 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">2</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
