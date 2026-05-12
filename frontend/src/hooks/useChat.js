/**
 * useChat.js
 * ----------
 * Custom React hook that owns all chat state and logic.
 *
 * Responsibilities:
 * - Maintain message history per persona (Balu / Dora)
 * - Send messages to the FastAPI backend
 * - Handle loading, error, and safety states
 * - Expose a clean API to the UI components
 */

import { useState, useCallback, useRef } from "react";

// Eskisini o'chirib, o'rniga buni qo'y:
const API_BASE = "https://falsebirdai.onrender.com";

// Initial greeting messages so the UI isn't empty on load
const INITIAL_MESSAGES = {
  balu: [
    {
      role: "assistant",
      content:
        "Hey. I'm Balu. Whatever you're carrying right now — let's look at it together. " +
        "No judgment, just clarity. What's going on?",
      timestamp: new Date().toISOString(),
      persona: "balu",
    },
  ],
  dora: [
    {
      role: "assistant",
      content:
        "Hi, I'm Dora. I'm so glad you're here. This is a safe space — " +
        "there's nothing you need to hide or explain away. " +
        "Whenever you're ready, I'm listening. 💛",
      timestamp: new Date().toISOString(),
      persona: "dora",
    },
  ],
};

export function useChat() {
  // Each persona has its own independent conversation history
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [activePersona, setActivePersona] = useState("dora");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [safetyAlert, setSafetyAlert] = useState(null);

  // Used to cancel in-flight requests on unmount
  const abortRef = useRef(null);

  // ── History for API (exclude initial greeting for cleaner context) ──
  const buildHistory = useCallback(
    (persona) => {
      const msgs = messages[persona] || [];
      // Skip the very first greeting (index 0) from API history
      return msgs.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));
    },
    [messages]
  );

  // ── Send Message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || isLoading) return;

      const userMessage = {
        role: "user",
        content: userText.trim(),
        timestamp: new Date().toISOString(),
        persona: activePersona,
      };

      // Optimistically add user message
      setMessages((prev) => ({
        ...prev,
        [activePersona]: [...prev[activePersona], userMessage],
      }));

      setIsLoading(true);
      setError(null);
      setSafetyAlert(null);

      // Cancel any previous request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            persona: activePersona,
            message: userText.trim(),
            history: buildHistory(activePersona),
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // ── Safety Override ──────────────────────────────────────────
        if (data.safety?.triggered) {
          setSafetyAlert({
            message: data.reply,
            resources: data.safety.resources,
            riskLevel: data.safety.risk_level,
          });
        }

        // Add AI reply to message history
        const assistantMessage = {
          role: "assistant",
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
          persona: activePersona,
          isSafetyMessage: data.safety?.triggered,
        };

        setMessages((prev) => ({
          ...prev,
          [activePersona]: [...prev[activePersona], assistantMessage],
        }));
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(
          err.message || "Something went wrong. Please check your connection."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activePersona, isLoading, buildHistory]
  );

  // ── Persona Switcher ─────────────────────────────────────────────────
  const switchPersona = useCallback((persona) => {
    if (persona !== "balu" && persona !== "dora") return;
    setActivePersona(persona);
    setError(null);
    setSafetyAlert(null);
  }, []);

  // ── Clear conversation for current persona ───────────────────────────
  const clearConversation = useCallback(() => {
    setMessages((prev) => ({
      ...prev,
      [activePersona]: INITIAL_MESSAGES[activePersona],
    }));
    setSafetyAlert(null);
    setError(null);
  }, [activePersona]);

  return {
    messages: messages[activePersona],  // only active persona's messages
    allMessages: messages,              // for tab indicators (unread, etc.)
    activePersona,
    isLoading,
    error,
    safetyAlert,
    sendMessage,
    switchPersona,
    clearConversation,
    dismissSafetyAlert: () => setSafetyAlert(null),
  };
}