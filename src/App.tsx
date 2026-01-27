import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDot } from "@phosphor-icons/react"
import AddMeeting from "./components/AddMeeting"
import SummaryByRound from "./components/SummaryByRound"
import SummaryByPerson from "./components/SummaryByPerson"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CalendarDot size={40} weight="duotone" className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Incontri 1-a-1
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Organizza i tuoi incontri in due turni
          </p>
        </header>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="add" className="text-sm md:text-base">
              Nuovo Incontro
            </TabsTrigger>
            <TabsTrigger value="by-round" className="text-sm md:text-base">
              Per Turno
            </TabsTrigger>
            <TabsTrigger value="by-person" className="text-sm md:text-base">
              Per Persona
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
        </Tabs>
      </div>
    </div>
  )
}

export default App