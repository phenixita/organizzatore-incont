import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getMeetingsByRound } from "@/lib/meeting-utils"
import { exportToPDF } from "@/lib/pdf-export"
import { Meeting } from "@/lib/types"
import { FilePdf, ListChecks, Trash } from "@phosphor-icons/react"
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

  const RoundTable = ({ round, meetings: roundMeetings }: { round: 1 | 2; meetings: Meeting[] }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={round === 1 ? "default" : "secondary"}>
          Turno {round}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {roundMeetings.length} {roundMeetings.length === 1 ? "incontro" : "incontri"}
        </span>
      </div>

      {roundMeetings.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">
          Nessun incontro programmato
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Persona 1</TableHead>
              <TableHead>Persona 2</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roundMeetings.map((meeting, idx) => (
              <TableRow key={meeting.id}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">{meeting.person1}</TableCell>
                <TableCell className="font-medium">{meeting.person2}</TableCell>
                <TableCell className="text-right p-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteMeeting(meeting.id, meeting.person1, meeting.person2)}
                  >
                    <Trash size={14} weight="bold" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks size={24} weight="duotone" className="text-primary" />
            <CardTitle className="text-xl md:text-2xl">Riepilogo per Turno</CardTitle>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={(meetings || []).length === 0}
            size="sm"
            className="flex items-center gap-2"
          >
            <FilePdf size={18} weight="duotone" />
            <span className="hidden sm:inline">Esporta PDF</span>
          </Button>
        </div>
        <CardDescription>
          Tutti gli incontri organizzati per turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RoundTable round={1} meetings={round1Meetings} />
        <RoundTable round={2} meetings={round2Meetings} />
      </CardContent>
    </Card>
  )
}
