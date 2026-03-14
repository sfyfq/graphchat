import * as React from "react";
import { useAuthStore } from "../../store/authStore";
import { useConfigStore } from "../../store/configStore";

export const AuthStatusModal: React.FC = () => {
  const { user, isWhitelisted, showStatusModal, setShowStatusModal } =
    useAuthStore();
  const { apiKey } = useConfigStore();

  if (!showStatusModal) return null;

  const getStatusInfo = () => {
    if (apiKey) {
      return {
        title: "Local Mode Active",
        message:
          "Local API Key detected. Using your personal Gemini key for all requests.",
        color: "#60a5fa",
        icon: "🔑",
      };
    }
    if (isWhitelisted) {
      return {
        title: "Friend Mode Active",
        message:
          "Welcome! Your account is whitelisted. You are now using the real Gemini LLM. Your conversation is confidential to you. GraphChat doesn not monitor or store your conversation anywhere.",
        color: "#4ade80",
        icon: "🌟",
      };
    }
    return {
      title: "Guest Mode Active",
      message: `Logged in as ${user?.email || "Guest"}, but you are not currently on the whitelist. You will be using the Mock AI for now.`,
      note: "Mock AI provides simulated responses for testing purposes.",
      color: "#f87171",
      icon: "👤",
    };
  };

  const info = getStatusInfo();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        animation: "dialog-in 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: 400,
          background: "var(--bg-surface-solid)",
          border: "1px solid var(--border-primary)",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "var(--shadow-main)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 48,
            filter: `drop-shadow(0 0 10px ${info.color}44)`,
          }}
        >
          {info.icon}
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              color: info.color,
              letterSpacing: "-0.02em",
            }}
          >
            {info.title}
          </h2>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            {info.message}
          </p>
          {info.note && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "var(--text-tertiary)",
                fontStyle: "italic",
              }}
            >
              {info.note}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowStatusModal(false)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            background: "var(--bg-input)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--border-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--bg-input)")
          }
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
