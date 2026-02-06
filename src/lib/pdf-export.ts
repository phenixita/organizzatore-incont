import { jsPDF } from "jspdf"
import { Meeting } from "./types"
import { getMeetingsByRound } from "./meeting-utils"

export interface ExportPDFOptions {
  eventTitle: string
  eventDescription: string
  eventDate: string
  meetings: Meeting[]
}

// Page layout constants
const PAGE_BREAK_THRESHOLD_MEETING = 270
const PAGE_BREAK_THRESHOLD_SECTION = 250
const FOOTER_Y_POSITION = 287
const MAX_TEXT_WIDTH = 170

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filename characters
  return filename
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 200) // Limit length
}

/**
 * Render meetings for a specific round
 */
function renderRoundMeetings(
  doc: jsPDF,
  meetings: Meeting[],
  startYPosition: number
): number {
  let yPosition = startYPosition
  
  meetings.forEach((meeting, index) => {
    // Check if we need a new page
    if (yPosition > PAGE_BREAK_THRESHOLD_MEETING) {
      doc.addPage()
      yPosition = 20
    }

    // Use splitTextToSize to handle long names
    const meetingText = `${index + 1}. ${meeting.person1} con ${meeting.person2}`
    const lines = doc.splitTextToSize(meetingText, MAX_TEXT_WIDTH)
    
    lines.forEach((line: string) => {
      doc.text(line, 20, yPosition)
      yPosition += 6
    })
  })
  
  return yPosition
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
  const titleLines = doc.splitTextToSize(eventTitle, MAX_TEXT_WIDTH)
  titleLines.forEach((line: string, idx: number) => {
    doc.text(line, 105, 20 + (idx * 8), { align: "center" })
  })
  const titleHeight = titleLines.length * 8

  // Description
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  const descLines = doc.splitTextToSize(eventDescription, MAX_TEXT_WIDTH)
  descLines.forEach((line: string, idx: number) => {
    doc.text(line, 105, 20 + titleHeight + (idx * 6), { align: "center" })
  })
  const descHeight = descLines.length * 6

  // Date
  let dateHeight = 0
  if (eventDate) {
    doc.setFontSize(11)
    doc.text(`Data: ${eventDate}`, 105, 20 + titleHeight + descHeight + 2, { align: "center" })
    dateHeight = 8
  }

  // Line separator
  const separatorY = 20 + titleHeight + descHeight + dateHeight + 5
  doc.setLineWidth(0.5)
  doc.line(20, separatorY, 190, separatorY)

  let yPosition = separatorY + 10

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
    yPosition = renderRoundMeetings(doc, round1Meetings, yPosition)
    yPosition += 5
  }

  // Round 2
  // Check if we need a new page before Round 2
  if (yPosition > PAGE_BREAK_THRESHOLD_SECTION) {
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
    renderRoundMeetings(doc, round2Meetings, yPosition)
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
      FOOTER_Y_POSITION,
      { align: "center" }
    )
  }

  // Generate filename with current date
  const sanitizedTitle = sanitizeFilename(eventTitle)
  const filename = `${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.pdf`
  
  // Save the PDF
  doc.save(filename)
}
