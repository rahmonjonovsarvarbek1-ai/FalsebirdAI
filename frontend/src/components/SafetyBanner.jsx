/**
 * SafetyBanner.jsx
 * ----------------
 * Renders the crisis intervention banner when the safety layer fires.
 *
 * Design intent:
 * - Visually urgent but NOT cold or clinical — warm, human, caring
 * - Shows the safety message from the AI persona
 * - Displays crisis resource links prominently
 * - Can be dismissed but leaves a soft "resources available" indicator
 */

import React, { useState } from "react";

export default function SafetyBanner({ alert, onDismiss }) {
  const [showResources, setShowResources] = useState(true);

  if (!alert) return null;

  const isHighRisk = alert.riskLevel === "high";

  return (
    <div className={`safety-banner ${isHighRisk ? "high-risk" : "medium-risk"}`}>
      {/* Pulse indicator */}
      <div className="safety-pulse-wrapper">
        <span className="safety-pulse" />
        <span className="safety-icon">🆘</span>
      </div>

      <div className="safety-content">
        <h3 className="safety-title">
          {isHighRisk ? "We need to pause for a moment" : "Your wellbeing matters"}
        </h3>

        <p className="safety-message">{alert.message}</p>

        {alert.resources && showResources && (
          <div className="safety-resources">
            <p className="resources-heading">📞 Crisis Support Resources</p>
            <div className="resources-body">
              <p>• <strong>International:</strong>{" "}
                <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noreferrer">
                  IASP Crisis Centres Directory
                </a>
              </p>
              <p>• <strong>Crisis Text Line (US):</strong> Text HOME to <strong>741741</strong></p>
              <p>• <strong>Samaritans (UK/IE):</strong> Call <strong>116 123</strong> (free, 24/7)</p>
              <p>• <strong>Lifeline (AU):</strong> <strong>13 11 14</strong></p>
              <p>• <strong>iCall (India):</strong> <strong>9152987821</strong></p>
            </div>
          </div>
        )}

        <div className="safety-actions">
          {alert.resources && (
            <button
              className="btn-toggle-resources"
              onClick={() => setShowResources((v) => !v)}
            >
              {showResources ? "Hide resources" : "Show crisis resources"}
            </button>
          )}
          <button className="btn-dismiss-safety" onClick={onDismiss}>
            Continue conversation
          </button>
        </div>
      </div>
    </div>
  );
}