import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useConversationStore } from "../../store/conversationStore";
import { useConfigStore } from "../../store/configStore";
import { llm, reconstructMessages, estimateTokens } from "../../lib/llm";
import { makeSummary, branchColor, getMathAtCursor } from "../../lib/utils";
import { MessageList, MarkdownComponents } from "./MessageList";
import type { Commit } from "../../types";

import 'katex/dist/katex.min.css'

interface Props {
  commit: Commit;
  initialPosition: { x: number; y: number };
  initialInput?: string;
  onClose: () => void;
  onFocus?: () => void;
}

const SAFE_TOP = 80;

export const ChatDialog: React.FC<Props> = ({
  commit,
  initialPosition,
  initialInput = "",
  onClose,
  onFocus,
}) => {
  const { sessions, currentSessionId, addTurn } = useConversationStore();
  const { apiKey, setApiKey, setShowKeyModal } = useConfigStore();
  const commits = sessions[currentSessionId]?.commits || {};

  const [pos, setPos] = useState(initialPosition);
  const [input, setInput] = useState(initialInput);
  const [activeMath, setActiveMath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [tipId, setTipId] = useState(
    commit.role === "user" && commit.parentId ? commit.parentId : commit.id
  );
  const dragging = useRef<{ startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);

  // ── Vertical Growth Centering & Initial Safety Clamp ─────────────────────
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newHeight = entry.contentRect.height;
      const oldHeight = prevHeightRef.current;

      if (!dragging.current) {
        if (oldHeight > 0 && Math.abs(newHeight - oldHeight) > 1) {
          // Standard case: growing/shrinking from content changes
          const delta = newHeight - oldHeight;
          setPos((prev) => {
            const newY = prev.y - delta / 2;
            const safeY = Math.max(SAFE_TOP, Math.min(window.innerHeight - newHeight - 10, newY));
            return { ...prev, y: safeY };
          });
        } else if (oldHeight === 0) {
          // Initial measurement case: ensure it's on screen if it started big
          setPos((prev) => {
            const isOffBottom = prev.y + newHeight > window.innerHeight - 10;
            const isOffTop = prev.y < SAFE_TOP;
            if (isOffBottom || isOffTop) {
              const safeY = Math.max(SAFE_TOP, Math.min(window.innerHeight - newHeight - 10, prev.y));
              return { ...prev, y: safeY };
            }
            return prev;
          });
        }
      }
      prevHeightRef.current = newHeight;
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync input if initialInput changes (e.g. user clicks another draft node while dialog open)
  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      }, 0);
    }
  }, [initialInput]);

  // Messages for this branch (from root to this commit)
  const messages = useMemo(() => {
    const chain: Commit[] = [];
    let cur: Commit | undefined = commits[tipId];
    while (cur) {
      if (cur.content) chain.unshift(cur);
      cur = cur.parentId ? commits[cur.parentId] : undefined;
    }
    return chain;
  }, [commits, tipId]);

  const tokenCount = useMemo(() => {
    const conv = reconstructMessages(commits, tipId);
    return estimateTokens(conv);
  }, [commits, tipId]);

  const bColor = branchColor(commit.branchLabel);

  // Focus textarea on open
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const onHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onFocus?.();
      dragging.current = {
        startX: e.clientX - pos.x,
        startY: e.clientY - pos.y,
      };
    },
    [pos, onFocus],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newX = e.clientX - dragging.current.startX;
      const newY = e.clientY - dragging.current.startY;
      
      const width = 860;
      const height = containerRef.current?.offsetHeight ?? 400;

      setPos({
        x: Math.max(0, Math.min(window.innerWidth - (width + 10), newX)),
        y: Math.max(0, Math.min(window.innerHeight - (height + 10), newY)),
      });
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Close with data loss check ───────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (input.trim().length > 0) {
      if (!window.confirm("You have unsent changes. Close anyway?")) {
        return;
      }
    }
    onClose();
  }, [input, onClose]);

  // ── Send (Transactional & Streaming) ──────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setInput("");
    setActiveMath(null);
    setError(null);
    setLoading(true);
    setStreamingContent("");

    try {
      const conv = reconstructMessages(commits, tipId);
      let fullAssistantContent = "";
      
      // Use the new llm provider interface
      for await (const chunk of llm.streamMessage(conv, text)) {
        fullAssistantContent += chunk;
        setStreamingContent(fullAssistantContent);
      }

      // Success: commit the whole turn atomically
      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      const userCommit: Commit = {
        id: userId,
        parentId: tipId,
        role: "user",
        content: text,
        summary: makeSummary(text),
        timestamp: Date.now(),
        model: "",
      };

      const assistantCommit: Commit = {
        id: assistantId,
        parentId: userId,
        role: "assistant",
        content: fullAssistantContent,
        summary: makeSummary(fullAssistantContent),
        timestamp: Date.now(),
        model: "gemini-3.1-flash-lite", // Branding update
      };

      addTurn(userCommit, assistantCommit);
      setTipId(assistantId);
      setStreamingContent("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "API error";
      
      // Detect API Key issues
      const isKeyError = msg.includes("MISSING_API_KEY") || 
                         msg.includes("API_KEY_INVALID") || 
                         msg.includes("403") || 
                         msg.includes("401");

      if (isKeyError) {
        setApiKey(null); // Clear the invalid key
        setShowKeyModal(true);
        setError("Invalid or missing API key. Please provide a new one.");
      } else {
        setError(msg);
      }
      
      // Restore input on failure
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [input, loading, commits, addTurn, tipId, apiKey, setShowKeyModal, setApiKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const checkMath = useCallback((text: string, pos: number) => {
    setActiveMath(getMathAtCursor(text, pos));
  }, []);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    checkMath(val, e.target.selectionStart);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    checkMath(input, e.currentTarget.selectionStart);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    checkMath(input, e.currentTarget.selectionStart);
  };

  const canSend = (input.trim().length > 0 || streamingContent) && !loading;

  return (
    <div
      ref={containerRef}
      className="no-pan"
      onMouseDown={onFocus}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 860,
        maxHeight: "min(85vh, 900px)",
        background: "rgba(11,11,17,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        boxShadow:
          "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        backdropFilter: "blur(24px)",
        animation: "dialog-in 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* ── Header ── */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          padding: "13px 16px 11px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          cursor: "grab",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Branch color dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: bColor,
            boxShadow: `0 0 8px ${bColor}88`,
            flexShrink: 0,
          }}
        />

        {/* Branch label */}
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {commit.branchLabel || "thread"}
        </span>

        {/* Commit hash */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
          }}
        >
          #{tipId.slice(0, 7)}
        </span>

        <div style={{ flex: 1 }} />

        {/* Token count */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color:
              tokenCount > 6000
                ? "rgba(251,146,60,0.8)"
                : "rgba(255,255,255,0.25)",
          }}
        >
          ~{tokenCount.toLocaleString()} tok
        </span>

        {/* Turn count */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            marginLeft: 6,
          }}
        >
          {messages.length} turns
        </span>

        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            padding: "0 0 0 10px",
            transition: "color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.35)";
          }}
        >
          ×
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          minHeight: 0,
        }}
      >
        <MessageList 
          messages={messages} 
          loading={loading} 
          streamingContent={streamingContent}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            margin: "0 14px",
            padding: "8px 12px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#fca5a5",
            flexShrink: 0,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* ── Input ── */}
      <div
        style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
          position: 'relative'
        }}
      >
        {/* Math Overlay Preview */}
        {activeMath && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: 14,
            right: 14,
            padding: '12px 16px',
            background: 'rgba(15,15,25,0.95)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 1100,
            backdropFilter: 'blur(12px)',
            animation: 'dialog-in 0.15s ease-out'
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              color: 'rgba(99,102,241,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>LaTeX Preview</span>
              <span style={{ opacity: 0.5 }}>Rendering...</span>
            </div>
            <div style={{
              color: '#fff',
              fontSize: 15,
              lineHeight: 1.5,
              display: 'flex',
              justifyContent: 'center',
              minHeight: 24
            }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
              >
                {activeMath}
              </ReactMarkdown>
            </div>
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              bottom: -6,
              left: 30,
              width: 12,
              height: 12,
              background: 'rgba(15,15,25,0.95)',
              borderRight: '1px solid rgba(99,102,241,0.3)',
              borderBottom: '1px solid rgba(99,102,241,0.3)',
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
            placeholder="Continue this thread…"
            rows={1}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13.5,
              padding: "9px 12px",
              resize: "none",
              lineHeight: 1.55,
              outline: "none",
              transition: "border-color 0.15s",
              minHeight: 38,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(99,102,241,0.55)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              // Small delay to allow clicking preview if needed, or just close
              setTimeout(() => setActiveMath(null), 150);
            }}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: canSend
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "rgba(255,255,255,0.07)",
              color: canSend ? "#fff" : "rgba(255,255,255,0.25)",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            ↑
          </button>
        </div>

        <div
          style={{
            marginTop: 6,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.18)",
          }}
        >
          ↵ send · ⇧↵ newline
        </div>
      </div>
    </div>
  );
};
