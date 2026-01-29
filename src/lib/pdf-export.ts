import { jsPDF } from "jspdf"
import { Meeting } from "./types"
import { getMeetingsByRound } from "./meeting-utils"

export interface ExportPDFOptions {
  eventTitle: string
  eventDescription: string
  eventDate: string
  meetings: Meeting[]
}

export function exportToPDF(options: ExportPDFOptions): void {
  const { eventTitle, eventDescription, eventDate, meetings } = options
  
  // Create new PDF document in portrait mode
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  // Set font
  doc.setFont("helvetica")

  // Title
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text(eventTitle, 105, 20, { align: "center" })

  // Description
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(eventDescription, 105, 30, { align: "center" })

  // Date
  if (eventDate) {
    doc.setFontSize(11)
    doc.text(`Data: ${eventDate}`, 105, 38, { align: "center" })
  }

  // Line separator
  doc.setLineWidth(0.5)
  doc.line(20, 45, 190, 45)

  let yPosition = 55

  // Round 1
  const round1Meetings = getMeetingsByRound(meetings, 1)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Turno 1", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`${round1Meetings.length} ${round1Meetings.length === 1 ? "incontro" : "incontri"}`, 20, yPosition)
  yPosition += 8

  if (round1Meetings.length === 0) {
    doc.setFont("helvetica", "italic")
    doc.text("Nessun incontro programmato", 20, yPosition)
    yPosition += 10
  } else {
    doc.setFont("helvetica", "normal")
    round1Meetings.forEach((meeting, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(`${index + 1}. ${meeting.person1} con ${meeting.person2}`, 20, yPosition)
      yPosition += 6
    })
    yPosition += 5
  }

  // Round 2
  // Check if we need a new page before Round 2
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Turno 2", 20, yPosition)
  yPosition += 8

  const round2Meetings = getMeetingsByRound(meetings, 2)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`${round2Meetings.length} ${round2Meetings.length === 1 ? "incontro" : "incontri"}`, 20, yPosition)
  yPosition += 8

  if (round2Meetings.length === 0) {
    doc.setFont("helvetica", "italic")
    doc.text("Nessun incontro programmato", 20, yPosition)
  } else {
    doc.setFont("helvetica", "normal")
    round2Meetings.forEach((meeting, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(`${index + 1}. ${meeting.person1} con ${meeting.person2}`, 20, yPosition)
      yPosition += 6
    })
  }

  // Add footer with generation date
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Generato il ${new Date().toLocaleDateString("it-IT")} - Pagina ${i} di ${totalPages}`,
      105,
      287,
      { align: "center" }
    )
  }

  // Generate filename with current date
  const filename = `${eventTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  
  // Save the PDF
  doc.save(filename)
}
