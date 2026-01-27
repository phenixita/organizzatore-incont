import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useEventAttendance } from "@/hooks/useEventAttendance"
import { EventAttendee, AuthenticatedMeeting } from "@/lib/types"

function getAvailablePartners(
  currentUserId: string, 
  round: 1 | 2, 
  meetings: AuthenticatedMeeting[], 
  attendees: EventAttendee[]
): EventAttendee[] {
  // Get users who already have a meeting in this round
  const usersInRound = new Set<string>()
  meetings.forEach(meeting => {
    if (meeting.round === round) {
      usersInRound.add(meeting.userId1)
      usersInRound.add(meeting.userId2)
    }
  })

  // Return attendees who are not the current user and don't have a meeting in this round
  return attendees.filter(attendee => 
    attendee.userId !== currentUserId && 
    !usersInRound.has(attendee.userId)
  )
}

function userHasMeetingInRound(userId: string, round: 1 | 2, meetings: AuthenticatedMeeting[]): boolean {
  return meetings.some(
    meeting => meeting.round === round && 
    (meeting.userId1 === userId || meeting.userId2 === userId)
  )
}

export default function AddAuthenticatedMeeting() {
  const { user, isAuthenticated } = useAuth()
  const [attendees] = useEventAttendance<EventAttendee[]>("attendees", [])
  const [meetings, setMeetings] = useEventAttendance<AuthenticatedMeeting[]>("meetings", [])
  const [selectedRound, setSelectedRound] = useState<"1" | "2" | "">("")
  const [selectedPartner, setSelectedPartner] = useState<string>("")

  const currentAttendee = user && attendees.find(a => a.userId === user.userId)
  const isAttending = !!currentAttendee

  const availablePartners = user && selectedRound
    ? getAvailablePartners(user.userId, parseInt(selectedRound) as 1 | 2, meetings, attendees)
    : []

  const currentUserHasMeeting = user && selectedRound
    ? userHasMeetingInRound(user.userId, parseInt(selectedRound) as 1 | 2, meetings)
    : false

  const handleSubmit = () => {
    if (!user || !isAuthenticated) {
      toast.error("Devi essere autenticato")
      return
    }

    if (!isAttending) {
      toast.error("Devi prima iscriverti all'evento")
      return
    }

    if (!selectedRound || !selectedPartner) {
      toast.error("Seleziona turno e persona")
      return
    }

    const round = parseInt(selectedRound) as 1 | 2

    if (userHasMeetingInRound(user.userId, round, meetings)) {
      toast.error("Hai già un incontro programmato per questo turno")
      return
    }

    const partner = attendees.find(a => a.userId === selectedPartner)
    if (!partner) {
      toast.error("Partecipante non trovato")
      return
    }

    const newMeeting: AuthenticatedMeeting = {
      id: `${Date.now()}-${Math.random()}`,
      userId1: user.userId,
      userId2: partner.userId,
      displayName1: currentAttendee?.displayName || user.userDetails,
      displayName2: partner.displayName,
      round,
      createdAt: new Date().toISOString()
    }

    setMeetings((current) => [...current, newMeeting])
    
    toast.success(`Incontro programmato: ${currentAttendee?.displayName} con ${partner.displayName}`)
    
    setSelectedRound("")
    setSelectedPartner("")
  }

  if (!isAuthenticated) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Devi essere autenticato per accedere a questa funzione.</p>
        </CardContent>
      </Card>
    )
  }

  if (!isAttending) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Users size={48} weight="duotone" className="mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Non stai partecipando all'evento</p>
              <p className="text-sm text-muted-foreground mt-2">
                Vai alla scheda "Partecipazione" per iscriverti all'evento e programmare incontri.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Programma un nuovo incontro</CardTitle>
        </div>
        <CardDescription className="text-base">
          Sei: <strong>{currentAttendee?.displayName}</strong>. Seleziona il turno e con chi vuoi incontrarti.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Quale turno?
          </label>
          <Select value={selectedRound} onValueChange={(val) => setSelectedRound(val as "1" | "2")}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Seleziona il turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-base">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">1</Badge>
                  Primo Turno
                </div>
              </SelectItem>
              <SelectItem value="2" className="text-base">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2</Badge>
                  Secondo Turno
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Con chi ti vuoi incontrare?
          </label>
          <Select 
            value={selectedPartner} 
            onValueChange={setSelectedPartner}
            disabled={!selectedRound || currentUserHasMeeting}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={
                !selectedRound 
                  ? "Prima seleziona il turno" 
                  : currentUserHasMeeting
                    ? "Hai già un incontro in questo turno"
                    : availablePartners.length === 0
                      ? "Nessuno disponibile"
                      : "Seleziona la persona"
              } />
            </SelectTrigger>
            <SelectContent>
              {availablePartners.map((attendee) => (
                <SelectItem key={attendee.userId} value={attendee.userId} className="text-base">
                  {attendee.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRound && currentUserHasMeeting && (
            <p className="text-sm text-destructive font-medium">
              Hai già programmato un incontro per questo turno. Una persona può partecipare a un solo incontro per turno.
            </p>
          )}
          {selectedRound && !currentUserHasMeeting && availablePartners.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Tutte le persone disponibili hanno già un incontro programmato per questo turno
            </p>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full h-12 text-base bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={!selectedRound || !selectedPartner}
        >
          <Plus size={20} weight="bold" className="mr-2" />
          Programma Incontro
        </Button>
      </CardContent>
    </Card>
  )
}
