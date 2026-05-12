/**
 * PersonaSwitcher.jsx
 * -------------------
 * The UI component that lets users choose between Balu and Dora.
 *
 * Design decisions:
 * - Shows both personas as cards with avatar, name, tagline, and accent color
 * - Active persona gets a prominent highlight ring + subtle glow
 * - Switching is instant — history for each persona is preserved in state
 * - Component is purely presentational; state lives in useChat hook
 */

import React from "react";

const PERSONAS = [
  {
    id: "balu",
    name: "Balu",
    emoji: "🦁",
    tagline: "Strategic clarity · Grounded warmth",
    description: "Action plans, focused thinking, and calm direction when life feels like a maze.",
    accent: "#F59E0B",
    accentLight: "rgba(245, 158, 11, 0.15)",
    ring: "ring-amber-400",
    textAccent: "text-amber-400",
    bgActive: "bg-amber-500/10",
    borderActive: "border-amber-400/60",
    badgeBg: "bg-amber-400/20 text-amber-300",
  },
  {
    id: "dora",
    name: "Dora",
    emoji: "🌸",
    tagline: "Deep empathy · Infinite patience",
    description: "Unconditional listening, emotional validation, and a space where nothing needs to be hidden.",
    accent: "#F472B6",
    accentLight: "rgba(244, 114, 182, 0.15)",
    ring: "ring-pink-400",
    textAccent: "text-pink-400",
    bgActive: "bg-pink-500/10",
    borderActive: "border-pink-400/60",
    badgeBg: "bg-pink-400/20 text-pink-300",
  },
];

export default function PersonaSwitcher({ activePersona, onSwitch }) {
  return (
    <div className="persona-switcher">
      <p className="switcher-label">Choose your companion</p>
      <div className="switcher-grid">
        {PERSONAS.map((p) => {
          const isActive = activePersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSwitch(p.id)}
              className={`persona-card ${isActive ? "active" : ""}`}
              style={{
                "--accent": p.accent,
                "--accent-light": p.accentLight,
                borderColor: isActive ? p.accent : "transparent",
              }}
              aria-pressed={isActive}
              aria-label={`Switch to ${p.name}`}
            >
              <div className="persona-card-inner">
                <span className="persona-emoji">{p.emoji}</span>
                <div className="persona-text">
                  <div className="persona-name-row">
                    <span className="persona-name">{p.name}</span>
                    {isActive && (
                      <span
                        className="active-badge"
                        style={{ background: p.accentLight, color: p.accent }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="persona-tagline">{p.tagline}</p>
                  <p className="persona-desc">{p.description}</p>
                </div>
              </div>
              {isActive && (
                <div
                  className="active-glow"
                  style={{ background: p.accentLight }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}