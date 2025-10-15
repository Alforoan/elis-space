import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/NotificationModal.css'

function NotificationModal({ isOpen, onClose, title, message, setActiveTab, activeTab }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleCheckIn = () => {
    if (activeTab){
      console.log('active tab', activeTab)
    }
    if (setActiveTab) {
      console.log('setactive tab exists')
      setActiveTab('chat')
    }
    console.log('test')
    onClose()
    navigate('/chat')
  }

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <div className="notification-icon">💙</div>
          <h2>{title}</h2>
        </div>
        <div className="notification-modal-body">
          <p>{message}</p>
        </div>
        <div className="notification-modal-footer">
          <button className="notification-btn-primary" onClick={handleCheckIn}>
            Check in now
          </button>
          <button className="notification-btn-secondary" onClick={onClose}>
            Remind me later
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
