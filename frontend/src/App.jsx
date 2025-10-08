import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>Mood Tracker</h1>
          <p className="tagline">Check in with Eli</p>
        </header>
        
        <nav className="app-nav">
          <Link 
            to="/" 
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
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </Link>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
