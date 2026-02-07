import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getMeetingsForPerson, getPartnerForMeeting } from "@/lib/meeting-utils"
import { getAllParticipants, normalizeParticipants } from "@/lib/participants"
import { Meeting, ParticipantsByRound } from "@/lib/types"
import { Trash, UserCircle } from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

export default function SummaryByPerson() {
  const [meetings, setMeetings] = useAzureStorage<Meeting[]>("meetings", [])
  const [participants] = useAzureStorage<ParticipantsByRound | string[]>(
    "participants",
    { round1: [], round2: [] }
  )
  const [selectedPerson, setSelectedPerson] = useState<string>("")

  const registeredParticipants = getAllParticipants(
    normalizeParticipants(participants)
  )

  const personMeetings = selectedPerson
    ? getMeetingsForPerson(meetings || [], selectedPerson)
    : []

  const round1Meetings = personMeetings.filter((m) => m.round === 1)
  const round2Meetings = personMeetings.filter((m) => m.round === 2)

  const handleDeleteMeeting = (meetingId: string, meeting: Meeting) => {
    const partner = getPartnerForMeeting(meeting, selectedPerson)
    setMeetings((current) => (current || []).filter((m) => m.id !== meetingId))
    toast.success(`Incontro rimosso: ${selectedPerson} con ${partner}`)
  }

  const RoundTable = ({ round, roundMeetings }: { round: 1 | 2; roundMeetings: Meeting[] }) => {
    if (roundMeetings.length === 0) return null
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={round === 1 ? "default" : "secondary"}>
            Turno {round}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {roundMeetings.length} {roundMeetings.length === 1 ? "incontro" : "incontri"}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Incontra</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roundMeetings.map((meeting, idx) => (
              <TableRow key={meeting.id}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {getPartnerForMeeting(meeting, selectedPerson)}
                </TableCell>
                <TableCell className="text-right p-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteMeeting(meeting.id, meeting)}
                  >
                    <Trash size={14} weight="bold" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserCircle size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Riepilogo per Persona</CardTitle>
        </div>
        <CardDescription>
          Filtra gli incontri per persona
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Seleziona una persona
          </label>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Scegli una persona" />
            </SelectTrigger>
            <SelectContent>
              {registeredParticipants.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPerson && (
          <div className="space-y-5">
            {personMeetings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Nessun incontro programmato
              </p>
            ) : (
              <>
                <RoundTable round={1} roundMeetings={round1Meetings} />
                <RoundTable round={2} roundMeetings={round2Meetings} />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
