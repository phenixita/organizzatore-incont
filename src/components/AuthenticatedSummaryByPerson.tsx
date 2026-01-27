import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserCircle } from "@phosphor-icons/react"
import { useEventAttendance } from "@/hooks/useEventAttendance"
import { EventAttendee, AuthenticatedMeeting } from "@/lib/types"

export default function AuthenticatedSummaryByPerson() {
  const [attendees] = useEventAttendance<EventAttendee[]>("attendees", [])
  const [meetings] = useEventAttendance<AuthenticatedMeeting[]>("meetings", [])
  const [selectedPerson, setSelectedPerson] = useState<string>("")

  const personMeetings = selectedPerson
    ? meetings.filter(m => m.userId1 === selectedPerson || m.userId2 === selectedPerson)
    : []

  const selectedAttendee = attendees.find(a => a.userId === selectedPerson)

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCircle size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Riepilogo per Persona</CardTitle>
        </div>
        <CardDescription className="text-base">
          Visualizza gli incontri di un partecipante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Seleziona una persona
          </label>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Seleziona una persona" />
            </SelectTrigger>
            <SelectContent>
              {attendees.map((attendee) => (
                <SelectItem key={attendee.userId} value={attendee.userId} className="text-base">
                  {attendee.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPerson && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{selectedAttendee?.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                {personMeetings.length === 0 
                  ? "Nessun incontro programmato" 
                  : `${personMeetings.length} ${personMeetings.length === 1 ? "incontro programmato" : "incontri programmati"}`}
              </p>
            </div>

            {personMeetings.length > 0 && (
              <div className="space-y-3">
                {personMeetings.map((meeting) => {
                  const isUser1 = meeting.userId1 === selectedPerson
                  const partnerName = isUser1 ? meeting.displayName2 : meeting.displayName1
                  
                  return (
                    <div key={meeting.id} className="p-4 rounded-lg bg-card border hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-base">
                            Turno {meeting.round}
                          </Badge>
                          <span className="font-medium">con {partnerName}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!selectedPerson && (
          <div className="text-center py-8 text-muted-foreground">
            Seleziona una persona per visualizzare i suoi incontri
          </div>
        )}
      </CardContent>
    </Card>
  )
}
