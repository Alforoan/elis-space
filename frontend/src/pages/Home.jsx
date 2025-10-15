import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import '../styles/Home.css'

function Home({ setActiveTab }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [entries, setEntries] = useState([])
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  const handleChatClick = () => {
    if (setActiveTab) {
      setActiveTab('chat')
    }
    navigate('/chat')
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      // AUTHENTICATED USER: Clear cache, NEVER load from localStorage
      console.log('🔐 Authenticated user - will ONLY load from database')
      localStorage.removeItem('dashboardData')
      // State remains empty until API response arrives from database
    } else {
      // GUEST USER: Load from cache if available for temporary storage
      console.log('👤 Guest user - checking for cached data')
      const cachedData = localStorage.getItem('dashboardData')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          // Double check: only use cache if still not authenticated
          if (!localStorage.getItem('token')) {
            console.log('👤 Loading cached guest data')
            setStats(parsed.stats)
            setEntries(parsed.entries)
            setWeeklySummary(parsed.weeklySummary)
          }
        } catch (error) {
          console.error('Error loading cached data:', error)
        }
      }
    }

    // Always fetch fresh data from API (database for authenticated, filtered by user_id)
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      const token = localStorage.getItem('token')

      console.log('📡 HOME: Loading data from database...', {
        authenticated: !!token,
        timestamp: new Date().toLocaleString()
      })

      // Fetch data from database (backend filters by user_id for authenticated users)
      const [statsRes, entriesRes, weeklyRes] = await Promise.all([
        axios.get('/api/stats/overview'),
        axios.get('/api/entries?days=7'),
        axios.get('/api/summary/weekly')
      ])

      const data = {
        stats: statsRes.data,
        entries: entriesRes.data,
        weeklySummary: weeklyRes.data
      }

      console.log('📡 HOME: Data received from database:', {
        authenticated: !!token,
        entriesCount: data.entries.length
      })

      // Update state with fresh data from database
      setStats(data.stats)
      setEntries(data.entries)
      setWeeklySummary(data.weeklySummary)

      // GUEST USER ONLY: Cache data to localStorage for temporary storage
      if (!token && !localStorage.getItem('token')) {
        console.log('💾 Guest user - caching data to localStorage')
        localStorage.setItem('dashboardData', JSON.stringify(data))
      } else {
        console.log('🔐 Authenticated user - NOT caching to localStorage (database is source of truth)')
        localStorage.removeItem('dashboardData')
      }
    } catch (error) {
      console.error('❌ HOME: Error loading home data:', error)
    }
  }

  const prepareChartData = () => {
    const dailyData = {}

    entries.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      if (!dailyData[date]) {
        dailyData[date] = { date, positive: 0, neutral: 0, negative: 0 }
      }

      if (entry.sentiment_label === 'positive') dailyData[date].positive++
      else if (entry.sentiment_label === 'negative') dailyData[date].negative++
      else dailyData[date].neutral++
    })

    return Object.values(dailyData).reverse()
  }

  const prepareSentimentPieData = () => {
    if (!weeklySummary) return []

    return [
      { name: 'Positive', value: weeklySummary.positive_count, color: '#4ade80' },
      { name: 'Neutral', value: weeklySummary.neutral_count, color: '#94a3b8' },
      { name: 'Negative', value: weeklySummary.negative_count, color: '#f87171' }
    ]
  }

  const chartData = prepareChartData()
  const pieData = prepareSentimentPieData()

  // For authenticated users: data comes from database ONLY
  // For guest users: data comes from localStorage/API
  const hasData = entries.length > 0

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Eli's Space</h1>
        <p className="hero-subtitle">Your personal companion for emotional well-being</p>
        <button
          className="chat-cta-button"
          onClick={handleChatClick}
        >
          Chat with Eli
        </button>

        {!isAuthenticated && (
          <div className="hero-auth-prompt">
            <p>Sign in to save your progress</p>
            <div className="hero-auth-buttons">
              <button onClick={() => navigate('/login')} className="hero-auth-btn">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="hero-auth-btn primary">
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>

      {/*
        Authenticated users: Show database data (or "Start Journey" if no data)
        Guest users: Show localStorage/API data (or "Start Journey" if no data)
      */}
      {hasData ? (
        <>
          <div className="stats-preview">
            <div className="stat-item">
              <div className="stat-number">{stats?.total_entries || 0}</div>
              <div className="stat-text">Total Check-ins</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats?.entries_this_week || 0}</div>
              <div className="stat-text">This Week</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{((stats?.avg_sentiment_this_week || 0.5) * 100).toFixed(0)}%</div>
              <div className="stat-text">Mood Score</div>
            </div>
          </div>

          <div className="home-charts">
            {chartData.length > 0 && (
              <div className="home-chart-card">
                <h3>Your Mood Journey</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="positive" stroke="#4ade80" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="negative" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {pieData.length > 0 && weeklySummary?.entry_count > 0 && (
              <div className="home-chart-card">
                <h3>This Week's Mood Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {weeklySummary && weeklySummary.entry_count > 0 && (
            <div className="insights-card">
              <h3>This Week's Insights</h3>
              <p className="insights-text">{weeklySummary.insights}</p>
              <div className="insights-meta">{weeklySummary.entry_count} check-ins this week</div>
            </div>
          )}
        </>
      ) : (
        <div className="welcome-message">
          <div className="welcome-icon">💙</div>
          <h2>Start Your Journey</h2>
          <p>Begin by chatting with Eli to track your emotions and gain valuable insights about your mental well-being.</p>
          <button
            className="chat-secondary-button"
            onClick={handleChatClick}
          >
            Start Your First Check-in
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
