**Your Optimized Prompt:**
Implement LaTeX support using KaTeX for both message history and live input.

1.  **Dependencies**:
    - `remark-math`: Markdown plugin for math delimiters.
    - `rehype-katex`: Rehype plugin to render math using KaTeX.
    - `katex`: The core rendering library and CSS.

2.  **Rendering History (`src/components/ChatDialog/MessageList.tsx`)**:
    - Import `remarkMath`, `rehypeKatex`, and `katex/dist/katex.min.css`.
    - Configure `ReactMarkdown` to use these plugins.
    - Ensure both completed messages and the `streamingContent` are processed.

3.  **Live Preview (`src/components/ChatDialog/ChatDialog.tsx`)**:
    - Introduce a `Live Preview` section just above the input textarea.
    - This section should render the current `input` state using the same `ReactMarkdown` + KaTeX configuration used in `MessageList`.
    - Only display the preview when `input` is not empty.
    - Apply styling to differentiate the preview area (e.g., subtle background, italic hint).

**Key Improvements:**
• Enables complex mathematical notation in conversations.
• Provides immediate visual feedback for LaTeX as the user types, reducing errors.
• Maintains visual consistency across user drafts and assistant replies.

**Techniques Applied:** Plugin-based Markdown expansion, real-time preview patterns.
