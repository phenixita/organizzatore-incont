import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, UserMinus, Users } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useEventAttendance } from "@/hooks/useEventAttendance"
import { EventAttendee, AuthenticatedMeeting } from "@/lib/types"
import { useState } from "react"

export default function EventAttendance() {
  const { user, isAuthenticated } = useAuth()
  const [attendees, setAttendees, isLoadingAttendees] = useEventAttendance<EventAttendee[]>("attendees", [])
  const [meetings, setMeetings, isLoadingMeetings] = useEventAttendance<AuthenticatedMeeting[]>("meetings", [])
  const [displayName, setDisplayName] = useState("")

  const isAttending = user && attendees.some(a => a.userId === user.userId)
  const currentAttendee = user ? attendees.find(a => a.userId === user.userId) : null

  const handleJoinEvent = () => {
    if (!user || !isAuthenticated) {
      toast.error("Devi essere autenticato per partecipare")
      return
    }

    if (!displayName.trim()) {
      toast.error("Inserisci il tuo nome")
      return
    }

    if (isAttending) {
      toast.error("Stai già partecipando all'evento")
      return
    }

    const newAttendee: EventAttendee = {
      userId: user.userId,
      userDetails: user.userDetails,
      displayName: displayName.trim(),
      joinedAt: new Date().toISOString()
    }

    setAttendees(prev => [...prev, newAttendee])
    toast.success(`Benvenuto ${displayName}! Ora sei iscritto all'evento.`)
    setDisplayName("")
  }

  const handleLeaveEvent = () => {
    if (!user || !isAuthenticated) {
      toast.error("Devi essere autenticato")
      return
    }

    if (!isAttending) {
      toast.error("Non stai partecipando all'evento")
      return
    }

    // Remove user from attendees
    setAttendees(prev => prev.filter(a => a.userId !== user.userId))

    // Remove all meetings where this user is involved
    setMeetings(prev => prev.filter(m => m.userId1 !== user.userId && m.userId2 !== user.userId))

    toast.success("Sei stato rimosso dall'evento e tutti i tuoi incontri sono stati cancellati")
  }

  if (isLoadingAttendees || isLoadingMeetings) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Partecipazione all'Evento</CardTitle>
        </div>
        <CardDescription className="text-base">
          {isAttending 
            ? "Stai partecipando all'evento. Puoi programmare incontri o rimuoverti dall'evento." 
            : "Iscriviti all'evento per programmare incontri con altri partecipanti."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAttending ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Il tuo nome
              </label>
              <Input
                placeholder="Inserisci il tuo nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Questo nome sarà visibile agli altri partecipanti
              </p>
            </div>
            <Button 
              onClick={handleJoinEvent} 
              className="w-full h-12 text-base bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={!displayName.trim()}
            >
              <UserPlus size={20} weight="bold" className="mr-2" />
              Iscriviti all'Evento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <Users size={20} weight="fill" className="text-primary" />
                  <span className="font-medium">Benvenuto, {currentAttendee?.displayName}!</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stai partecipando all'evento. Puoi ora programmare incontri con gli altri partecipanti.
                </p>
              </AlertDescription>
            </Alert>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Partecipanti all'evento</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-center mb-2">{attendees.length}</p>
                <p className="text-sm text-center text-muted-foreground">
                  {attendees.length === 1 ? "persona iscritta" : "persone iscritte"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2 text-destructive">Zona Pericolosa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rimuoviti dall'evento. Questa azione cancellerà tutti i tuoi incontri programmati.
              </p>
              <Button 
                onClick={handleLeaveEvent}
                variant="destructive"
                className="w-full h-12 text-base"
              >
                <UserMinus size={20} weight="bold" className="mr-2" />
                Rimuovimi dall'Evento
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
