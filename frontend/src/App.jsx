import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotificationModal from './components/NotificationModal'
import './App.css'
import axios from './config/axios'

function AppContent() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('home')
  const [reminderTimer, setReminderTimer] = useState(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [user, setUser] = useState(null)

  // Set active tab based on current URL path
  useEffect(() => {
    const path = location.pathname
    if (path === '/') setActiveTab('home')
    else if (path === '/chat') setActiveTab('chat')
    else if (path === '/dashboard') setActiveTab('dashboard')
    else if (path === '/settings') setActiveTab('settings')
  }, [location])

  // Setup axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      // Clear any guest data cache when authenticated
      localStorage.removeItem('dashboardData')
      localStorage.removeItem('chatMessages')
    }
  }, [])

  const showNotification = () => {
    setShowNotificationModal(true)
  }

  const handleNotificationClose = () => {
    setShowNotificationModal(false)
  }

  const scheduleDailyReminder = (reminderTime) => {
    const [hours, minutes] = reminderTime.split(':')
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const timeUntilReminder = scheduledTime - now

    console.log('Scheduling modal notification:', {
      reminderTime,
      now: now.toLocaleString(),
      scheduledTime: scheduledTime.toLocaleString(),
      timeUntilReminder: `${Math.floor(timeUntilReminder / 1000 / 60)} minutes (${Math.floor(timeUntilReminder / 1000)} seconds)`,
      willShowToday: timeUntilReminder > 0 ? 'Yes' : 'No (time has passed)'
    })

    // If time is in the future (even if just seconds away), schedule it
    if (timeUntilReminder > 0) {
      return setTimeout(() => {
        console.log('Showing scheduled modal notification now!')
        showNotification()

        // Schedule the next reminder for tomorrow
        scheduleDailyReminder(reminderTime)
      }, timeUntilReminder)
    } else {
      console.log('Reminder time has already passed today. Will schedule for tomorrow.')
      // Time has passed, schedule for tomorrow
      const tomorrowTime = new Date()
      tomorrowTime.setDate(tomorrowTime.getDate() + 1)
      tomorrowTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      const timeUntilTomorrow = tomorrowTime - now

      return setTimeout(() => {
        console.log('Showing scheduled modal notification now!')
        showNotification()

        // Schedule the next reminder for tomorrow
        scheduleDailyReminder(reminderTime)
      }, timeUntilTomorrow)
    }
  }

  useEffect(() => {
    let timer = null

    // Load settings and schedule notifications
    const loadAndScheduleNotifications = async () => {
      try {
        const response = await axios.get('/api/settings')
        const settings = response.data

        // Clear existing timer
        if (reminderTimer) {
          clearTimeout(reminderTimer)
          console.log('Cleared previous reminder timer')
        }

        // Schedule reminder if enabled
        if (settings.reminder_enabled) {
          console.log('Loading notification schedule...')
          timer = scheduleDailyReminder(settings.reminder_time)
          setReminderTimer(timer)
        } else {
          console.log('Reminders are disabled')
        }
      } catch (error) {
        console.error('Error loading settings for notifications:', error)
      }
    }

    loadAndScheduleNotifications()

    // Reload settings every 10 seconds to catch updates
    const reloadInterval = setInterval(() => {
      loadAndScheduleNotifications()
    }, 10000)

    // Cleanup on unmount
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      clearInterval(reloadInterval)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Eli's Space</h1>
          <p className="tagline">Check in with Eli</p>
        </div>
        {user && (
          <div className="user-info">
            <span className="username">@{user.username}</span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('dashboardData')
                localStorage.removeItem('chatMessages')
                window.location.reload()
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <nav className="app-nav">
        <Link
          to="/"
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => setActiveTab('home')}
        >
          Home
        </Link>
        <Link
          to="/chat"
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Chat with Eli
        </Link>
        <Link
          to="/dashboard"
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </Link>
        <Link
          to="/settings"
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => {
            setActiveTab('settings')
          }}
        >
          Settings
        </Link>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home setActiveTab={setActiveTab} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings setActiveTab={setActiveTab}/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={handleNotificationClose}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        title="Time to check in with Eli 💙"
        message="How are you feeling today? Take a moment to reflect and share with Eli."
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
