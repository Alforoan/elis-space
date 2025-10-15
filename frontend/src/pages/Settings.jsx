import React, { useState, useEffect } from 'react'
import axios from '../config/axios'
import '../styles/Settings.css'
import NotificationModal from '../components/NotificationModal'

function Settings({setActiveTab}) {
  const [settings, setSettings] = useState({
    reminder_enabled: true,
    reminder_time: '09:00',
    privacy_mode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings')
      setSettings(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage('')

    try {
      await axios.put('/api/settings', settings)

      // Log notification schedule info
      if (settings.reminder_enabled) {
        const [hours, minutes] = settings.reminder_time.split(':')
        const now = new Date()
        const scheduledTime = new Date()
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        const timeUntilReminder = scheduledTime - now
        const willShowToday = timeUntilReminder > 0

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📅 NOTIFICATION SCHEDULE')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('⏰ Current time:', now.toLocaleString())
        console.log('🔔 Reminder scheduled for:', scheduledTime.toLocaleString())

        if (willShowToday) {
          console.log('⏳ Time until reminder:', Math.floor(timeUntilReminder / 1000 / 60), 'minutes (', Math.floor(timeUntilReminder / 1000), 'seconds )')
          console.log('📆 Will show TODAY')
        } else {
          const tomorrow = new Date(scheduledTime)
          tomorrow.setDate(tomorrow.getDate() + 1)
          const timeUntilTomorrow = tomorrow - now
          console.log('⏳ Time has passed today')
          console.log('📆 Will show TOMORROW at:', tomorrow.toLocaleString())
          console.log('⏳ Time until tomorrow:', Math.floor(timeUntilTomorrow / 1000 / 60), 'minutes')
        }

        console.log('✅ Reminder enabled:', settings.reminder_enabled)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      } else {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔕 Reminders are DISABLED')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }

      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleTimeChange = (e) => {
    setSettings(prev => ({
      ...prev,
      reminder_time: e.target.value
    }))
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Customize your mood tracking experience</p>
      </div>

      <div className="settings-section">
        <h3>Reminders</h3>
        <div className="setting-item">
          <div className="setting-info">
            <label>Daily Check-in Reminders</label>
            <p className="setting-description">Get a modal reminder to check in with Eli</p>
          </div>
          <button
            className={`toggle-btn ${settings.reminder_enabled ? 'active' : ''}`}
            onClick={() => handleToggle('reminder_enabled')}
          >
            {settings.reminder_enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {settings.reminder_enabled && (
          <>
            <div className="setting-item">
              <div className="setting-info">
                <label>Reminder Time</label>
                <p className="setting-description">When would you like to be reminded?</p>
              </div>
              <input
                type="time"
                value={settings.reminder_time}
                onChange={handleTimeChange}
                className="time-input"
              />
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <label>Test Reminder</label>
                <p className="setting-description">Preview the reminder modal</p>
              </div>
              <button
                className="test-notification-btn"
                onClick={() => {
                  setShowTestModal(true)
                  setSaveMessage('Modal opened!')
                  setTimeout(() => setSaveMessage(''), 2000)
                }}
              >
                Test Modal
              </button>
            </div>
          </>
        )}
      </div>

      <div className="settings-section">
        <h3>Privacy</h3>
        <div className="setting-item">
          <div className="setting-info">
            <label>Privacy Mode</label>
            <p className="setting-description">Hide sensitive details when app is in background</p>
          </div>
          <button 
            className={`toggle-btn ${settings.privacy_mode ? 'active' : ''}`}
            onClick={() => handleToggle('privacy_mode')}
          >
            {settings.privacy_mode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <div className="about-content">
          <p>Eli's Space helps you reflect on and manage your emotions through conversations with Eli, your supportive AI companion.</p>
          <p>Your data is stored locally and privately. Conversations with Eli use AI to provide empathetic responses and detect emotional patterns.</p>
          <p className="disclaimer"><strong>Important:</strong> Eli is an AI companion and is not a substitute for professional mental health care. If you are experiencing a mental health crisis or need professional support, please contact a licensed therapist, counselor, or crisis helpline.</p>
        </div>
      </div>

      <div className="save-section">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="save-button"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
      </div>

      <NotificationModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        setActiveTab={setActiveTab}
        title="Time to check in with Eli 💙"
        message="How are you feeling today? Take a moment to reflect and share with Eli."
      />
    </div>
  )
}

export default Settings
