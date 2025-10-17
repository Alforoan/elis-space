import React, { useState, useEffect, useRef } from 'react'
import axios from '../config/axios'
import SafeModeLockScreen from '../components/SafeModeLockScreen'
import '../styles/Chat.css'

function Chat({ safeMode }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Skip data loading if safe mode is active
    if (safeMode) {
      console.log('🔒 Safe mode active - skipping chat data load')
      setInitialLoading(false)
      return
    }

    loadRecentEntries()
  }, [safeMode])

  const loadRecentEntries = async () => {
    try {
      setInitialLoading(true)
      const token = localStorage.getItem('token')

      if (token) {
        // AUTHENTICATED USER: ALWAYS load from database, NEVER from localStorage
        console.log('🔐 Authenticated user - loading chat messages from database ONLY')
        const response = await axios.get('/api/entries/today')
        const entries = response.data.map(entry => ({
          user: entry.user_message,
          eli: entry.eli_response,
          sentiment: entry.sentiment_label,
          tags: entry.mood_tags
        }))
        setMessages(entries)
      } else {
        // GUEST USER: Load from localStorage for temporary storage
        console.log('👤 Guest user - loading chat messages from localStorage')
        const cachedMessages = localStorage.getItem('chatMessages')
        if (cachedMessages) {
          try {
            const parsed = JSON.parse(cachedMessages)
            setMessages(parsed)
          } catch (error) {
            console.error('Error parsing cached messages:', error)
            setMessages([])
          }
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error)
      setMessages([])
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const token = localStorage.getItem('token')
    const userMessage = inputValue
    setInputValue('')
    setIsLoading(true)

    setMessages(prev => [...prev, { user: userMessage, eli: null }])

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage
      })

      const { eli_response, sentiment_label, mood_tags } = response.data

      const newMessage = {
        user: userMessage,
        eli: eli_response,
        sentiment: sentiment_label,
        tags: mood_tags
      }

      setMessages(prev => {
        const updatedMessages = [
          ...prev.slice(0, -1),
          newMessage
        ]

        // GUEST USER ONLY: Save to localStorage for temporary storage
        if (!token) {
          console.log('👤 Guest user - saving chat message to localStorage')
          localStorage.setItem('chatMessages', JSON.stringify(updatedMessages))
        } else {
          console.log('🔐 Authenticated user - message saved to database (via API), NOT to localStorage')
        }

        return updatedMessages
      })
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        user: userMessage,
        eli: "I'm having trouble connecting right now. Please try again.",
        sentiment: 'neutral',
        tags: ''
      }

      setMessages(prev => {
        const updatedMessages = [
          ...prev.slice(0, -1),
          errorMessage
        ]

        // GUEST USER ONLY: Save error message to localStorage for temporary storage
        if (!token) {
          console.log('👤 Guest user - saving error message to localStorage')
          localStorage.setItem('chatMessages', JSON.stringify(updatedMessages))
        }

        return updatedMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickPrompts = [
    "I'm feeling overwhelmed today",
    "Things are going well",
    "I need someone to talk to",
    "Feeling anxious"
  ]

  return (
    <div className="chat-container">
      {safeMode && <SafeModeLockScreen />}

      <div className="chat-header">
        <h2>Chat with Eli</h2>
        <p>Share how you're feeling. Eli is here to listen.</p>
      </div>

      <div className="messages-container">
        {initialLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Hello, I'm Eli</h3>
            <p>I'm here to support you during your journey. Feel free to share how you're feeling, what's on your mind, or anything you'd like to talk about. There's no judgment here, just a safe space for you.</p>
            <div className="quick-prompts">
              <p>Not sure where to start? Try one of these:</p>
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="quick-prompt-btn"
                  onClick={() => setInputValue(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, index) => (
          <div key={index} className="message-group">
            <div className="message user-message">
              <div className="message-content">{msg.user}</div>
              {msg.sentiment && (
                <div className={`sentiment-badge ${msg.sentiment}`}>
                  {msg.sentiment}
                </div>
              )}
            </div>
            {msg.eli && (
              <div className="message eli-message">
                <div className="eli-avatar">Eli</div>
                <div className="message-content">{msg.eli}</div>
              </div>
            )}
            {!msg.eli && isLoading && (
              <div className="message eli-message">
                <div className="eli-avatar">Eli</div>
                <div className="message-content loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type how you're feeling..."
          rows="3"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat
