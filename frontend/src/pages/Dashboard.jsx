import React, { useState, useEffect } from 'react'
import axios from '../config/axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import '../styles/Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [entries, setEntries] = useState([])
  const [dailySummary, setDailySummary] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      // AUTHENTICATED USER: Clear any cached data, NEVER load from localStorage
      console.log('🔐 Authenticated user - clearing cached data, will ONLY load from database')
      localStorage.removeItem('dashboardData')
      setLoading(true)
      // State remains empty until API response arrives from database
    } else {
      // GUEST USER: Load cached data if available for temporary storage
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
            setDailySummary(parsed.dailySummary)
            setWeeklySummary(parsed.weeklySummary)
          }
        } catch (error) {
          console.error('Error loading cached dashboard data:', error)
          setLoading(true)
        }
      } else {
        setLoading(true)
      }
    }

    // Always fetch fresh data from API (database for authenticated, filtered by user_id)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')

      console.log('📊 DASHBOARD: Loading data from database...', {
        authenticated: !!token,
        timestamp: new Date().toLocaleString()
      })

      // Fetch data from database (backend filters by user_id for authenticated users)
      const [statsRes, entriesRes, dailyRes, weeklyRes] = await Promise.all([
        axios.get('/api/stats/overview'),
        axios.get('/api/entries?days=7'),
        axios.get('/api/summary/daily'),
        axios.get('/api/summary/weekly')
      ])

      const freshData = {
        stats: statsRes.data,
        entries: entriesRes.data,
        dailySummary: dailyRes.data,
        weeklySummary: weeklyRes.data
      }

      console.log('📊 DASHBOARD: Data received from database:', {
        authenticated: !!token,
        entriesCount: freshData.entries.length
      })

      // Update state with fresh data from database
      setStats(freshData.stats)
      setEntries(freshData.entries)
      setDailySummary(freshData.dailySummary)
      setWeeklySummary(freshData.weeklySummary)
      setLoading(false)

      // GUEST USER ONLY: Cache data to localStorage for temporary storage
      if (!token && !localStorage.getItem('token')) {
        console.log('💾 Guest user - caching data to localStorage')
        localStorage.setItem('dashboardData', JSON.stringify(freshData))
      } else {
        console.log('🔐 Authenticated user - NOT caching to localStorage (database is source of truth)')
        localStorage.removeItem('dashboardData')
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const prepareChartData = () => {
    const dailyData = {}
    
    entries.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      if (!dailyData[date]) {
        dailyData[date] = { date, positive: 0, neutral: 0, negative: 0, total: 0 }
      }
      
      if (entry.sentiment_label === 'positive') dailyData[date].positive++
      else if (entry.sentiment_label === 'negative') dailyData[date].negative++
      else dailyData[date].neutral++
      
      dailyData[date].total++
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    )
  }

  const chartData = prepareChartData()
  const pieData = prepareSentimentPieData()

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Mood Dashboard</h2>
        <p>Tracking your emotional journey</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_entries || 0}</div>
          <div className="stat-label">Total Check-ins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.entries_this_week || 0}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.entries_today || 0}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{((stats?.avg_sentiment_this_week || 0.5) * 100).toFixed(0)}%</div>
          <div className="stat-label">Mood Score</div>
        </div>
      </div>

      {dailySummary && dailySummary.entry_count > 0 && (
        <div className="summary-card">
          <h3>Today's Summary</h3>
          <p className="summary-text">{dailySummary.summary}</p>
          <div className="summary-meta">{dailySummary.entry_count} check-ins today</div>
        </div>
      )}

      {weeklySummary && weeklySummary.entry_count > 0 && (
        <div className="summary-card">
          <h3>This Week's Insights</h3>
          <p className="summary-text">{weeklySummary.insights}</p>
          <div className="summary-meta">{weeklySummary.entry_count} check-ins this week</div>
        </div>
      )}

      <div className="charts-grid">
        {chartData.length > 0 && (
          <div className="chart-card">
            <h3>Daily Mood Trends (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#4ade80" name="Positive" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="#94a3b8" name="Neutral" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#f87171" name="Negative" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="chart-card">
            <h3>Check-ins Per Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && weeklySummary.entry_count > 0 && (
          <div className="chart-card">
            <h3>Weekly Mood Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
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

      {entries.length === 0 && (
        <div className="empty-state">
          <h3>No mood entries yet</h3>
          <p>Start chatting with Eli to see your emotional journey visualized here.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
