# TODO: Fix Assistant Message Formatting

- [x] **Bugfix: Robust Stream Parsing in Worker**
    - [x] Modify `worker/index.ts`.
    - [x] Replace the simplified regex parser with a robust JSON object extractor.
    - [x] Ensure `JSON.parse` is used to unescape text content.
    - [x] Verify that newlines and Markdown syntax are preserved in the frontend.
