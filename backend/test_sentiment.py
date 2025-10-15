"""
Test sentiment analysis for common phrases
"""
from textblob import TextBlob

# Test phrases from the Chat.jsx quick prompts
test_phrases = [
    "I'm feeling overwhelmed today",
    "Things are going well",
    "I need someone to talk to",
    "Feeling anxious"
]

print("=" * 70)
print("SENTIMENT ANALYSIS TEST")
print("=" * 70)

for phrase in test_phrases:
    blob = TextBlob(phrase)
    polarity = blob.sentiment.polarity

    # Old thresholds (0.3)
    if polarity > 0.3:
        old_label = "positive"
    elif polarity < -0.3:
        old_label = "negative"
    else:
        old_label = "neutral"

    # New thresholds (0.05)
    if polarity > 0.05:
        new_label = "positive"
    elif polarity < -0.05:
        new_label = "negative"
    else:
        new_label = "neutral"

    print(f"\nPhrase: \"{phrase}\"")
    print(f"  Polarity: {polarity:.3f}")
    print(f"  Old classification (>0.3): {old_label}")
    print(f"  New classification (>0.05): {new_label}")

print("\n" + "=" * 70)
