import { useState } from "react"
import { useKV } from "@github/spark/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Meeting, PARTICIPANTS } from "@/lib/types"
import { getAvailablePartners, meetingExists, personHasMeetingInRound } from "@/lib/meeting-utils"

export default function AddMeeting() {
  const [meetings, setMeetings] = useKV<Meeting[]>("meetings", [])
  const [selectedPerson, setSelectedPerson] = useState<string>("")
  const [selectedRound, setSelectedRound] = useState<"1" | "2" | "">("")
  const [selectedPartner, setSelectedPartner] = useState<string>("")

  const availablePartners = selectedPerson && selectedRound
    ? getAvailablePartners(selectedPerson, parseInt(selectedRound) as 1 | 2, meetings || [], PARTICIPANTS)
    : []

  const currentPersonHasMeeting = selectedPerson && selectedRound
    ? personHasMeetingInRound(selectedPerson, parseInt(selectedRound) as 1 | 2, meetings || [])
    : false

  const handleSubmit = () => {
    if (!selectedPerson || !selectedRound || !selectedPartner) {
      toast.error("Compila tutti i campi")
      return
    }

    const round = parseInt(selectedRound) as 1 | 2

    if (personHasMeetingInRound(selectedPerson, round, meetings || [])) {
      toast.error("Hai già un incontro programmato per questo turno")
      return
    }

    if (meetingExists(meetings || [], selectedPerson, selectedPartner, round)) {
      toast.error("Questo incontro è già stato programmato")
      return
    }

    const newMeeting: Meeting = {
      id: `${Date.now()}-${Math.random()}`,
      person1: selectedPerson,
      person2: selectedPartner,
      round,
      createdAt: new Date().toISOString()
    }

    setMeetings((current) => [...(current || []), newMeeting])
    
    toast.success(`Incontro programmato: ${selectedPerson} con ${selectedPartner}`)
    
    setSelectedPerson("")
    setSelectedRound("")
    setSelectedPartner("")
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Programma un nuovo incontro</CardTitle>
        </div>
        <CardDescription className="text-base">
          Seleziona chi sei, il turno e con chi vuoi incontrarti
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Chi sei?
          </label>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Seleziona il tuo nome" />
            </SelectTrigger>
            <SelectContent>
              {PARTICIPANTS.map((person) => (
                <SelectItem key={person} value={person} className="text-base">
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            disabled={!selectedPerson || !selectedRound || currentPersonHasMeeting}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={
                !selectedPerson || !selectedRound 
                  ? "Prima seleziona nome e turno" 
                  : currentPersonHasMeeting
                    ? "Hai già un incontro in questo turno"
                    : availablePartners.length === 0
                      ? "Nessuno disponibile"
                      : "Seleziona la persona"
              } />
            </SelectTrigger>
            <SelectContent>
              {availablePartners.map((person) => (
                <SelectItem key={person} value={person} className="text-base">
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPerson && selectedRound && currentPersonHasMeeting && (
            <p className="text-sm text-destructive font-medium">
              Hai già programmato un incontro per questo turno. Una persona può partecipare a un solo incontro per turno.
            </p>
          )}
          {selectedPerson && selectedRound && !currentPersonHasMeeting && availablePartners.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Tutte le persone disponibili hanno già un incontro programmato per questo turno
            </p>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full h-12 text-base bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={!selectedPerson || !selectedRound || !selectedPartner}
        >
          <Plus size={20} weight="bold" className="mr-2" />
          Programma Incontro
        </Button>
      </CardContent>
    </Card>
  )
}
