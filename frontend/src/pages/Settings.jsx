import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Settings.css'

function Settings() {
  const [settings, setSettings] = useState({
    reminder_enabled: true,
    reminder_time: '09:00',
    privacy_mode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

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
            <p className="setting-description">Get a gentle reminder to check in with Eli</p>
          </div>
          <button 
            className={`toggle-btn ${settings.reminder_enabled ? 'active' : ''}`}
            onClick={() => handleToggle('reminder_enabled')}
          >
            {settings.reminder_enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {settings.reminder_enabled && (
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
          <p>Mood Tracker helps you reflect on and manage your emotions through conversations with Eli, your supportive AI companion.</p>
          <p>Your data is stored locally and privately. Conversations with Eli use AI to provide empathetic responses and detect emotional patterns.</p>
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
    </div>
  )
}

export default Settings
