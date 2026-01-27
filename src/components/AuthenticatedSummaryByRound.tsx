import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ListChecks } from "@phosphor-icons/react"
import { useEventAttendance } from "@/hooks/useEventAttendance"
import { AuthenticatedMeeting } from "@/lib/types"

export default function AuthenticatedSummaryByRound() {
  const [meetings] = useEventAttendance<AuthenticatedMeeting[]>("meetings", [])

  const round1Meetings = meetings.filter(m => m.round === 1)
  const round2Meetings = meetings.filter(m => m.round === 2)

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks size={24} weight="duotone" className="text-primary" />
          <CardTitle className="text-xl md:text-2xl">Riepilogo per Turno</CardTitle>
        </div>
        <CardDescription className="text-base">
          Tutti gli incontri organizzati per turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">1</Badge>
            <h3 className="text-lg font-semibold">Primo Turno</h3>
            <span className="text-sm text-muted-foreground">({round1Meetings.length} incontri)</span>
          </div>
          {round1Meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm pl-4">Nessun incontro programmato</p>
          ) : (
            <div className="space-y-3 pl-4">
              {round1Meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{meeting.displayName1}</p>
                  </div>
                  <div className="text-muted-foreground">⟷</div>
                  <div className="flex-1">
                    <p className="font-medium">{meeting.displayName2}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">2</Badge>
            <h3 className="text-lg font-semibold">Secondo Turno</h3>
            <span className="text-sm text-muted-foreground">({round2Meetings.length} incontri)</span>
          </div>
          {round2Meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm pl-4">Nessun incontro programmato</p>
          ) : (
            <div className="space-y-3 pl-4">
              {round2Meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{meeting.displayName1}</p>
                  </div>
                  <div className="text-muted-foreground">⟷</div>
                  <div className="flex-1">
                    <p className="font-medium">{meeting.displayName2}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
