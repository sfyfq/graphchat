import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useConversationStore } from "../../store/conversationStore";
import { useConfigStore } from "../../store/configStore";
import { useAuthStore, getStorageScope } from "../../store/authStore";
import { llm, reconstructMessages, estimateTokens } from "../../lib/llm";
import { makeSummary, branchColor, getMathAtCursor } from "../../lib/utils";
import { getBlobUrl } from "../../lib/storage";
import { MessageList, MarkdownComponents } from "./MessageList";
import type { Commit, DialogState, Attachment } from "../../types";

import "katex/dist/katex.min.css";

interface Props {
  commit: Commit;
  initialPosition: { x: number; y: number };
  initialInput?: string;
  onClose: () => void;
  onMinimize?: (
    originalId: string,
    state: DialogState & { color: string; summary: string },
  ) => void;
  onFocus?: () => void;
}

const SAFE_TOP = 80;
const VISIBLE_MARGIN = 60;

// ── Helper Component for Pending Thumbnails ──
const PendingThumbnail: React.FC<{
  attachment: Attachment;
  onRemove: (id: string) => void;
}> = ({ attachment, onRemove }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const scope = getStorageScope();
    getBlobUrl(scope, attachment.id).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment.id]);

  const isImage = attachment.type.startsWith("image/");
  const icon = attachment.type.startsWith("audio/")
    ? "🎵"
    : attachment.type.startsWith("video/")
      ? "🎬"
      : "📄";

  return (
    <div
      style={{
        position: "relative",
        width: 50,
        height: 50,
        borderRadius: 8,
        background: "var(--bg-input)",
        border: "1px solid var(--border-primary)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {isImage && url ? (
        <img
          src={url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt=""
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      )}
      <button
        onClick={() => onRemove(attachment.id)}
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.6)",
          border: "none",
          color: "#fff",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
};

export const ChatDialog: React.FC<Props> = ({
  commit,
  initialPosition,
  initialInput = "",
  onClose,
  onMinimize,
  onFocus,
}) => {
  const { sessions, currentSessionId, addTurn, library, uploadAttachment } =
    useConversationStore();
  const { apiKey, setApiKey, setShowKeyModal, thinkingMode, setThinkingMode } = useConfigStore();
  const commits = sessions[currentSessionId]?.commits || {};

  const [pos, setPos] = useState(initialPosition);
  const [input, setInput] = useState(initialInput);
  const [activeMath, setActiveMath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingUserContent, setPendingUserContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>(
    [],
  );
  const [explainResult, setExplainResult] = useState<{
    prompt: string;
    response: string;
    loading: boolean;
    y: number;
  } | null>(null);

  const [tipId, setTipId] = useState(
    commit.role === "user" && commit.parentId ? commit.parentId : commit.id,
  );
  const dragging = useRef<{ startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);

  const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

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
            // Relaxed clamping: ensure header is somewhat visible
            const safeY = Math.max(
              10,
              Math.min(window.innerHeight - VISIBLE_MARGIN, newY),
            );
            return { ...prev, y: safeY };
          });
        } else if (oldHeight === 0) {
          // Initial measurement case: ensure it's on screen if it started big
          setPos((prev) => {
            const isOffBottom = prev.y + newHeight > window.innerHeight - 10;
            const isOffTop = prev.y < SAFE_TOP;
            if (isOffBottom || isOffTop) {
              const safeY = Math.max(
                SAFE_TOP,
                Math.min(window.innerHeight - newHeight - 10, prev.y),
              );
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
    // Note: for the UI count, we'll use a rough sync estimate.
    const chars = messages.reduce((acc, m) => acc + m.content.length, 0);
    return Math.ceil((chars + input.length) / 4);
  }, [messages, input]);

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

      // Allow dragging off-screen but keep VISIBLE_MARGIN on screen
      setPos({
        x: Math.max(
          VISIBLE_MARGIN - width,
          Math.min(window.innerWidth - VISIBLE_MARGIN, newX),
        ),
        y: Math.max(0, Math.min(window.innerHeight - VISIBLE_MARGIN, newY)),
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
    if (input.trim().length > 0 || pendingAttachmentIds.length > 0) {
      if (!window.confirm("You have unsent changes. Close anyway?")) {
        return;
      }
    }
    onClose();
  }, [input, pendingAttachmentIds, onClose]);

  const handleMinimize = useCallback(() => {
    if (!onMinimize) return;

    // Summary logic: use current input if present, otherwise last message content
    const currentInput = input.trim();
    const lastMsgContent = messages[messages.length - 1]?.content || "";
    const summary = currentInput || makeSummary(lastMsgContent) || "Empty chat";

    onMinimize(commit.id, {
      commitId: tipId,
      x: pos.x,
      y: pos.y,
      initialInput: input,
      color: bColor,
      summary: summary,
    });
  }, [onMinimize, commit.id, tipId, pos, input, messages, bColor]);

  // ── File Selection ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > FILE_SIZE_LIMIT) {
      setError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 10MB.`,
      );
      e.target.value = "";
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const id = await uploadAttachment(file);
      setPendingAttachmentIds((prev) => [...prev, id]);
    } catch (err) {
      setError("Failed to upload attachment.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachmentIds((prev) => prev.filter((aId) => aId !== id));
  };

  // ── Send (Transactional & Streaming) ──────────────────────────────────────
  const handleSend = useCallback(
    async (
      overrideContent?: string,
      overrideTipId?: string,
      branchLabel?: string,
    ) => {
      const text =
        overrideContent !== undefined ? overrideContent : input.trim();
      const targetTipId = overrideTipId || tipId;

      if ((!text && pendingAttachmentIds.length === 0) || loading) return;

      if (overrideContent === undefined) {
        setInput("");
      }
      const currentAttachments =
        overrideContent !== undefined ? [] : [...pendingAttachmentIds];
      if (overrideContent === undefined) {
        setPendingAttachmentIds([]);
      }

      setPendingUserContent(text);
      setActiveMath(null);
      setError(null);
      setLoading(true);
      setStreamingContent("");

      try {
        const conv = await reconstructMessages(commits, targetTipId);
        let fullAssistantContent = "";

        // Use the new llm provider interface
        for await (const chunk of llm.streamMessage(
          conv,
          text,
          currentAttachments,
          thinkingMode,
        )) {
          fullAssistantContent += chunk;
          setStreamingContent(fullAssistantContent);
        }

        // Success: commit the whole turn atomically
        const userId = crypto.randomUUID();
        const assistantId = crypto.randomUUID();

        const userCommit: Commit = {
          id: userId,
          parentId: targetTipId,
          role: "user",
          content: text,
          summary: makeSummary(text),
          timestamp: Date.now(),
          model: "",
          attachmentIds: currentAttachments,
          branchLabel: branchLabel,
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
        setPendingUserContent("");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "API error";

        // Detect API Key issues - only if we are using the local GeminiProvider directly
        // In proxy mode, the Worker handles the key.
        const isKeyError =
          msg.includes("MISSING_API_KEY") ||
          msg.includes("API_KEY_INVALID") ||
          msg.includes("403") ||
          msg.includes("401") ||
          msg.includes("UNAUTHORIZED_EMAIL") ||
          msg.includes("AUTH_EXPIRED");

        if (isKeyError) {
          setError("Access denied or session expired. Please sign in again.");
        } else if (msg === "PAYLOAD_TOO_LARGE") {
          setError(
            "Message too large. Please reduce the size of your text or attachments.",
          );
        } else {
          setError(msg);
        }

        // Restore input on failure
        if (overrideContent === undefined) {
          setInput(text);
          setPendingAttachmentIds(currentAttachments);
        }
        setPendingUserContent("");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, commits, addTurn, tipId, pendingAttachmentIds, thinkingMode],
  );

  const handleExplain = useCallback(
    async (text: string, overrideTipId: string, y: number) => {
      const prompt = `Briefly explain this: "${text}"`;
      setExplainResult({ prompt, response: "", loading: true, y });

      try {
        const conv = await reconstructMessages(commits, overrideTipId);
        let fullAssistantContent = "";

        for await (const chunk of llm.streamMessage(conv, prompt, [], thinkingMode)) {
          fullAssistantContent += chunk;
          setExplainResult((prev) =>
            prev ? { ...prev, response: fullAssistantContent, y } : null,
          );
        }
        setExplainResult((prev) =>
          prev ? { ...prev, loading: false, y } : null,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "API error during explanation",
        );
        setExplainResult(null);
      }
    },
    [commits, thinkingMode],
  );

  const handleSelectionAction = useCallback(
    (type: "explain" | "ask", text: string, messageId: string, y: number) => {
      if (type === "explain") {
        handleExplain(text, messageId, y);
      } else if (type === "ask") {
        setInput(`Regarding "${text}": `);
        setTimeout(() => {
          textareaRef.current?.focus();
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd =
                textareaRef.current.value.length;
          }
        }, 0);
      }
    },
    [handleExplain],
  );

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
    e.target.style.height = `${Math.min(textareaRef.current?.scrollHeight || 0, 120)}px`;
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    checkMath(input, e.currentTarget.selectionStart);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    checkMath(input, e.currentTarget.selectionStart);
  };

  const canSend =
    (input.trim().length > 0 ||
      pendingAttachmentIds.length > 0 ||
      streamingContent) &&
    !loading;

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
        background: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: 16,
        boxShadow: "var(--shadow-main)",
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
          borderBottom: "1px solid var(--border-secondary)",
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
            color: "var(--text-primary)",
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
            color: "var(--text-tertiary)",
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
                : "var(--text-tertiary)",
          }}
        >
          ~{tokenCount.toLocaleString()} tok
        </span>

        {/* Turn count */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "var(--text-tertiary)",
            marginLeft: 6,
          }}
        >
          {messages.length} turns
        </span>

        {/* Deep Think Toggle */}
        <button
          onClick={() => setThinkingMode(thinkingMode === 'deep' ? 'balanced' : 'deep')}
          title={thinkingMode === 'deep' ? "Deep Think: ON" : "Deep Think: OFF"}
          style={{
            background: thinkingMode === 'deep' ? 'rgba(99,102,241,0.15)' : 'none',
            border: thinkingMode === 'deep' ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            borderRadius: 6,
            padding: '2px 6px',
            marginLeft: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ 
            fontSize: 12, 
            filter: thinkingMode === 'deep' ? 'drop-shadow(0 0 4px #6366f1)' : 'grayscale(1)',
            opacity: thinkingMode === 'deep' ? 1 : 0.5,
          }}>
            🧠
          </span>
          <span style={{ 
            fontSize: 9, 
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            color: thinkingMode === 'deep' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            Deep
          </span>
        </button>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: 10,
          }}
        >
          {/* Minimize */}
          <button
            onClick={handleMinimize}
            title="Minimize"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "4px",
              transition: "color 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-tertiary)";
            }}
          >
            −
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            title="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "4px",
              transition: "color 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-tertiary)";
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          minHeight: 0,
          position: "relative",
        }}
      >
        {explainResult && (
          <div
            style={{
              position: "absolute",
              top: explainResult.y - 10,
              left: 12,
              right: 12,
              // transform: 'translateY(-100%)',
              zIndex: 10,
              padding: "12px 16px",
              background: "var(--bg-surface-solid)",
              backdropFilter: "blur(24px)",
              borderRadius: 12,
              border: "1px solid var(--border-primary)",
              boxShadow: "var(--shadow-main)",
              animation: "msg-in 0.2s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(99,102,241,0.9)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Explanation
              </div>
              <button
                onClick={() => setExplainResult(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-tertiary)")
                }
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.6,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
              >
                {explainResult.response ||
                  (explainResult.loading ? "Thinking..." : "")}
              </ReactMarkdown>
              {explainResult.loading && (
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 12,
                    background: "#6366f1",
                    marginLeft: 4,
                    animation: "dot-pulse 0.8s infinite",
                    verticalAlign: "middle",
                  }}
                />
              )}
            </div>
          </div>
        )}
        <MessageList
          messages={messages}
          loading={loading}
          streamingContent={streamingContent}
          pendingUserContent={pendingUserContent}
          onSelectionAction={handleSelectionAction}
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
          borderTop: "1px solid var(--border-secondary)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Pending Attachments Bar */}
        {pendingAttachmentIds.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "4px 0 12px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {pendingAttachmentIds.map((id) => {
              const att = library[id];
              if (!att) return null;
              return (
                <PendingThumbnail
                  key={id}
                  attachment={att}
                  onRemove={handleRemoveAttachment}
                />
              );
            })}
          </div>
        )}

        {/* Math Overlay Preview */}
        {activeMath && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 12px)",
              left: 14,
              right: 14,
              padding: "12px 16px",
              background: "var(--bg-surface-solid)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 12,
              boxShadow: "var(--shadow-main)",
              zIndex: 1100,
              backdropFilter: "blur(12px)",
              animation: "dialog-in 0.15s ease-out",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 9,
                color: "rgba(99,102,241,0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>LaTeX Preview</span>
              <span style={{ opacity: 0.5 }}>Rendering...</span>
            </div>
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: 15,
                lineHeight: 1.5,
                display: "flex",
                justifyContent: "center",
                minHeight: 24,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
              >
                {activeMath}
              </ReactMarkdown>
            </div>
            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                bottom: -6,
                left: 30,
                width: 12,
                height: 12,
                background: "var(--bg-surface-solid)",
                borderRight: "1px solid rgba(99,102,241,0.3)",
                borderBottom: "1px solid rgba(99,102,241,0.3)",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {/* Paperclip Button */}
          {llm.capabilities.multimodal && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--bg-input)",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-tertiary)")
                }
              >
                📎
              </button>
            </>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
            placeholder="Continue this thread…"
            rows={1}
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
              borderRadius: 10,
              color: "var(--text-primary)",
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
              e.target.style.borderColor = "var(--edge-color-active)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border-primary)";
              // Small delay to allow clicking preview if needed, or just close
              setTimeout(() => setActiveMath(null), 150);
            }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!canSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: canSend
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "var(--bg-input)",
              color: canSend ? "#fff" : "var(--text-tertiary)",
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
            color: "var(--text-tertiary)",
            opacity: 0.6,
          }}
        >
          ↵ send · ⇧↵ newline
        </div>
      </div>
    </div>
  );
};
