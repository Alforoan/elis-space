# Mood Tracker for Formerly Incarcerated Individuals

## Overview
A conversational mood tracking application designed to support people during their reentry period. The app helps users reflect on and manage emotions through natural conversations with Eli, an empathetic AI companion.

## Recent Changes (October 8, 2025)
- Built complete mood tracking application with chat, dashboard, and settings
- Implemented Eli AI agent using OpenAI GPT-5 for empathetic responses
- Created FastAPI backend with SQLite database for mood entry storage
- Built React frontend with Vite, featuring conversational chat interface
- Added Recharts visualizations for mood trends and insights
- Implemented sentiment analysis using TextBlob and OpenAI
- Created responsive UI with custom CSS styling

## Project Architecture

### Backend (FastAPI + Python)
- `backend/main.py` - FastAPI server with REST API endpoints
- `backend/database.py` - SQLAlchemy models and database setup
- `backend/eli_ai.py` - Eli AI module with OpenAI integration and sentiment analysis
- SQLite database: `mood_tracker.db`

### Frontend (React + Vite)
- `frontend/src/App.jsx` - Main app with routing
- `frontend/src/pages/Chat.jsx` - Conversational mood logging interface
- `frontend/src/pages/Dashboard.jsx` - Mood visualizations and insights
- `frontend/src/pages/Settings.jsx` - User preferences and reminders
- `frontend/src/styles/` - Custom CSS for each component

### Key Features
1. Chat with Eli - Natural conversation-driven mood logging
2. Multiple entries per day with timestamps
3. AI-powered sentiment analysis and mood tagging
4. Daily and weekly mood summaries
5. Interactive dashboard with charts (line, bar, pie)
6. Settings for reminders and privacy
7. Local data storage with SQLite

### Tech Stack
- Backend: FastAPI, SQLAlchemy, OpenAI, TextBlob
- Frontend: React (JavaScript), Vite, Recharts, Axios
- Database: SQLite
- AI: OpenAI GPT-5 for conversations

### API Endpoints
- POST `/api/chat` - Send message to Eli, get response with sentiment
- GET `/api/entries` - Get mood entries (default last 7 days)
- GET `/api/entries/today` - Get today's entries
- GET `/api/summary/daily` - Get AI-generated daily summary
- GET `/api/summary/weekly` - Get AI-generated weekly insights
- GET/PUT `/api/settings` - User settings management
- GET `/api/stats/overview` - Dashboard statistics

### User Preferences
- No TypeScript (per project requirements)
- FastAPI backend (not Node.js)
- SQLite database
- Empathetic, supportive tone in all interactions
- Privacy-focused local storage

## Running the Project
The workflow "Mood Tracker App" starts both backend (port 8000) and frontend (port 5000) servers automatically.

Backend: `python backend/main.py`
Frontend: `npm run dev`

## Environment Variables
- `OPENAI_API_KEY` - Required for Eli's conversational AI capabilities
