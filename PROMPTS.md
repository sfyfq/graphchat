# Bugfix: Correct Streaming Text Decoding in Worker

## Objective
Fix the Cloudflare Worker's stream processing to ensure that text chunks sent to the frontend are properly decoded and unescaped, preserving Markdown formatting.

## Implementation Details (`worker/index.ts`)
- Refactor the streaming logic to handle the Gemini NDJSON (Newline Delimited JSON) format more robustly.
- Instead of using a regex on the raw chunk, accumulate characters and attempt to identify complete JSON objects in the stream.
- Use `JSON.parse()` on the `candidates[0].content.parts[0].text` field to ensure all escaped characters (like newlines and quotes) are correctly converted to their actual character representations before being written to the output stream.
