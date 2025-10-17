from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import database
from database import get_db, MoodEntry, Settings, User
from eli_ai import eli
from auth import create_access_token, get_current_user, get_current_user_required

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
    entry_id: Optional[int] = None  # None for guest users

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
    reminder_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None
    privacy_mode: Optional[bool] = None
    safe_mode: Optional[bool] = None

class SettingsResponse(BaseModel):
    reminder_enabled: bool
    reminder_time: str
    privacy_mode: bool
    safe_mode: bool

    class Config:
        from_attributes = True

class SignupRequest(BaseModel):
    username: str
    email: str  # Changed from EmailStr to str for simpler validation
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

@app.get("/")
def read_root():
    return {"message": "Mood Tracker API - Eli is ready to chat"}

# Authentication endpoints
@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    try:
        # Basic email validation
        if '@' not in request.email or '.' not in request.email.split('@')[1]:
            raise HTTPException(status_code=400, detail="Invalid email format")

        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (User.username == request.username) | (User.email == request.email)
        ).first()

        if existing_user:
            if existing_user.username == request.username:
                raise HTTPException(status_code=400, detail="Username already registered")
            else:
                raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user
        new_user = User(
            username=request.username,
            email=request.email
        )
        new_user.set_password(request.password)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create default settings for user
        user_settings = Settings(user_id=new_user.id)
        db.add(user_settings)
        db.commit()

        # Create access token
        access_token = create_access_token(data={"sub": new_user.id})

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        # Find user by username
        user = db.query(User).filter(User.username == request.username).first()

        if not user or not user.check_password(request.password):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )

        # Create access token
        access_token = create_access_token(data={"sub": user.id})

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user_required)):
    return current_user

class VerifyPasswordRequest(BaseModel):
    password: str

@app.post("/api/auth/verify-password")
def verify_password(
    request: VerifyPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_required)
):
    """Verify the current user's password (for safe mode unlock)"""
    try:
        is_valid = current_user.check_password(request.password)
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_eli(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # For authenticated users: load conversation history from database
        # For guest users: no conversation history (frontend will provide via localStorage)
        conversation_history = []

        if current_user:
            print(f"🔐 /api/chat - Authenticated user: {current_user.username} (ID: {current_user.id})")
            recent_entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id
            ).order_by(MoodEntry.created_at.desc()).limit(5).all()

            conversation_history = [
                {
                    "user_message": entry.user_message,
                    "eli_response": entry.eli_response
                }
                for entry in reversed(recent_entries)
            ]
        else:
            print(f"👤 /api/chat - Guest user (no auth token)")

        eli_response = eli.chat(request.message, conversation_history)

        sentiment_data = eli.analyze_sentiment(request.message)
        mood_tags = eli.get_mood_tags(sentiment_data)

        # ONLY save to database for authenticated users
        entry_id = None
        if current_user:
            new_entry = MoodEntry(
                user_id=current_user.id,
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
            entry_id = new_entry.id
            print(f"   Saved entry {entry_id} for user {current_user.id}")

        return ChatResponse(
            eli_response=eli_response,
            sentiment_score=sentiment_data["score"],
            sentiment_label=sentiment_data["label"],
            mood_tags=mood_tags,
            entry_id=entry_id  # None for guests, actual ID for authenticated users
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entries", response_model=List[MoodEntryResponse])
def get_mood_entries(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # AUTHENTICATED USERS ONLY: Return their entries from database
        if current_user:
            print(f"🔐 /api/entries - Authenticated user: {current_user.username} (ID: {current_user.id})")
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
                MoodEntry.created_at >= cutoff_date
            ).order_by(MoodEntry.created_at.desc()).all()
            print(f"   Returning {len(entries)} entries for user {current_user.id}")
            return entries
        else:
            # GUEST USERS: Return empty list (they use localStorage on frontend)
            print(f"👤 /api/entries - Guest user (no auth token)")
            return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entries/today", response_model=List[MoodEntryResponse])
def get_today_entries(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # AUTHENTICATED USERS ONLY: Return their entries from database
        if current_user:
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
                MoodEntry.created_at >= today_start
            ).order_by(MoodEntry.created_at.asc()).all()
            return entries
        else:
            # GUEST USERS: Return empty list (they use localStorage on frontend)
            return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary/daily")
def get_daily_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # AUTHENTICATED USERS ONLY: Return their summary from database
        if current_user:
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
                MoodEntry.created_at >= today_start
            ).all()

            summary = eli.generate_daily_summary(entries)

            return {
                "summary": summary,
                "entry_count": len(entries),
                "date": today_start.date().isoformat()
            }
        else:
            # GUEST USERS: Return empty summary (they use localStorage on frontend)
            return {
                "summary": "",
                "entry_count": 0,
                "date": today_start.date().isoformat()
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary/weekly")
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        week_start = datetime.utcnow() - timedelta(days=7)

        # AUTHENTICATED USERS ONLY: Return their summary from database
        if current_user:
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
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
        else:
            # GUEST USERS: Return empty summary (they use localStorage on frontend)
            return {
                "insights": "",
                "entry_count": 0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "week_start": week_start.date().isoformat()
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # Query settings based on user
        if current_user:
            settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()

            if not settings:
                # Create new settings for authenticated user
                settings = Settings(user_id=current_user.id)
                db.add(settings)
                db.commit()
                db.refresh(settings)
        else:
            # Guest mode - get first settings or create default
            settings = db.query(Settings).filter(Settings.user_id == None).first()

            if not settings:
                settings = Settings(user_id=None)
                db.add(settings)
                db.commit()
                db.refresh(settings)

        return SettingsResponse(
            reminder_enabled=bool(settings.reminder_enabled),
            reminder_time=settings.reminder_time,
            privacy_mode=bool(settings.privacy_mode),
            safe_mode=bool(settings.safe_mode)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings", response_model=SettingsResponse)
def update_settings(
    request: SettingsRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # Query settings based on user
        if current_user:
            settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()

            if not settings:
                settings = Settings(user_id=current_user.id)
                db.add(settings)
        else:
            # Guest mode - get first settings or create default
            settings = db.query(Settings).filter(Settings.user_id == None).first()

            if not settings:
                settings = Settings(user_id=None)
                db.add(settings)

        # Only update fields that are provided
        if request.reminder_enabled is not None:
            settings.reminder_enabled = int(request.reminder_enabled)
        if request.reminder_time is not None:
            settings.reminder_time = request.reminder_time
        if request.privacy_mode is not None:
            settings.privacy_mode = int(request.privacy_mode)
        if request.safe_mode is not None:
            settings.safe_mode = int(request.safe_mode)
        settings.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(settings)

        return SettingsResponse(
            reminder_enabled=bool(settings.reminder_enabled),
            reminder_time=settings.reminder_time,
            privacy_mode=bool(settings.privacy_mode),
            safe_mode=bool(settings.safe_mode)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/overview")
def get_stats_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # AUTHENTICATED USERS ONLY: Return their stats from database
        if current_user:
            week_start = datetime.utcnow() - timedelta(days=7)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

            total_entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id
            ).count()

            week_entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
                MoodEntry.created_at >= week_start
            ).all()

            today_entries = db.query(MoodEntry).filter(
                MoodEntry.user_id == current_user.id,
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
        else:
            # GUEST USERS: Return empty stats (they use localStorage on frontend)
            return {
                "total_entries": 0,
                "entries_this_week": 0,
                "entries_today": 0,
                "avg_sentiment_this_week": 0.5
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
