# Architecture SOP: Frontend Development

## Goal
To build a premium, responsive, and interactive dashboard using React, Vite, and Shadcn UI.

## Technology Stack
- **Framework**: React + Vite
- **Styling**: Tailwind CSS (Vanilla CSS for custom animations/overrides)
- **UI Store**: Radix UI / Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query) + Supabase Client

## Component Rules
1. **Atomic Design**: Components should be small, focused, and reusable.
2. **Prop Drilling**: Avoid deep prop drilling. Use Zustand for global state.
3. **Type Safety**: strict TypeScript interfaces for all props and state.
4. **Styling**:
   - Use Tailwind utility classes for layout and spacing.
   - Use `index.css` for complex animations or global themes.
   - **Aesthetics**: Ensure vibrant colors, glassmorphism effects, and smooth transitions.

## Data Flow
1. **Input**: User interaction or Supabase Realtime event.
2. **Processing**: Zustand store update or React Query mutation.
3. **Output**: UI re-render.

## Edge Cases
- **Loading States**: Always show skeletons or spinners during data fetch.
- **Error States**: Display toast notifications or error boundaries for failures.
- **Empty States**: Show helpful messages and actions when no data is present.
