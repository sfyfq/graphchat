feature: add Latex support to both user message (auto render as typing) and assistant message.
- Use KaTeX for high-performance LaTeX rendering.
- Integrate `remark-math` and `rehype-katex` with `react-markdown`.
- Implement a "Live Preview" in the ChatDialog that renders the user's input as they type.
- Ensure assistant replies (including streaming) render LaTeX correctly.
--- Wed Mar 11 10:00:00 PDT 2026 ---
