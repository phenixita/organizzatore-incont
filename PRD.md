# Planning Guide

An application to organize 1-on-1 meetings across two rounds for a group of 32 people, designed for users with minimal technical experience who need to self-coordinate their meetings.

**Experience Qualities**:
1. **Effortless** - Every action should be obvious and require minimal clicks, using dropdowns instead of typing
2. **Clear** - Large, readable text and unambiguous labeling makes it immediately obvious what each screen does
3. **Reassuring** - Visual confirmation of saved meetings and helpful filtering gives users confidence in the system

**Complexity Level**: Light Application (multiple features with basic state)
This is a straightforward scheduling tool with dropdown-based input, persistent storage, and filtering views. It manages meeting pairs across two rounds with validation logic but doesn't require complex multi-view navigation or advanced workflows.

## Essential Features

### Meeting Declaration
- **Functionality**: Users select themselves, choose a round (1 or 2), and select a meeting partner from available people
- **Purpose**: Allows users to record their 1-on-1 meetings while preventing duplicate or impossible pairings
- **Trigger**: Main action on the home screen
- **Progression**: Select your name from dropdown → Choose round (1 or 2) → Select partner from filtered dropdown (excludes already scheduled) → Confirm → See success message
- **Success criteria**: Meeting is saved, both participants are marked as paired for that round, dropdown options update to reflect unavailability

### Smart Filtering
- **Functionality**: Dropdown menus automatically exclude people who are already scheduled with you in the selected round
- **Purpose**: Prevents scheduling conflicts and duplicate meetings
- **Trigger**: Selecting your name and round automatically filters the partner dropdown
- **Progression**: User selects name → User selects round → Partner dropdown shows only available people (not yet paired with user in that round)
- **Success criteria**: Users cannot select invalid pairings; dropdowns only show legitimate options

### Round Summary View
- **Functionality**: Display all scheduled meetings organized by round (Round 1 and Round 2)
- **Purpose**: Provides overview of all meetings for coordination and verification
- **Trigger**: Navigate to "Summary by Round" tab/view
- **Progression**: Click Round Summary → See two sections (Round 1, Round 2) → Each shows list of meeting pairs
- **Success criteria**: All meetings are displayed grouped by round, showing both participant names clearly

### Person Lookup View
- **Functionality**: Filter meetings by individual person to see all their scheduled meetings
- **Purpose**: Quickly answers "who is X meeting with?" for coordination purposes
- **Trigger**: Navigate to "Summary by Person" tab/view
- **Progression**: Click Person Summary → Select person from dropdown → See list of their meetings with round numbers
- **Success criteria**: Displays all meetings for selected person across both rounds

## Edge Case Handling

- **Empty State**: When no meetings are scheduled, show friendly message encouraging users to add their first meeting
- **All Partners Scheduled**: If a person has met with everyone available in a round, show clear message that no more meetings can be added for that round
- **Duplicate Prevention**: System automatically prevents recording the same pairing twice in the same round
- **Bidirectional Recording**: When Person A schedules with Person B, both are marked as paired (the relationship is symmetric)

## Design Direction

The design should feel approachable, organized, and trustworthy - like a well-maintained paper schedule board but digital. It should evoke feelings of clarity, control, and simplicity. Think of a clean community center bulletin board with clear sections and readable handwriting, translated to a modern interface.

## Color Selection

A warm, professional palette that feels human and approachable rather than corporate or technical.

- **Primary Color**: Deep teal `oklch(0.45 0.09 210)` - conveys trust and organization without feeling cold or corporate
- **Secondary Colors**: Soft warm gray `oklch(0.92 0.01 60)` for backgrounds - creates gentle contrast and warmth; Medium slate `oklch(0.35 0.04 240)` for secondary text
- **Accent Color**: Amber orange `oklch(0.65 0.15 65)` - warm, friendly highlight for CTAs and important actions that feels encouraging
- **Foreground/Background Pairings**:
  - Primary (Deep Teal): White text `oklch(1 0 0)` - Ratio 7.2:1 ✓
  - Accent (Amber Orange): White text `oklch(1 0 0)` - Ratio 5.1:1 ✓
  - Background (Soft Warm Gray): Dark slate text `oklch(0.25 0.02 240)` - Ratio 11.8:1 ✓
  - Card (White): Primary teal text - Ratio 7.2:1 ✓

## Font Selection

Typography should feel friendly, modern, and highly readable - prioritizing clarity for users who may be less comfortable with screens.

- **Typographic Hierarchy**:
  - H1 (Screen Title): Outfit Bold/32px/tight letter spacing - distinctive and clear
  - H2 (Section Headers): Outfit Semibold/24px/normal letter spacing
  - H3 (Card Titles): Outfit Medium/18px/normal letter spacing
  - Body (Instructions/Labels): Inter Regular/16px/relaxed line height (1.6) - exceptional readability
  - Meeting Pairs: Inter Medium/18px/relaxed - emphasis on the actual data
  - Small (Helper Text): Inter Regular/14px/normal

## Animations

Animations should provide clear feedback and guide attention without adding unnecessary delay or distraction. Subtle transitions reassure users that their actions are registered, while gentle list animations help the eye track changes in the meeting roster. Hover states on interactive elements provide clear affordance, and success confirmations use a brief, satisfying scale animation to acknowledge completion.

## Component Selection

- **Components**:
  - Select (Shadcn): Used for all dropdown menus (person selection, round selection, partner selection) - provides consistent, accessible selection experience
  - Card (Shadcn): Contains the meeting declaration form and displays meeting summaries - with subtle shadow for depth
  - Tabs (Shadcn): Navigation between "Add Meeting", "Summary by Round", and "Summary by Person" views
  - Badge (Shadcn): Display round numbers (Round 1, Round 2) with distinct colors
  - Button (Shadcn): Primary CTA for "Schedule Meeting" - using accent color variant
  - Separator (Shadcn): Divides round sections in summary view
  - ScrollArea (Shadcn): For long lists of meetings in summary views

- **Customizations**:
  - Large touch-friendly dropdowns with 48px minimum height for easy mobile interaction
  - Custom empty state illustrations using simple iconography (Phosphor icons)
  - Meeting pair cards with subtle hover effect and clear visual hierarchy

- **States**:
  - Buttons: Resting (accent color), Hover (slightly darker/scaled), Active (pressed effect), Disabled (muted with reduced opacity)
  - Select dropdowns: Resting (border visible), Focus (accent ring), Open (expanded with subtle shadow)
  - Cards: Resting (subtle shadow), Hover (elevated shadow for interactive cards)

- **Icon Selection**:
  - CalendarDot: Main app icon and meeting representation
  - Users: Person/people-related actions
  - ListChecks: Summary/overview views
  - UserCircle: Person selection and lookup
  - Plus: Add new meeting action
  - Funnel: Filter/search functionality

- **Spacing**:
  - Container padding: p-6 on desktop, p-4 on mobile
  - Card internal spacing: p-6
  - Form field gaps: gap-4 for related fields, gap-6 between sections
  - List item spacing: gap-3 for meeting pairs
  - Section margins: mb-8 between major sections

- **Mobile**:
  - Single column layout with full-width cards
  - Tabs convert to full-width stacked navigation
  - Dropdowns expand to near-full screen for easier selection
  - Meeting pairs stack vertically with clear visual separation
  - Bottom-fixed action button for "Schedule Meeting" on mobile form view
