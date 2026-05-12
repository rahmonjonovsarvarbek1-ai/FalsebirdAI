# 🐦 FalsebirdAI

> *"You're not alone in this."*

FalsebirdAI is an emotional support platform with two AI companions: **Balu** (strategic, solution-oriented) and **Dora** (empathetic, deeply validating). Built with FastAPI + React.

---

## Project Structure

```
falsebirdai/
├── backend/
│   ├── main.py                    # FastAPI app, all routes, request lifecycle
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   └── services/
│       ├── personas.py            # Balu & Dora system prompts + configs
│       ├── safety.py              # Crisis detection & safety layer
│       └── llm_service.py        # OpenAI API wrapper
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Root layout component
        ├── index.css              # Global styles (dark warm aesthetic)
        ├── hooks/
        │   └── useChat.js         # Chat state, API calls, persona switching
        └── components/
            ├── PersonaSwitcher.jsx  # Persona selection cards
            ├── ChatInterface.jsx    # Main chat window
            ├── MessageBubble.jsx    # Individual message renderer
            └── SafetyBanner.jsx     # Crisis alert overlay
```

---

## Architecture Deep-Dive

### Persona Switcher (How It Works)

The persona system is a clean **config-driven architecture**:

1. `services/personas.py` defines a `PersonaConfig` dataclass with the system prompt, temperature, max_tokens, and UI metadata per persona
2. `useChat.js` maintains **independent message histories** for each persona in a single `{ balu: [...], dora: [...] }` state object
3. Switching personas is instant (no API call) — each thread resumes from where it left off
4. Every `POST /chat` request sends `{ persona: "balu"|"dora", message, history }` — the backend injects the correct system prompt

### Safety Layer (Priority Override)

```
User message → evaluate_safety() → HIGH/MEDIUM? → Return crisis message (NO LLM call)
                                  → LOW?         → Log + continue to LLM
                                  → NONE?        → Continue to LLM normally
```

The safety check is **always the first operation** — it cannot be bypassed by other middleware. It uses regex pattern matching across three severity tiers.

---

## Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add your OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev   # Runs on http://localhost:3000
```

---

## Scaling Notes

| Concern | Current | Scaling Path |
|---|---|---|
| **Sessions** | Client-side history | Redis session store + DB persistence |
| **Safety** | Regex patterns | Fine-tuned BERT crisis classifier |
| **LLM** | Single model | Model routing by persona or urgency |
| **Auth** | None | JWT + user accounts |
| **Rate Limiting** | None | FastAPI middleware + Redis |
| **Monitoring** | Logging | Sentry + safety event dashboard |

---

## Disclaimer

FalsebirdAI is **not a substitute for professional mental health care**. It is a supportive companion tool. Always include clear in-app messaging directing users to licensed therapists and crisis services when needed.