import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BestPractices121() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Best practice 121</CardTitle>
        <CardDescription>
          Vademecum in 7 punti per incontri efficaci, chiari e orientati all'azione.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm md:text-base">
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <p className="font-medium">Pianifica e fai volume (subito)</p>
            <p className="text-muted-foreground">
              Fissa un 121 con tutti i membri del capitolo il prima possibile per
              accelerare relazione e comprensione reciproca.
            </p>
          </li>
          <li>
            <p className="font-medium">Struttura + relazione (non solo chiacchiera)</p>
            <p className="text-muted-foreground">
              Alterna una parte strutturata e una parte social: le sovrapposizioni tra
              interessi personali e professionali aumentano la fiducia.
            </p>
          </li>
          <li>
            <p className="font-medium">Giver before Gain: se inviti tu, l'altro è il focus</p>
            <p className="text-muted-foreground">
              Quando chiedi tu il 121, l'obiettivo è capire come aiutare l'altra
              persona, non venderti subito.
            </p>
          </li>
          <li>
            <p className="font-medium">Usa GAINS come canovaccio (prima e durante)</p>
            <p className="text-muted-foreground">
              Compila e invia il profilo GAINS (Goals, Accomplishments, Interests,
              Networks, Skills) e usalo per guidare domande e conversazione.
            </p>
          </li>
          <li>
            <p className="font-medium">Domande per attivare referenze specifiche</p>
            <p className="text-muted-foreground">
              Chiarisci target clienti, casi tipici, segnali d'acquisto, aree
              geografiche e come presentarti.
            </p>
          </li>
          <li>
            <p className="font-medium">Appunti e scambio: ascolto attivo, esempi concreti</p>
            <p className="text-muted-foreground">
              Alterna domande e racconti, ascolta davvero e porta 1-2 esempi concreti
              per farti ricordare bene.
            </p>
          </li>
          <li>
            <p className="font-medium">Chiudi con piano d'azione e follow-up</p>
            <p className="text-muted-foreground">
              Concordate un'azione concreta (introduzione, invio contatto, invito a
              evento, secondo 121) con tempi e prossimo passo.
            </p>
          </li>
        </ol>
        <div className="space-y-2 pt-2 border-t">
          <p className="font-medium">Fonti</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>
              <a
                href="https://www.successnet.it/7-consigli-per-un-one-to-one-efficace/"
                className="text-primary underline-offset-4 hover:underline"
              >
                successnet.it - 7 consigli per un one-to-one efficace
              </a>
            </li>
            <li>
              <a
                href="https://www.bni.com/the-latest/blog-news/7-ways-to-get-the-most-out-of-your-one-to-ones/"
                className="text-primary underline-offset-4 hover:underline"
              >
                bni.com - 7 ways to get the most out of your one-to-ones
              </a>
            </li>
            <li>
              <a
                href="https://www.enzomastrolonardo.it/121-one-to-one/"
                className="text-primary underline-offset-4 hover:underline"
              >
                enzomastrolonardo.it - 121 one-to-one
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Nota: testo generato da AI e potrebbe contenere errori.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
