import { useAzureStorage } from "@/hooks/useAzureStorage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ListChecks, UsersThree, Trash, FilePdf } from "@phosphor-icons/react"
import { Meeting } from "@/lib/types"
import { getMeetingsByRound } from "@/lib/meeting-utils"
import { exportToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

export default function SummaryByRound() {
  const [meetings, setMeetings] = useAzureStorage<Meeting[]>("meetings", [])
  const [eventTitle] = useAzureStorage<string>("event-title", "Incontri 1-a-1")
  const [eventDescription] = useAzureStorage<string>("event-description", "Organizza i tuoi incontri in due turni")
  const [eventDate] = useAzureStorage<string>("event-date", "")

  const round1Meetings = getMeetingsByRound(meetings || [], 1)
  const round2Meetings = getMeetingsByRound(meetings || [], 2)

  const handleDeleteMeeting = (meetingId: string, person1: string, person2: string) => {
    setMeetings((current) => (current || []).filter((m) => m.id !== meetingId))
    toast.success(`Incontro rimosso: ${person1} con ${person2}`)
  }

  const handleExportPDF = () => {
    try {
      exportToPDF({
        eventTitle,
        eventDescription,
        eventDate,
        meetings: meetings || []
      })
      toast.success("PDF esportato con successo!")
    } catch (error) {
      toast.error("Errore durante l'esportazione del PDF")
      console.error("PDF export error:", error)
    }
  }

  const RoundSection = ({ round, meetings }: { round: 1 | 2; meetings: Meeting[] }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={round === 1 ? "default" : "secondary"} className="text-base px-3 py-1">
          Turno {round}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {meetings.length} {meetings.length === 1 ? "incontro" : "incontri"}
        </span>
      </div>
      
      {meetings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nessun incontro programmato per questo turno
        </p>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="bg-card hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UsersThree size={24} weight="duotone" className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base md:text-lg leading-tight">
                        {meeting.person1}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        con
                      </p>
                      <p className="font-medium text-base md:text-lg leading-tight">
                        {meeting.person2}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMeeting(meeting.id, meeting.person1, meeting.person2)}
                      className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash size={20} weight="duotone" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks size={24} weight="duotone" className="text-primary" />
            <CardTitle className="text-xl md:text-2xl">Riepilogo per Turno</CardTitle>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={(meetings || []).length === 0}
            className="flex items-center gap-2"
          >
            <FilePdf size={20} weight="duotone" />
            <span className="hidden sm:inline">Esporta PDF</span>
          </Button>
        </div>
        <CardDescription className="text-base">
          Visualizza tutti gli incontri organizzati per turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoundSection round={1} meetings={round1Meetings} />
        
        <Separator className="my-6" />
        
        <RoundSection round={2} meetings={round2Meetings} />
      </CardContent>
    </Card>
  )
}
