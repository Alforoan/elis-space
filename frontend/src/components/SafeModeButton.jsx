import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import axios from '../config/axios'
import './SafeModeButton.css'

function SafeModeButton({ safeMode, onToggle }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSafeModeClick = async () => {
    if (safeMode) {
      // Trying to unlock - show password modal
      setShowPasswordModal(true)
      setPassword('')
      setError('')
    } else {
      // Enabling safe mode - no password needed
      onToggle(true)

      // Save to database
      try {
        await axios.put('/api/settings', {
          safe_mode: true
        })
      } catch (error) {
        console.error('Error saving safe mode to database:', error)
      }
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify password with backend
      const response = await axios.post('/api/auth/verify-password', {
        password: password
      })

      if (response.data.valid) {
        // Password correct - unlock safe mode
        onToggle(false)
        setShowPasswordModal(false)
        setPassword('')

        // Save to database
        try {
          await axios.put('/api/settings', {
            safe_mode: false
          })
        } catch (error) {
          console.error('Error saving safe mode to database:', error)
        }
      } else {
        setError('Incorrect password')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Incorrect password')
      } else {
        setError('Error verifying password')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
  }

  return (
    <>
      <button
        className={`safe-mode-btn ${safeMode ? 'active' : ''}`}
        onClick={handleSafeModeClick}
        title={safeMode ? 'Safe Mode Active - Click to unlock' : 'Enable Safe Mode'}
      >
        <span className="safe-mode-icon">{safeMode ? '🔒' : '🔓'}</span>
        <span className="safe-mode-text">Safe Mode</span>
      </button>

      {showPasswordModal && ReactDOM.createPortal(
        <div className="password-modal-overlay" onClick={handleCancel}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h3>Enter Password to Unlock</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="password-input-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus
                  disabled={loading}
                  className="password-input"
                />
              </div>
              {error && <div className="password-error">{error}</div>}
              <div className="password-modal-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="unlock-btn"
                  disabled={loading || !password}
                >
                  {loading ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default SafeModeButton
