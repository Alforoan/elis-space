import React from 'react'
import './SafeModeLockScreen.css'

function SafeModeLockScreen({ onUnlock }) {
  return (
    <div className="safe-mode-lock-screen">
      <div className="lock-screen-content">
        <div className="lock-icon">🔒</div>
        <h2 className="lock-title">Safe Mode Active</h2>
        <p className="lock-message">
          Your content is protected. Click the Safe Mode button in the navbar to unlock and view this page.
        </p>
        <div className="lock-hint">
          Look for the <span className="lock-emoji">🔒</span> button in the top navigation bar
        </div>
      </div>
    </div>
  )
}

export default SafeModeLockScreen
