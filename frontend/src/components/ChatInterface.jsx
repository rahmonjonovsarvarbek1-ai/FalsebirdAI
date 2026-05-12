/**
 * ChatInterface.jsx
 * -----------------
 * The main chat window component. Renders:
 * - Scrollable message list
 * - Typing indicator when AI is responding
 * - Safety banner overlay when triggered
 * - Message input with send button
 * - Clear conversation control
 *
 * Auto-scrolls to the latest message on each update.
 */

import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import SafetyBanner from "./SafetyBanner";

const PERSONA_INFO = {
  balu: { name: "Balu", emoji: "🦁", accent: "#F59E0B", placeholder: "Tell Balu what's on your mind..." },
  dora: { name: "Dora", emoji: "🌸", accent: "#F472B6", placeholder: "Dora is listening — share anything..." },
};

export default function ChatInterface({
  messages,
  isLoading,
  error,
  safetyAlert,
  activePersona,
  onSendMessage,
  onClear,
  onDismissSafety,
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const persona = PERSONA_INFO[activePersona] || PERSONA_INFO.dora;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;
    onSendMessage(text);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Send on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-interface" style={{ "--persona-accent": persona.accent }}>
      {/* ── Chat Header ──────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-persona">
          <span className="header-emoji">{persona.emoji}</span>
          <div>
            <p className="header-name">{persona.name}</p>
            <p className="header-status">
              <span className="online-dot" />
              Online · Always here
            </p>
          </div>
        </div>
        <button
          className="btn-clear"
          onClick={onClear}
          title="Clear this conversation"
          aria-label="Clear conversation"
        >
          ↺ Clear
        </button>
      </div>

      {/* ── Messages ─────────────────────────────────── */}
      <div className="messages-scroll-area" aria-live="polite" aria-label="Chat messages">
        <div className="messages-inner">
          {messages.map((msg, i) => (
            <MessageBubble key={`${msg.timestamp}-${i}`} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="typing-indicator-row">
              <div
                className="typing-avatar"
                style={{ borderColor: persona.accent }}
              >
                {persona.emoji}
              </div>
              <div className="typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="error-notice">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Safety Banner ─────────────────────────────── */}
      {safetyAlert && (
        <SafetyBanner alert={safetyAlert} onDismiss={onDismissSafety} />
      )}

      {/* ── Input Bar ─────────────────────────────────── */}
      <div className="input-bar">
        <textarea
          ref={inputRef}
          className="message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={persona.placeholder}
          rows={2}
          maxLength={2000}
          disabled={isLoading}
          aria-label="Type your message"
        />
        <button
          className="send-button"
          onClick={handleSubmit}
          disabled={!inputText.trim() || isLoading}
          style={{ background: persona.accent }}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="send-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <p className="input-hint">
        Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}