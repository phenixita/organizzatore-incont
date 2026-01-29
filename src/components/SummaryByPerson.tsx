import { useState } from "react"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { UserCircle, UsersThree, Trash } from "@phosphor-icons/react"
import { Meeting } from "@/lib/types"
import { getMeetingsForPerson, getPartnerForMeeting } from "@/lib/meeting-utils"
import { toast } from "sonner"

export default function SummaryByPerson() {
  const [meetings, setMeetings] = useAzureStorage<Meeting[]>("meetings", [])
  const [selectedPerson, setSelectedPerson] = useState<string>("")

  // Get unique participants who have at least one meeting
  const registeredParticipants = Array.from(
    new Set(
      (meetings || []).flatMap((m) => [m.person1, m.person2])
    )
  ).sort()

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCircle size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Riepilogo per Persona</CardTitle>
        </div>
        <CardDescription className="text-base">
          Filtra gli incontri per vedere chi si incontra con chi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Seleziona una persona
          </label>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Scegli una persona" />
            </SelectTrigger>
            <SelectContent>
              {registeredParticipants.map((person) => (
                <SelectItem key={person} value={person} className="text-base">
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPerson && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-foreground">
              Incontri di {selectedPerson}
            </h3>

            {personMeetings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nessun incontro programmato
              </p>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {round1Meetings.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm px-2 py-1">
                          Turno 1
                        </Badge>
                      </div>
                      {round1Meetings.map((meeting) => (
                        <Card key={meeting.id} className="bg-card hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <UsersThree size={24} weight="duotone" className="text-primary flex-shrink-0" />
                              <p className="font-medium text-base md:text-lg flex-1">
                                {getPartnerForMeeting(meeting, selectedPerson)}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMeeting(meeting.id, meeting)}
                                className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash size={20} weight="duotone" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {round2Meetings.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm px-2 py-1">
                          Turno 2
                        </Badge>
                      </div>
                      {round2Meetings.map((meeting) => (
                        <Card key={meeting.id} className="bg-card hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <UsersThree size={24} weight="duotone" className="text-primary flex-shrink-0" />
                              <p className="font-medium text-base md:text-lg flex-1">
                                {getPartnerForMeeting(meeting, selectedPerson)}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMeeting(meeting.id, meeting)}
                                className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash size={20} weight="duotone" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
