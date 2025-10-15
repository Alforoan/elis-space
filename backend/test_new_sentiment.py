"""
Test the new OpenAI-based sentiment analysis
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from eli_ai import eli

# Test phrases from the Chat.jsx quick prompts
test_phrases = [
    "I'm feeling overwhelmed today",
    "Things are going well",
    "I need someone to talk to",
    "Feeling anxious",
    "I'm so happy today!",
    "Everything is terrible",
    "Just checking in",
    "I accomplished something today",
    "I'm worried about tomorrow"
]

print("=" * 80)
print("IMPROVED SENTIMENT ANALYSIS TEST (OpenAI-based)")
print("=" * 80)

for phrase in test_phrases:
    result = eli.analyze_sentiment(phrase)
    mood_tags = eli.get_mood_tags(result)

    print(f"\nPhrase: \"{phrase}\"")
    print(f"  Polarity: {result['polarity']}")
    print(f"  Score: {result['score']} (0=negative, 0.5=neutral, 1=positive)")
    print(f"  Label: {result['label']}")
    print(f"  Mood Tags: {mood_tags}")

print("\n" + "=" * 80)
