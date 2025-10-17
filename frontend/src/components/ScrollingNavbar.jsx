import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SafeModeButton from './SafeModeButton'
import './ScrollingNavbar.css'

function ScrollingNavbar({ user, onLogout, safeMode, onSafeModeToggle }) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('home')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Set active tab based on current URL path
  useEffect(() => {
    const path = location.pathname
    if (path === '/') setActiveTab('home')
    else if (path === '/chat') setActiveTab('chat')
    else if (path === '/dashboard') setActiveTab('dashboard')
    else if (path === '/settings') setActiveTab('settings')
  }, [location])

  // Handle scroll to show/hide navbar
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or at top - show navbar
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold - hide navbar
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null
  }

  return (
    <nav className={`scrolling-navbar ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">💙</span>
            <span className="brand-text">Eli's Space</span>
          </Link>
        </div>

        <div className="navbar-center">
          <Link
            to="/"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </Link>
          <Link
            to="/chat"
            className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat with Eli
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </Link>
        </div>

        <div className="navbar-right">
          {user && (
            <SafeModeButton safeMode={safeMode} onToggle={onSafeModeToggle} />
          )}
          {user ? (
            <div className="user-section">
              <span className="username">@{user.username}</span>
              <button className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-section">
              <Link to="/login" className="auth-link">Sign In</Link>
              <Link to="/signup" className="auth-link primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default ScrollingNavbar
