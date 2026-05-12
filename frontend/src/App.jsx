/**
 * App.jsx
 * -------
 * FalsebirdAI root component.
 * Composes PersonaSwitcher + ChatInterface with shared state from useChat.
 */

import React from "react";
import { useChat } from "./hooks/useChat";
import PersonaSwitcher from "./components/PersonaSwitcher";
import ChatInterface from "./components/ChatInterface";
import "./index.css";

export default function App() {
  const {
    messages,
    activePersona,
    isLoading,
    error,
    safetyAlert,
    sendMessage,
    switchPersona,
    clearConversation,
    dismissSafetyAlert,
  } = useChat();

  return (
    <div className="app-root">
      {/* ── Background atmosphere ───── */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grain" />

      {/* ── Main Layout ─────────────── */}
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="logo">
            <span className="logo-bird">🐦</span>
            <div>
              <h1 className="logo-name">Falsebird<span>AI</span></h1>
              <p className="logo-tagline">You're not alone in this.</p>
            </div>
          </div>

          {/* Persona Switcher */}
          <PersonaSwitcher
            activePersona={activePersona}
            onSwitch={switchPersona}
          />

          {/* Footer note */}
          <div className="sidebar-footer">
            <p>
              FalsebirdAI is a support companion,{" "}
              <strong>not a crisis service</strong>. If you're in immediate
              danger, please call emergency services.
            </p>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="chat-main">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            error={error}
            safetyAlert={safetyAlert}
            activePersona={activePersona}
            onSendMessage={sendMessage}
            onClear={clearConversation}
            onDismissSafety={dismissSafetyAlert}
          />
        </main>
      </div>
    </div>
  );
}