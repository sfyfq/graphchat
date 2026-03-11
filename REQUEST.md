# Request: Fix Assistant Message Formatting

Assistant messages received via the Cloudflare Worker proxy are not being formatted correctly (Markdown is broken).

## Requirements:
- **Robust Stream Parsing:** Refactor the Worker's stream processing to correctly decode Gemini's NDJSON output.
- **Unescape Content:** Ensure that JSON-escaped characters (like `\n`) are properly unescaped before being sent to the frontend.
- **Preserve Markdown:** Verify that the resulting text preserves all Markdown syntax for the frontend renderer.
