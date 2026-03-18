## Fri Mar 13 23:13:56 PDT 2026 - Add light mode and system preference support
- Implemented light mode theme and system preference adaptation.
- Refactored all UI components to use CSS variables for theming.
- Added theme switcher to the Toolbar.
- Files changed: 18 files (App.tsx, Canvas.tsx, Toolbar.tsx, etc.)
- **Learnings for future iterations:**
  - Standardized theming using CSS variables makes it easy to support multiple modes.
  - Using Tailwind's 'class' dark mode with CSS variables provides a robust foundation for both utility-based and custom-styled components.
---
## Tue Mar 17 16:16:00 PDT 2026 - Fix invisible connection lines in light mode
- Fixed visibility of connection lines (edges) between nodes in light mode.
- Introduced CSS variables `--edge-color-default` and `--edge-color-active` for theme-dependent edge styling.
- Updated `branchColor` to use these variables for unlabeled commits.
- Updated `EdgePath` and `ChatDialog` to use the active edge color variable for consistency.
- Files changed: src/index.css, src/lib/utils.ts, src/components/Canvas/EdgePath.tsx, src/components/ChatDialog/ChatDialog.tsx
- **Learnings for future iterations:**
  - Hardcoded RGBA colors with low alpha can become invisible on light backgrounds.
  - Always prefer CSS variables for colors that need to adapt to different themes.
---
## Tue Mar 17 17:15:00 PDT 2026 - Implement LLM thinking effort abstraction
- Introduced `ThinkingMode` abstraction ('fast', 'balanced', 'deep', 'auto').
- Implemented `getThinkingConfig` bridge to map abstract modes to model-specific API parameters (Gemini 3.x and 2.5).
- Updated `GeminiProvider`, `MockProvider`, and `ProxyProvider` to support thinking effort control.
- Added persistent `thinkingMode` to `configStore`.
- Added "Deep Think" toggle to `ChatDialog` header.
- Files changed: src/lib/llm/types.ts, src/lib/llm/utils.ts, src/lib/llm/gemini.ts, src/lib/llm/MockProvider.ts, src/lib/llm/ProxyProvider.ts, src/store/configStore.ts, src/components/ChatDialog/ChatDialog.tsx
- **Learnings for future iterations:**
  - Decoupling user intent (ThinkingMode) from API specifics (ThinkingConfig) allows for easier model swapping and future intelligent routing.
  - Gemini 3.1 Flash-Lite defaults to minimal thinking; explicit "high" level is needed for deep reasoning.
---
## Wed Mar 18 16:00:00 PDT 2026 - Improve Auth persistence and error handling
- Implemented **Silent Refresh** using Google "One Tap" login (`useGoogleOneTapLogin`) with `auto_select: true`.
- Refactored `Toolbar` to proactively renew tokens when they are within 5 minutes of expiry.
- Fixed **Random Logout** bug in `ProxyProvider.handleError` by implementing precise status code and regex-based error detection.
- Prevented false-positive logouts caused by "401" appearing in non-auth error messages.
- Files changed: src/components/Toolbar/Toolbar.tsx, src/lib/llm/ProxyProvider.ts
- **Learnings for future iterations:**
  - `useGoogleOneTapLogin` with `auto_select: true` is the modern GIS way to achieve session persistence across reloads in SPAs.
  - String-based error detection (like `.includes('401')`) is dangerous and should always be replaced by status code checks or strict regex boundaries.
---
