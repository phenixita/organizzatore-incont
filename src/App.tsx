import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDot } from "@phosphor-icons/react"
import { useKVNoFallback } from "@/hooks/use-kv-no-fallback"
import AddMeeting from "./components/AddMeeting"
import SummaryByRound from "./components/SummaryByRound"
import SummaryByPerson from "./components/SummaryByPerson"
import PaymentTracker from "./components/PaymentTracker"

function App() {
  const [eventTitle] = useKVNoFallback<string>("event-title", "Incontri 1-a-1")
  const [eventDescription] = useKVNoFallback<string>("event-description", "Organizza i tuoi incontri in due turni")
  const [eventDate] = useKVNoFallback<string>("event-date", "")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
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
        </header>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="add" className="text-xs md:text-base">
              Nuovo Incontro
            </TabsTrigger>
            <TabsTrigger value="by-round" className="text-xs md:text-base">
              Per Turno
            </TabsTrigger>
            <TabsTrigger value="by-person" className="text-xs md:text-base">
              Per Persona
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-base">
              Pagamenti
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-0">
            <AddMeeting />
          </TabsContent>

          <TabsContent value="by-round" className="mt-0">
            <SummaryByRound />
          </TabsContent>

          <TabsContent value="by-person" className="mt-0">
            <SummaryByPerson />
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <PaymentTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App