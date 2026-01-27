import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { useAuth } from "@/hooks/useAuth"
import { CalendarDot } from "@phosphor-icons/react"
import EventAttendance from "./components/EventAttendance"
import AddAuthenticatedMeeting from "./components/AddAuthenticatedMeeting"
import AuthenticatedSummaryByRound from "./components/AuthenticatedSummaryByRound"
import AuthenticatedSummaryByPerson from "./components/AuthenticatedSummaryByPerson"

function App() {
  const [eventTitle] = useAzureStorage<string>("event-title", "Incontri 1-a-1")
  const [eventDescription] = useAzureStorage<string>("event-description", "Organizza i tuoi incontri in due turni")
  const [eventDate] = useAzureStorage<string>("event-date", "")
  const { user, isLoading } = useAuth()
  const buildCommit = (import.meta.env.VITE_BUILD_COMMIT || import.meta.env.VITE_GIT_COMMIT || "").trim()
  const shortCommit = buildCommit ? buildCommit.slice(0, 7) : "dev"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CalendarDot size={48} weight="duotone" className="text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8 flex-1">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CalendarDot size={40} weight="duotone" className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {eventTitle}
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            {eventDescription}
          </p>
          {eventDate && (
            <p className="text-accent font-medium text-sm md:text-base mt-2">
              📅 {eventDate}
            </p>
          )}
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              👤 {user.userDetails}
            </p>
          )}
        </header>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="attendance" className="text-xs md:text-base">
              Partecipazione
            </TabsTrigger>
            <TabsTrigger value="add" className="text-xs md:text-base">
              Nuovo Incontro
            </TabsTrigger>
            <TabsTrigger value="by-round" className="text-xs md:text-base">
              Per Turno
            </TabsTrigger>
            <TabsTrigger value="by-person" className="text-xs md:text-base">
              Per Persona
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-0">
            <EventAttendance />
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <AddAuthenticatedMeeting />
          </TabsContent>

          <TabsContent value="by-round" className="mt-0">
            <AuthenticatedSummaryByRound />
          </TabsContent>

          <TabsContent value="by-person" className="mt-0">
            <AuthenticatedSummaryByPerson />
          </TabsContent>
        </Tabs>
      </div>
      <footer className="py-3 text-center text-xs text-muted-foreground">
        Build: {shortCommit}
      </footer>
    </div>
  )
}

export default App