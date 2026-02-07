import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { CalendarDot } from "@phosphor-icons/react"
import AddMeeting from "./components/AddMeeting"
import AvailabilitySummary from "./components/AvailabilitySummary"
import BestPractices121 from "./components/BestPractices121"
import OneToOneTimer from "./components/OneToOneTimer"
import ParticipantsList from "./components/ParticipantsList"
import SummaryByPerson from "./components/SummaryByPerson"
import SummaryByRound from "./components/SummaryByRound"

function App() {
  const [eventTitle] = useAzureStorage<string>("event-title", "Incontri 1-a-1")
  const [eventDescription] = useAzureStorage<string>("event-description", "Organizza i tuoi incontri in due turni")
  const [eventDate] = useAzureStorage<string>("event-date", "")
  const buildCommit = (import.meta.env.VITE_BUILD_COMMIT || import.meta.env.VITE_GIT_COMMIT || "").trim()
  const shortCommit = buildCommit ? buildCommit.slice(0, 7) : "dev"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8 flex-1">
        <header className="mb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CalendarDot size={28} weight="duotone" className="text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {eventTitle}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {eventDescription}
          </p>
          {eventDate && (
            <p className="text-accent font-medium text-xs sm:text-sm mt-1">
              📅 {eventDate}
            </p>
          )}
        </header>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
            <TabsTrigger value="add" className="text-xs md:text-base">
              Nuovo Incontro
            </TabsTrigger>
            <TabsTrigger value="availability" className="text-xs md:text-base">
              Disponibilita
            </TabsTrigger>
            <TabsTrigger value="by-round" className="text-xs md:text-base">
              Per Turno
            </TabsTrigger>
            <TabsTrigger value="by-person" className="text-xs md:text-base">
              Per Persona
            </TabsTrigger>
            <TabsTrigger value="timer" className="text-xs md:text-base">
              Timer 121
            </TabsTrigger>
            <TabsTrigger
              value="best-practices"
              className="text-xs md:text-base border-accent/40 bg-accent/10 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              I 7 segreti 121
            </TabsTrigger>
            <TabsTrigger value="participants" className="text-xs md:text-base">
              Partecipanti
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-0">
            <AddMeeting />
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <AvailabilitySummary />
          </TabsContent>

          <TabsContent value="by-round" className="mt-0">
            <SummaryByRound />
          </TabsContent>

          <TabsContent value="by-person" className="mt-0">
            <SummaryByPerson />
          </TabsContent>

          <TabsContent value="timer" className="mt-0">
            <OneToOneTimer />
          </TabsContent>

          <TabsContent value="best-practices" className="mt-0">
            <BestPractices121 />
          </TabsContent>

          <TabsContent value="participants" className="mt-0">
            <ParticipantsList />
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Domande frequenti</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="whatsapp">
                <AccordionTrigger className="text-sm sm:text-base">
                  L'app e integrata con WhatsApp e i relativi sondaggi?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  No, l'app non e integrata con WhatsApp e con i sondaggi di WhatsApp.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="organizzazione">
                <AccordionTrigger className="text-sm sm:text-base">
                  Come organizzo gli incontri?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Gli incontri vanno organizzati fuori dall'app e poi registrati qui dentro. Basta che lo faccia uno dei due.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="suggerimenti">
                <AccordionTrigger className="text-sm sm:text-base">
                  Posso inviare suggerimenti?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Certo, ogni suggerimento e ben accetto.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="programma">
                <AccordionTrigger className="text-sm sm:text-base">
                  Perche potrei trovare errori o cose da migliorare?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Stai partecipando a un programma sperimentale: errori e cose da migliorare sono normali. Ogni feedback e prezioso!
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
      <footer className="py-3 text-center text-xs text-muted-foreground">
        Build: {shortCommit}
      </footer>
    </div>
  )
}

export default App
