/**
 * MessageBubble.jsx
 * -----------------
 * Renders a single chat message with appropriate styling
 * for user vs assistant, safety messages, and persona accent colors.
 */

import React from "react";

const PERSONA_STYLES = {
  balu: {
    accent: "#F59E0B",
    emoji: "🦁",
    name: "Balu",
  },
  dora: {
    accent: "#F472B6",
    emoji: "🌸",
    name: "Dora",
  },
};

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const persona = PERSONA_STYLES[message.persona] || PERSONA_STYLES.dora;
  const isSafety = message.isSafetyMessage;

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      {/* Avatar — only for assistant messages */}
      {!isUser && (
        <div
          className="message-avatar"
          style={{ borderColor: persona.accent }}
          aria-hidden="true"
        >
          {persona.emoji}
        </div>
      )}

      <div className={`bubble-wrapper ${isUser ? "user-bubble-wrapper" : ""}`}>
        {/* Persona name label for assistant */}
        {!isUser && (
          <span
            className="bubble-sender"
            style={{ color: persona.accent }}
          >
            {persona.name}
          </span>
        )}

        <div
          className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"} ${isSafety ? "safety-bubble" : ""}`}
          style={
            !isUser
              ? { "--persona-accent": persona.accent }
              : undefined
          }
        >
          {/* Safety icon for safety-triggered messages */}
          {isSafety && (
            <span className="bubble-safety-icon" aria-label="Safety message">
              💛
            </span>
          )}
          <p className="bubble-text">{message.content}</p>
        </div>

        <span className="bubble-time">{formatTime(message.timestamp)}</span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="message-avatar user-avatar" aria-hidden="true">
          🌿
        </div>
      )}
    </div>
  );
}