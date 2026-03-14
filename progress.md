## Fri Mar 13 23:13:56 PDT 2026 - Add light mode and system preference support
- Implemented light mode theme and system preference adaptation.
- Refactored all UI components to use CSS variables for theming.
- Added theme switcher to the Toolbar.
- Files changed: 18 files (App.tsx, Canvas.tsx, Toolbar.tsx, etc.)
- **Learnings for future iterations:**
  - Standardized theming using CSS variables makes it easy to support multiple modes.
  - Using Tailwind's 'class' dark mode with CSS variables provides a robust foundation for both utility-based and custom-styled components.
---
