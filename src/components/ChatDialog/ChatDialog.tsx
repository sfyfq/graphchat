import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useConversationStore } from "../../store/conversationStore";
import { reconstructMessages, estimateTokens } from "../../lib/context";
import { sendMessage } from "../../lib/anthropic";
import { makeSummary, branchColor } from "../../lib/utils";
import { MessageList } from "./MessageList";
import type { Commit } from "../../types";

interface Props {
  commit: Commit;
  initialPosition: { x: number; y: number };
  onClose: () => void;
  onFocus?: () => void;
}

export const ChatDialog: React.FC<Props> = ({
  commit,
  initialPosition,
  onClose,
  onFocus,
}) => {
  const { commits, addCommit, setHEAD } = useConversationStore();

  const [pos, setPos] = useState(initialPosition);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipId, setTipId] = useState(commit.id);
  const dragging = useRef<{ startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const tokenCount = useMemo(
    () => estimateTokens(reconstructMessages(commits, commit.id)),
    [commits, tipId],
  );

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
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 440, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, newY)),
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

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    // Create user commit as child of this dialog's commit
    const userId = crypto.randomUUID();
    const userCommit: Commit = {
      id: userId,
      parentId: tipId,
      role: "user",
      content: text,
      summary: makeSummary(text),
      timestamp: Date.now(),
      model: "",
    };
    addCommit(userCommit);
    // Don't setHEAD to user node — turns end with assistant
    setTipId(userId);

    try {
      // Pass the updated commits (with new user commit) for context
      const updatedCommits = { ...commits, [userId]: userCommit };
      const responseText = await sendMessage(updatedCommits, userId, text);

      const assistantId = crypto.randomUUID();
      const assistantCommit: Commit = {
        id: assistantId,
        parentId: userId,
        role: "assistant",
        content: responseText,
        summary: makeSummary(responseText),
        timestamp: Date.now(),
        model: "claude-sonnet-4-20250514",
      };
      addCommit(assistantCommit);
      setHEAD(assistantId);
      setTipId(assistantId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "API error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, commits, addCommit, setHEAD, tipId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div
      className="no-pan"
      onMouseDown={onFocus}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 430,
        maxHeight: 560,
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
        <MessageList messages={messages} loading={loading} />
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
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
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
