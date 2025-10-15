import sqlite3

# Connect to the database
conn = sqlite3.connect('mood_tracker.db')
cursor = conn.cursor()

# Check users
print("=== USERS ===")
cursor.execute("SELECT id, username, email FROM users")
users = cursor.fetchall()
for user in users:
    print(f"User ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")

print("\n=== MOOD ENTRIES ===")
cursor.execute("SELECT id, user_id, user_message, sentiment_label, created_at FROM mood_entries ORDER BY created_at DESC LIMIT 10")
entries = cursor.fetchall()
for entry in entries:
    print(f"Entry ID: {entry[0]}, User ID: {entry[1]}, Message: {entry[2][:50]}..., Sentiment: {entry[3]}, Created: {entry[4]}")

print("\n=== STATS ===")
cursor.execute("SELECT COUNT(*) FROM mood_entries")
total = cursor.fetchone()[0]
print(f"Total entries in database: {total}")

cursor.execute("SELECT user_id, COUNT(*) FROM mood_entries GROUP BY user_id")
per_user = cursor.fetchall()
for user_id, count in per_user:
    print(f"User ID {user_id}: {count} entries")

conn.close()
