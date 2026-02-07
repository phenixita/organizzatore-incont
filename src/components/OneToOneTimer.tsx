import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureStorage } from "@/hooks/useAzureStorage"
import { getMeetingsByRound } from "@/lib/meeting-utils"
import { Meeting } from "@/lib/types"
import { ArrowCounterClockwise, Pause, Play, Timer } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_DURATION_MINUTES = 60

export default function OneToOneTimer() {
  const [meetings] = useAzureStorage<Meeting[]>("meetings", [])
  
  // Timer state
  const [durationMinutes, setDurationMinutes] = useState<number>(DEFAULT_DURATION_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_DURATION_MINUTES * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [checklist, setChecklist] = useState({
    scambiatoModuli: false,
    spiegatoClienteIdeale: false,
    decisaAzione: false,
  })
  
  // Meeting selection state
  const [selectedRound, setSelectedRound] = useState<"1" | "2" | "">("")
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("")
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])
  
  const round1Meetings = useMemo(() => getMeetingsByRound(meetings || [], 1), [meetings])
  const round2Meetings = useMemo(() => getMeetingsByRound(meetings || [], 2), [meetings])
  
  const meetingsForRound = useMemo(() => {
    if (selectedRound === "1") return round1Meetings
    if (selectedRound === "2") return round2Meetings
    return []
  }, [selectedRound, round1Meetings, round2Meetings])
  
  const selectedMeeting = useMemo(() => {
    return meetingsForRound.find(m => m.id === selectedMeetingId)
  }, [meetingsForRound, selectedMeetingId])
  
  const totalSeconds = durationMinutes * 60
  const halfTimeSeconds = Math.floor(totalSeconds / 2)
  const elapsedSeconds = totalSeconds - remainingSeconds
  const progress = (elapsedSeconds / totalSeconds) * 100
  
  // Determine current speaker
  const currentSpeaker = selectedMeeting 
    ? (remainingSeconds > halfTimeSeconds ? selectedMeeting.person1 : selectedMeeting.person2)
    : null
  
  const previousSpeakerRef = useRef<string | null>(null)
  
  // Play sound when turn changes
  useEffect(() => {
    if (currentSpeaker && previousSpeakerRef.current && currentSpeaker !== previousSpeakerRef.current) {
      playTurnChangeSound()
    }
    previousSpeakerRef.current = currentSpeaker
  }, [currentSpeaker])
  
  const playTurnChangeSound = () => {
    // Reuse the audio context to avoid creating multiple contexts
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
  
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            playTurnChangeSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])
  
  const handleStart = () => {
    if (!hasStarted) {
      setRemainingSeconds(durationMinutes * 60)
      setHasStarted(true)
    }
    setIsRunning(true)
  }
  
  const handlePause = () => {
    setIsRunning(false)
  }
  
  const handleReset = () => {
    setIsRunning(false)
    setRemainingSeconds(durationMinutes * 60)
    setHasStarted(false)
    previousSpeakerRef.current = null
  }
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!Number.isNaN(value) && value > 0) {
      setDurationMinutes(value)
      if (!hasStarted) {
        setRemainingSeconds(value * 60)
      }
    }
  }
  
  const handleRoundChange = (value: string) => {
    setSelectedRound(value as "1" | "2" | "")
    setSelectedMeetingId("")
  }
  
  const handleMeetingChange = (value: string) => {
    setSelectedMeetingId(value)
  }

  const handleChecklistChange = (key: keyof typeof checklist) => (checked: boolean | "indeterminate") => {
    setChecklist(prev => ({ ...prev, [key]: checked === true }))
  }
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
          <Timer size={32} weight="duotone" className="text-primary" />
          Timer One-to-One
        </CardTitle>
        <CardDescription>
          Gestisci il tempo del tuo incontro con divisione equa tra i due partecipanti
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meeting Selection */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-sm">Seleziona incontro (opzionale)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Turno</label>
              <Select value={selectedRound} onValueChange={handleRoundChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Turno 1</SelectItem>
                  <SelectItem value="2">Turno 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Incontro</label>
              <Select 
                value={selectedMeetingId} 
                onValueChange={handleMeetingChange}
                disabled={!selectedRound || meetingsForRound.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona incontro" />
                </SelectTrigger>
                <SelectContent>
                  {meetingsForRound.map(meeting => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      {meeting.person1} ↔ {meeting.person2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Duration Setting */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Durata incontro (minuti)</label>
          <Input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={handleDurationChange}
            disabled={hasStarted}
            className="w-32"
          />
        </div>
        
        {/* Timer Display */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight">
              {formatTime(remainingSeconds)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {remainingSeconds === 0 ? "Tempo scaduto!" : "Tempo rimanente"}
            </p>
          </div>
          
          {/* Progress Bar with Half-Time Indicator */}
          <div className="space-y-2">
            <div className="relative">
              <Progress value={progress} className="h-4" />
              {/* Half-time marker */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-1 bg-foreground/40"
                style={{ zIndex: 10 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0:00</span>
              <span className="font-semibold">↓ Cambio turno</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>
          
          {/* Current Speaker Indicator */}
          {selectedMeeting && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between gap-4">
                <div className={`flex-1 p-3 rounded-lg transition-all ${
                  currentSpeaker === selectedMeeting.person1 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'bg-muted/50'
                }`}>
                  <p className={`text-xs ${currentSpeaker === selectedMeeting.person1 ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Prima persona</p>
                  <p className="font-bold text-lg">{selectedMeeting.person1}</p>
                  {currentSpeaker === selectedMeeting.person1 && (
                    <Badge className="mt-1 bg-primary-foreground text-primary">In corso</Badge>
                  )}
                </div>
                
                <div className="text-2xl">↔</div>
                
                <div className={`flex-1 p-3 rounded-lg transition-all ${
                  currentSpeaker === selectedMeeting.person2 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'bg-muted/50'
                }`}>
                  <p className={`text-xs ${currentSpeaker === selectedMeeting.person2 ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Seconda persona</p>
                  <p className="font-bold text-lg">{selectedMeeting.person2}</p>
                  {currentSpeaker === selectedMeeting.person2 && (
                    <Badge className="mt-1 bg-primary-foreground text-primary">In corso</Badge>
                  )}
                </div>
              </div>
              
              {currentSpeaker && (
                <div className="text-center pt-2 border-t">
                  <p className="text-sm font-semibold">
                    🎤 Sta parlando: <span className="text-primary">{currentSpeaker}</span>
                  </p>
                </div>
              )}
            </div>
          )}
          
          {!selectedMeeting && hasStarted && (
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Seleziona un incontro per vedere i nomi dei partecipanti
              </p>
            </div>
          )}
        </div>
        
        {/* Timer Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              size="lg"
              className="gap-2"
            >
              <Play size={20} weight="fill" />
              {hasStarted ? "Riprendi" : "Avvia"}
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              <Pause size={20} weight="fill" />
              Pausa
            </Button>
          )}
          
          <Button 
            onClick={handleReset} 
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <ArrowCounterClockwise size={20} />
            Reset
          </Button>
        </div>

        {/* Checklist */}  
        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Checklist one-to-one</h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border border-muted-foreground/20 bg-background p-3 text-sm leading-5">
              <Checkbox
                className="mt-0.5 size-5"
                checked={checklist.scambiatoModuli}
                onCheckedChange={handleChecklistChange("scambiatoModuli")}
              />
              <span>Scambiato i moduli?</span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-muted-foreground/20 bg-background p-3 text-sm leading-5">
              <Checkbox
                className="mt-0.5 size-5"
                checked={checklist.spiegatoClienteIdeale}
                onCheckedChange={handleChecklistChange("spiegatoClienteIdeale")}
              />
              <span>Spiegato il tipo di cliente ideale che si sta cercando?</span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-muted-foreground/20 bg-background p-3 text-sm leading-5">
              <Checkbox
                className="mt-0.5 size-5"
                checked={checklist.decisaAzione}
                onCheckedChange={handleChecklistChange("decisaAzione")}
              />
              <span>Decisa una azione di uscita o da fare per costruire una referenza?</span>
            </label>
          </div>
        </div>
        
        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded">
          <p>💡 <strong>Suggerimento:</strong> Il timer divide automaticamente il tempo in due parti uguali.</p>
          <p>🔔 Un segnale acustico indica il cambio turno tra i due partecipanti.</p>
        </div>
      </CardContent>
    </Card>
  )
}
