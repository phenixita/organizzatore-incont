import { useState, useEffect } from "react"
import { useKVNoFallback } from "@/hooks/use-kv-no-fallback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyDollar, LockKey, CheckCircle, XCircle, Wallet } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PARTICIPANTS, PaymentStatus } from "@/lib/types"

export default function PaymentTracker() {
  const [treasurerPassword] = useKVNoFallback<string>("treasurer-password", "")
  const [paymentAmount] = useKVNoFallback<number>("payment-amount", 0)
  const [payments, setPayments] = useKVNoFallback<PaymentStatus[]>("payments", [])
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!payments || payments.length === 0) {
      const initialPayments = PARTICIPANTS.map((person) => ({
        person,
        hasPaid: false
      }))
      setPayments(initialPayments)
    }
  }, [])

  const handleLogin = () => {
    if (!treasurerPassword) {
      toast.error("Password non configurata. Impostala nella sezione Data con chiave 'treasurer-password'")
      return
    }
    
    if (password === treasurerPassword) {
      setIsAuthenticated(true)
      toast.success("Accesso autorizzato")
    } else {
      toast.error("Password errata")
      setPassword("")
    }
  }

  const handleTogglePayment = (person: string) => {
    setPayments((current) => {
      const updated = (current || []).map((p) => {
        if (p.person === person) {
          return {
            ...p,
            hasPaid: !p.hasPaid,
            paidAt: !p.hasPaid ? new Date().toISOString() : undefined
          }
        }
        return p
      })
      return updated
    })
    
    const payment = (payments || []).find(p => p.person === person)
    if (payment?.hasPaid) {
      toast.success(`${person} rimosso dai pagamenti`)
    } else {
      toast.success(`${person} segnato come pagato`)
    }
  }

  const filteredPayments = (payments || []).filter((p) =>
    p.person.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paidCount = (payments || []).filter((p) => p.hasPaid).length
  const unpaidCount = PARTICIPANTS.length - paidCount
  const totalCollected = paidCount * (paymentAmount || 0)

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-2 border-accent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet size={28} weight="duotone" className="text-accent" />
              <CardTitle className="text-2xl md:text-3xl">Totale Raccolto</CardTitle>
            </div>
            <CardDescription className="text-base">
              Riepilogo delle somme raccolte per l'evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Quota per Persona</p>
                    <p className="text-xs text-muted-foreground">Importo fisso stabilito</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    €{(paymentAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border-2 border-accent/20">
                <p className="text-muted-foreground text-lg mb-2">Totale Raccolto</p>
                <p className="text-5xl md:text-6xl font-bold text-accent">
                  €{totalCollected.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ({paidCount} {paidCount === 1 ? "persona" : "persone"} × €{(paymentAmount || 0).toFixed(2)})
                </p>
                <div className="flex gap-4 mt-6">
                  <Badge variant="default" className="text-base px-4 py-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle size={18} className="mr-1" />
                    Pagati: {paidCount}
                  </Badge>
                  <Badge variant="destructive" className="text-base px-4 py-2">
                    <XCircle size={18} className="mr-1" />
                    Non Pagati: {unpaidCount}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LockKey size={24} weight="duotone" className="text-primary" />
              <CardTitle className="text-xl md:text-2xl">Segretario Tesoriere</CardTitle>
            </div>
            <CardDescription className="text-base">
              Inserisci la password per accedere al pannello pagamenti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Inserisci la password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 text-base"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full h-12 text-base"
            >
              <LockKey size={20} weight="bold" className="mr-2" />
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollar size={24} weight="duotone" className="text-primary" />
            <CardTitle className="text-xl md:text-2xl">Gestione Pagamenti</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAuthenticated(false)
              setPassword("")
            }}
          >
            Esci
          </Button>
        </div>
        <CardDescription className="text-base">
          Traccia chi ha pagato per l'evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Quota Fissa</p>
              <p className="text-xs text-muted-foreground">Configurata nella sezione Data con chiave "payment-amount"</p>
            </div>
            <p className="text-2xl font-bold text-primary">
              €{(paymentAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border-2 border-accent/20">
          <div className="flex flex-col items-center">
            <p className="text-muted-foreground text-lg mb-2">Totale Raccolto</p>
            <p className="text-5xl md:text-6xl font-bold text-accent">
              €{totalCollected.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Badge variant="default" className="text-base px-4 py-2 bg-green-600 hover:bg-green-700">
            <CheckCircle size={18} className="mr-1" />
            Pagati: {paidCount}
          </Badge>
          <Badge variant="destructive" className="text-base px-4 py-2">
            <XCircle size={18} className="mr-1" />
            Non Pagati: {unpaidCount}
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Cerca persona
          </label>
          <Input
            placeholder="Cerca per nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {filteredPayments.map((payment) => (
              <Card
                key={payment.person}
                className={`transition-all ${
                  payment.hasPaid
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : "bg-red-50 border-red-200 hover:bg-red-100"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={payment.person}
                      checked={payment.hasPaid}
                      onCheckedChange={() => handleTogglePayment(payment.person)}
                      className="h-6 w-6 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor={payment.person}
                          className="font-medium text-base md:text-lg cursor-pointer"
                        >
                          {payment.person}
                        </label>
                        {payment.hasPaid ? (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle size={16} className="mr-1" />
                            Pagato
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle size={16} className="mr-1" />
                            Non Pagato
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">Quota:</span>
                        <span className="text-base font-semibold text-accent">
                          €{(paymentAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {payment.hasPaid && payment.paidAt && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Pagato il: {new Date(payment.paidAt).toLocaleDateString("it-IT")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
