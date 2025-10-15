import os
from openai import OpenAI
from textblob import TextBlob
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

class EliAI:
    def __init__(self):
        self.client = openai
        self.system_prompt = """You are Eli, a compassionate and empathetic AI companion supporting individuals during their reentry period after incarceration. Your role is to:

1. Listen with genuine empathy and without judgment
2. Help users reflect on and understand their emotions
3. Ask gentle follow-up questions to encourage deeper reflection
4. Provide supportive and encouraging responses
5. Recognize emotional patterns and validate their feelings
6. Keep responses warm, conversational, and concise (2-4 sentences typically)
7. Never give clinical advice, but always show care and understanding

Your goal is to create a safe space for emotional expression and self-reflection."""

    def analyze_sentiment(self, text):
        """Analyze sentiment using OpenAI for more accurate emotional understanding"""
        try:
            # Use OpenAI to understand emotional tone more accurately
            prompt = f"""Analyze the emotional sentiment of this message on a scale from -1 (very negative) to 1 (very positive).

Message: "{text}"

Respond with ONLY a JSON object in this exact format:
{{"score": <number between -1 and 1>, "reasoning": "<brief explanation>"}}

Examples:
- "Things are going well" -> {{"score": 0.7, "reasoning": "Positive outlook"}}
- "I'm feeling overwhelmed" -> {{"score": -0.6, "reasoning": "Stressed and struggling"}}
- "Feeling anxious" -> {{"score": -0.5, "reasoning": "Worried and uneasy"}}
- "I need someone to talk to" -> {{"score": -0.3, "reasoning": "Seeking support, mild distress"}}"""

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert at understanding emotional tone and sentiment in text."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=100,
                temperature=0.3  # Lower temperature for more consistent results
            )

            result = json.loads(response.choices[0].message.content)
            polarity = float(result.get("score", 0))

            # Classify based on polarity
            if polarity > 0.15:
                label = "positive"
            elif polarity < -0.15:
                label = "negative"
            else:
                label = "neutral"

            # Normalize score to 0-1 range
            score = (polarity + 1) / 2

            return {
                "score": round(score, 2),
                "label": label,
                "polarity": round(polarity, 2)
            }

        except Exception as e:
            # Fallback to TextBlob if OpenAI fails
            print(f"OpenAI sentiment failed, using TextBlob: {e}")
            try:
                blob = TextBlob(text)
                polarity = blob.sentiment.polarity

                if polarity > 0.05:
                    label = "positive"
                elif polarity < -0.05:
                    label = "negative"
                else:
                    label = "neutral"

                score = (polarity + 1) / 2

                return {
                    "score": round(score, 2),
                    "label": label,
                    "polarity": round(polarity, 2)
                }
            except:
                return {
                    "score": 0.5,
                    "label": "neutral",
                    "polarity": 0.0
                }

    def get_mood_tags(self, sentiment_data):
        """Generate mood tags based on sentiment with more granular categories"""
        label = sentiment_data.get("label", "neutral")
        polarity = sentiment_data.get("polarity", 0)

        if label == "positive":
            if polarity > 0.7:
                return "joyful, optimistic"
            elif polarity > 0.4:
                return "hopeful, encouraged"
            else:
                return "content, stable"
        elif label == "negative":
            if polarity < -0.7:
                return "overwhelmed, distressed"
            elif polarity < -0.4:
                return "struggling, anxious"
            else:
                return "uncertain, low"
        else:
            return "calm, reflective"

    def chat(self, user_message, conversation_history=None):
        """Generate empathetic response from Eli"""
        try:
            messages = [{"role": "system", "content": self.system_prompt}]

            if conversation_history:
                for entry in conversation_history[-5:]:
                    messages.append({"role": "user", "content": entry.get("user_message", "")})
                    messages.append({"role": "assistant", "content": entry.get("eli_response", "")})

            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_completion_tokens=200
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Error in chat: {e}")
            return "I'm here with you. Sometimes I need a moment to gather my thoughts. Could you share that again?"

    def generate_daily_summary(self, entries):
        """Generate a summary of the day's mood entries"""
        if not entries:
            return "No entries today yet. How are you feeling?"
        
        try:
            entry_texts = [f"- {entry.user_message}" for entry in entries]
            combined = "\n".join(entry_texts)
            
            prompt = f"""Based on these mood check-ins from today, provide a brief, supportive summary (2-3 sentences) that:
1. Acknowledges the emotional journey
2. Highlights any positive moments or growth
3. Offers gentle encouragement

Entries:
{combined}"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=150
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            return "You've checked in multiple times today. That shows real commitment to understanding yourself better."

    def generate_weekly_insights(self, entries):
        """Generate insights from a week of entries"""
        if not entries:
            return "Start tracking your mood to see patterns and insights over time."
        
        try:
            positive_count = sum(1 for e in entries if e.sentiment_label == "positive")
            negative_count = sum(1 for e in entries if e.sentiment_label == "negative")
            total = len(entries)
            
            sample_entries = [f"- {e.user_message[:100]}" for e in entries[:10]]
            combined = "\n".join(sample_entries)
            
            prompt = f"""Based on {total} mood entries this week ({positive_count} positive, {negative_count} negative), provide encouraging insights (3-4 sentences) that:
1. Recognize patterns or emotional themes
2. Celebrate progress and resilience
3. Offer perspective on the week

Sample entries:
{combined}"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=200
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            return f"You've made {len(entries)} entries this week. Each one is a step toward better self-understanding."

eli = EliAI()
