# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A conversational mood tracking application ("Eli") designed to support formerly incarcerated individuals during their reentry period. The app enables emotional reflection through natural conversations with an empathetic AI companion.

**Core Philosophy**: Empathetic, judgment-free emotional support through conversational AI. Privacy-focused with local data storage.

## Architecture

### Tech Stack
- **Backend**: FastAPI (Python 3.11+) with SQLAlchemy ORM
- **Frontend**: React 19 (JavaScript, no TypeScript) with Vite
- **Database**: SQLite (local file: `mood_tracker.db`)
- **AI**: OpenAI GPT-5 for conversations and TextBlob for sentiment analysis
- **Visualization**: Recharts for mood trend charts

### Project Structure
```
eli/
├── backend/
│   ├── main.py          # FastAPI server with REST endpoints
│   ├── database.py      # SQLAlchemy models (MoodEntry, Settings)
│   ├── eli_ai.py        # Eli AI logic with OpenAI integration
│   └── mood_tracker.db  # SQLite database (auto-created)
├── frontend/
│   └── src/
│       ├── App.jsx                 # Main router
│       ├── pages/Chat.jsx          # Conversational interface
│       ├── pages/Dashboard.jsx     # Mood visualizations
│       └── pages/Settings.jsx      # User preferences
├── vite.config.js       # Vite config with proxy to backend
└── start.sh             # Launches both servers
```

### Key Design Patterns

**Conversation Flow** (backend/main.py:60-96):
- User sends message via POST `/api/chat`
- Recent conversation history (last 5 entries) retrieved from DB
- Eli generates empathetic response via OpenAI GPT-5
- TextBlob analyzes sentiment of user message
- Mood entry saved with user message, Eli response, sentiment data, and timestamp
- Multiple entries per day are supported and expected

**Sentiment Analysis** (backend/eli_ai.py:26-51):
- TextBlob calculates polarity (-1 to 1)
- Normalized to score (0 to 1)
- Labels: positive (>0.3), negative (<-0.3), neutral (else)
- Mood tags generated based on sentiment intensity

**AI System Prompt** (backend/eli_ai.py:14-24):
- Eli is compassionate, empathetic, non-judgmental
- Focuses on emotional reflection and validation
- Keeps responses concise (2-4 sentences)
- Never provides clinical advice

## Development Commands

### Running the Application
```bash
# Start both backend and frontend together
./start.sh

# Or start individually:
cd backend && python main.py        # Backend on port 8000
npm run dev                          # Frontend on port 5000 (from root)
```

### Frontend Development
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build (outputs to ../dist)
npm run preview      # Preview production build
```

### Backend Development
```bash
# Install dependencies (using uv)
uv pip install -r pyproject.toml

# Run server directly
cd backend && python main.py

# Database is auto-created on first run via SQLAlchemy
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Send message, get Eli response + sentiment |
| GET | `/api/entries?days=7` | Retrieve mood entries (default 7 days) |
| GET | `/api/entries/today` | Get today's entries only |
| GET | `/api/summary/daily` | AI-generated daily summary |
| GET | `/api/summary/weekly` | AI-generated weekly insights with stats |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |
| GET | `/api/stats/overview` | Dashboard statistics |

## Environment Variables

**Required**:
- `OPENAI_API_KEY` - OpenAI API key for GPT-5 access (backend/eli_ai.py:8)

**Model Note**: The project uses GPT-5 (released August 7, 2025). Do not change model to gpt-4 or earlier unless explicitly requested (backend/eli_ai.py:6, 84, 112, 147).

## Important Constraints

1. **No TypeScript** - Project explicitly uses JavaScript only
2. **FastAPI backend** - Not Node.js/Express
3. **SQLite only** - Local storage, no external database
4. **Empathetic tone** - All AI responses must be warm, supportive, non-clinical
5. **Privacy-focused** - Data stays local, no external analytics

## Database Schema

**MoodEntry** (backend/database.py:15-24):
- Stores conversation pairs (user message + Eli response)
- Sentiment analysis results (score, label, mood tags)
- Timestamps for temporal analysis
- No user authentication (single-user app)

**Settings** (backend/database.py:26-33):
- Reminder preferences (enabled, time)
- Privacy mode toggle
- Stored as integers for SQLite compatibility (0/1 for boolean)

## Frontend Architecture

**Navigation**: Single-page app with react-router-dom, three main routes (Chat, Dashboard, Settings)

**API Communication**: Axios with proxy configuration in vite.config.js (frontend calls `/api/*`, Vite proxies to `http://localhost:8000`)

**State Management**: Local component state (no Redux/Context). Dashboard fetches fresh data on mount.

**Styling**: Custom CSS files per page, no component library

## Common Development Scenarios

### Adding New Mood Analysis Features
1. Extend sentiment analysis in `backend/eli_ai.py`
2. Update `MoodEntry` model if new fields needed
3. Modify POST `/api/chat` endpoint to include new data
4. Update frontend Chat.jsx to display new insights

### Modifying Eli's Personality
- Edit system prompt in `backend/eli_ai.py:14-24`
- Adjust response length in `max_completion_tokens` parameters
- Test with various emotional inputs

### Adding Dashboard Visualizations
1. Create new endpoint in `backend/main.py` for data aggregation
2. Import and configure Recharts component in `frontend/src/pages/Dashboard.jsx`
3. Style in `frontend/src/styles/Dashboard.css`
