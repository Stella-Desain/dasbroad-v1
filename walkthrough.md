# Walkthrough - Style Update: Google Material Design

## Overview
I have restyled the application to match the **Google Calendar** aesthetic using Material Design 3 principles.

## Changes
### 1. **Global CSS (`src/index.css`)**
- Updated Color Palette to Google's specific shades (Blue `#4285F4`, Red `#EA4335`, Green `#34A853`, Yellow `#FBBC04`).
- Changed Font to `Google Sans`, `Roboto`, `Inter`.
- Increased Border Radius (`12px` - `1rem`) for buttons and cards.
- Introduced proper Light/Dark mode variables matching Google Material.

### 2. **Layout Architecture**
- **Header (`Header.tsx`)**:
  - Moved out of the content flow to be `fixed top-0 w-full`.
  - Added "Hamburger" menu on the left.
  - Added "Vibe Calendar" branding in Product Sans style.
  - Added centered "Search" bar with rounded gray background.
  - Added Profile and Apps Grid icons on the right.
- **Sidebar (`Sidebar.tsx`)**:
  - Moved below the header (`top-[64px]`).
  - Added **Floating Action Button (FAB)** "Create" with shadow and rounded corners.
  - Added nice Mini-Calendar using Shadcn UI Calendar component.
  - Styled navigation items as "Pills" on the right side (rounded-r-full).
- **App Layout (`AppLayout.tsx`)**:
  - adjusted padding to accommodate the fixed header and sidebar.

## Verification
- **Visuals**: The dashboard should now look cleaner, more spacious, and use the friendly rounded aesthetic of Google apps.
- **Responsiveness**: The Sidebar collapses to a rail on smaller screens or toggle.
