"""
Seed database with test user and 14 days of mood entries
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, MoodEntry, Settings

def seed_database():
    db = SessionLocal()

    try:
        print("=" * 70)
        print("SEEDING DATABASE WITH TEST DATA")
        print("=" * 70)

        # Check if user already exists and delete automatically
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("\n>> Found existing 'testuser', deleting old data...")
            # Delete existing data
            db.query(MoodEntry).filter(MoodEntry.user_id == existing_user.id).delete()
            db.query(Settings).filter(Settings.user_id == existing_user.id).delete()
            db.delete(existing_user)
            db.commit()
            print(">> Deleted existing user and data")

        # Create test user
        print("\n>> Creating test user...")
        test_user = User(
            username="testuser",
            email="test@example.com"
        )
        test_user.set_password("password123")

        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f">> Created user: testuser (ID: {test_user.id})")

        # Create settings for user
        user_settings = Settings(user_id=test_user.id)
        db.add(user_settings)
        db.commit()
        print(">> Created user settings")

        # Create 14 days of mood entries with varying check-ins per day (1-20)
        print("\n>> Creating 14 days of mood check-ins with 1-20 entries per day...")

        # Expanded pool of sample messages for different moods
        sample_messages = [
            # Positive messages
            ("I'm feeling amazing today! Everything is going so well.", "positive", 0.8, "joyful, optimistic"),
            ("Things are going well and I'm making progress.", "positive", 0.6, "hopeful, encouraged"),
            ("Had a good day, feeling hopeful about tomorrow.", "positive", 0.5, "content, stable"),
            ("I'm proud of myself for getting through this week.", "positive", 0.7, "hopeful, encouraged"),
            ("Making small progress every day.", "positive", 0.4, "content, stable"),
            ("Feeling really energized and motivated today!", "positive", 0.75, "joyful, optimistic"),
            ("I accomplished something meaningful today.", "positive", 0.65, "hopeful, encouraged"),
            ("Feeling grateful for the support I have.", "positive", 0.7, "content, stable"),
            ("Today was productive and fulfilling.", "positive", 0.6, "hopeful, encouraged"),
            ("I'm feeling more confident about the future.", "positive", 0.55, "hopeful, encouraged"),

            # Neutral messages
            ("Feeling okay, just taking things one day at a time.", "neutral", 0.3, "calm, reflective"),
            ("It's been a calm day, nothing major happening.", "neutral", 0.1, "calm, reflective"),
            ("Feeling a bit uncertain about things.", "neutral", -0.1, "uncertain, low"),
            ("Just checking in, trying to stay grounded.", "neutral", 0.0, "calm, reflective"),
            ("Things are pretty steady right now.", "neutral", 0.2, "calm, reflective"),
            ("Not much to report, just a regular day.", "neutral", 0.05, "calm, reflective"),
            ("Feeling neutral, neither good nor bad.", "neutral", 0.0, "calm, reflective"),
            ("Just going through the motions today.", "neutral", -0.05, "uncertain, low"),

            # Negative messages
            ("I'm feeling a little down today.", "negative", -0.3, "uncertain, low"),
            ("Having some struggles but trying to stay positive.", "negative", -0.4, "struggling, anxious"),
            ("Feeling overwhelmed with everything going on.", "negative", -0.6, "struggling, anxious"),
            ("Today has been really tough.", "negative", -0.7, "overwhelmed, distressed"),
            ("Feeling anxious about tomorrow.", "negative", -0.5, "struggling, anxious"),
            ("I'm stressed about a lot of things right now.", "negative", -0.55, "struggling, anxious"),
            ("Having a hard time coping today.", "negative", -0.65, "overwhelmed, distressed"),
            ("Feeling lonely and disconnected.", "negative", -0.5, "struggling, anxious"),
            ("Today's been challenging, feeling drained.", "negative", -0.45, "uncertain, low"),
            ("Struggling to stay motivated.", "negative", -0.35, "uncertain, low"),
        ]

        # Eli's response templates
        eli_responses = [
            "That's wonderful to hear! It sounds like you're in a really positive space right now. What's contributing to these good feelings?",
            "I'm glad things are moving in a positive direction for you. Progress is something to celebrate, no matter how small.",
            "Hope is such a powerful feeling. It's great that you're looking forward with optimism.",
            "Taking things one day at a time is a wise approach. You're being patient with yourself, and that's important.",
            "Sometimes calm days are exactly what we need. How are you feeling about this pace?",
            "Uncertainty can be uncomfortable. What's weighing on your mind?",
            "I hear you. Down days are part of the journey. Would you like to talk about what's affecting your mood?",
            "It takes real strength to keep trying when things are difficult. I'm here with you.",
            "Feeling overwhelmed is challenging. Remember, you don't have to handle everything at once. What feels most pressing right now?",
            "I'm sorry today has been so hard. You're not alone in this. What would help you feel even a little bit better?",
            "You should be proud! Recognizing your own resilience is important. What helped you get through?",
            "Small progress is still progress, and it matters. Keep going at your own pace.",
            "Anxiety about the future is natural. Let's focus on what you can control today. What would help you feel more prepared?",
            "Staying grounded is a great practice. What helps you feel most centered?",
            "I'm here with you through this. Would you like to talk more about what you're experiencing?",
            "That's a valid feeling. Sometimes we need to honor where we are emotionally.",
            "It sounds like you're being really thoughtful about your journey. That awareness is valuable.",
            "Every day is different, and that's okay. How can I support you today?",
        ]

        entries_created = 0
        total_entries = 0

        for day_offset in range(14):
            # Random number of check-ins for this day (1-20)
            num_checkins = random.randint(1, 20)

            # Base date for this day
            base_date = datetime.utcnow() - timedelta(days=(13 - day_offset))
            base_date = base_date.replace(hour=0, minute=0, second=0, microsecond=0)

            day_entries = []

            for checkin in range(num_checkins):
                # Random time during the day (spread across 24 hours)
                hours = random.randint(0, 23)
                minutes = random.randint(0, 59)
                seconds = random.randint(0, 59)

                entry_timestamp = base_date + timedelta(hours=hours, minutes=minutes, seconds=seconds)

                # Pick a random message from the pool
                message_data = random.choice(sample_messages)
                user_message = message_data[0]
                sentiment_label = message_data[1]
                polarity = message_data[2]
                mood_tag = message_data[3]

                # Pick a random Eli response
                eli_response = random.choice(eli_responses)

                # Normalize to 0-1 score
                sentiment_score = (polarity + 1) / 2

                entry = MoodEntry(
                    user_id=test_user.id,
                    user_message=user_message,
                    eli_response=eli_response,
                    sentiment_score=round(sentiment_score, 2),
                    sentiment_label=sentiment_label,
                    mood_tags=mood_tag,
                    created_at=entry_timestamp
                )

                day_entries.append(entry)
                db.add(entry)

            entries_created += num_checkins
            total_entries += num_checkins

            print(f"  Day {day_offset + 1} ({base_date.strftime('%Y-%m-%d')}): {num_checkins} check-ins")

        db.commit()
        print(f"\n>> Created {total_entries} mood entries across 14 days (avg {total_entries/14:.1f} per day)")

        print("\n" + "=" * 70)
        print("SEEDING COMPLETE!")
        print("=" * 70)
        print("\nTest Account Credentials:")
        print("  Username: testuser")
        print("  Password: password123")
        print("  Email: test@example.com")
        print("\nData Summary:")
        print(f"  • 14 days of mood tracking data")
        print(f"  • {total_entries} total check-ins (1-20 per day)")
        print(f"  • Average {total_entries/14:.1f} check-ins per day")
        print(f"  • Mix of positive, neutral, and negative moods")
        print(f"  • Realistic conversation history with Eli")
        print(f"  • Timestamps spread throughout each day")
        print("\nYou can now log in with these credentials to see the data!")
        print("=" * 70)

    except Exception as e:
        print(f"\nERROR: Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
