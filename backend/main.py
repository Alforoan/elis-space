from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import database
from database import get_db, MoodEntry, Settings
from eli_ai import eli

app = FastAPI(title="Mood Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    eli_response: str
    sentiment_score: float
    sentiment_label: str
    mood_tags: str
    entry_id: int

class MoodEntryResponse(BaseModel):
    id: int
    user_message: str
    eli_response: str
    sentiment_score: Optional[float]
    sentiment_label: Optional[str]
    mood_tags: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SettingsRequest(BaseModel):
    reminder_enabled: bool
    reminder_time: str
    privacy_mode: bool

class SettingsResponse(BaseModel):
    reminder_enabled: bool
    reminder_time: str
    privacy_mode: bool
    
    class Config:
        from_attributes = True

@app.get("/")
def read_root():
    return {"message": "Mood Tracker API - Eli is ready to chat"}

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_eli(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        recent_entries = db.query(MoodEntry).order_by(MoodEntry.created_at.desc()).limit(5).all()
        conversation_history = [
            {
                "user_message": entry.user_message,
                "eli_response": entry.eli_response
            }
            for entry in reversed(recent_entries)
        ]
        
        eli_response = eli.chat(request.message, conversation_history)
        
        sentiment_data = eli.analyze_sentiment(request.message)
        mood_tags = eli.get_mood_tags(sentiment_data)
        
        new_entry = MoodEntry(
            user_message=request.message,
            eli_response=eli_response,
            sentiment_score=sentiment_data["score"],
            sentiment_label=sentiment_data["label"],
            mood_tags=mood_tags,
            created_at=datetime.utcnow()
        )
        
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        return ChatResponse(
            eli_response=eli_response,
            sentiment_score=sentiment_data["score"],
            sentiment_label=sentiment_data["label"],
            mood_tags=mood_tags,
            entry_id=new_entry.id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entries", response_model=List[MoodEntryResponse])
def get_mood_entries(
    days: int = 7,
    db: Session = Depends(get_db)
):
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= cutoff_date
        ).order_by(MoodEntry.created_at.desc()).all()
        
        return entries
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entries/today", response_model=List[MoodEntryResponse])
def get_today_entries(db: Session = Depends(get_db)):
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= today_start
        ).order_by(MoodEntry.created_at.asc()).all()
        
        return entries
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary/daily")
def get_daily_summary(db: Session = Depends(get_db)):
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= today_start
        ).all()
        
        summary = eli.generate_daily_summary(entries)
        
        return {
            "summary": summary,
            "entry_count": len(entries),
            "date": today_start.date().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary/weekly")
def get_weekly_summary(db: Session = Depends(get_db)):
    try:
        week_start = datetime.utcnow() - timedelta(days=7)
        entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= week_start
        ).all()
        
        insights = eli.generate_weekly_insights(entries)
        
        positive_count = sum(1 for e in entries if e.sentiment_label == "positive")
        negative_count = sum(1 for e in entries if e.sentiment_label == "negative")
        neutral_count = sum(1 for e in entries if e.sentiment_label == "neutral")
        
        return {
            "insights": insights,
            "entry_count": len(entries),
            "positive_count": positive_count,
            "negative_count": negative_count,
            "neutral_count": neutral_count,
            "week_start": week_start.date().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    try:
        settings = db.query(Settings).first()
        
        if not settings:
            settings = Settings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return SettingsResponse(
            reminder_enabled=bool(settings.reminder_enabled),
            reminder_time=settings.reminder_time,
            privacy_mode=bool(settings.privacy_mode)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings", response_model=SettingsResponse)
def update_settings(request: SettingsRequest, db: Session = Depends(get_db)):
    try:
        settings = db.query(Settings).first()
        
        if not settings:
            settings = Settings()
            db.add(settings)
        
        settings.reminder_enabled = int(request.reminder_enabled)
        settings.reminder_time = request.reminder_time
        settings.privacy_mode = int(request.privacy_mode)
        settings.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(settings)
        
        return SettingsResponse(
            reminder_enabled=bool(settings.reminder_enabled),
            reminder_time=settings.reminder_time,
            privacy_mode=bool(settings.privacy_mode)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/overview")
def get_stats_overview(db: Session = Depends(get_db)):
    try:
        total_entries = db.query(MoodEntry).count()
        
        week_start = datetime.utcnow() - timedelta(days=7)
        week_entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= week_start
        ).all()
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_entries = db.query(MoodEntry).filter(
            MoodEntry.created_at >= today_start
        ).count()
        
        avg_sentiment = 0.5
        if week_entries:
            sentiment_scores = [e.sentiment_score for e in week_entries if e.sentiment_score]
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        
        return {
            "total_entries": total_entries,
            "entries_this_week": len(week_entries),
            "entries_today": today_entries,
            "avg_sentiment_this_week": round(avg_sentiment, 2)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
