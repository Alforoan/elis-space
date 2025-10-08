import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import '../styles/Chat.css'

function Chat() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadRecentEntries()
  }, [])

  const loadRecentEntries = async () => {
    try {
      const response = await axios.get('/api/entries/today')
      const entries = response.data.map(entry => ({
        user: entry.user_message,
        eli: entry.eli_response,
        sentiment: entry.sentiment_label,
        tags: entry.mood_tags
      }))
      setMessages(entries)
    } catch (error) {
      console.error('Error loading entries:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue
    setInputValue('')
    setIsLoading(true)

    setMessages(prev => [...prev, { user: userMessage, eli: null }])

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage
      })

      const { eli_response, sentiment_label, mood_tags } = response.data

      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          user: userMessage,
          eli: eli_response,
          sentiment: sentiment_label,
          tags: mood_tags
        }
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          user: userMessage,
          eli: "I'm having trouble connecting right now. Please try again.",
          sentiment: 'neutral',
          tags: ''
        }
      ])
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
      <div className="chat-header">
        <h2>Chat with Eli</h2>
        <p>Share how you're feeling. Eli is here to listen.</p>
      </div>

      {messages.length === 0 && (
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
      )}

      <div className="messages-container">
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
