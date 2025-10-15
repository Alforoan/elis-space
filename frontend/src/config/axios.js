import axios from 'axios'

// Configure axios to use the backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
})

// Add request interceptor to automatically include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')

    // If token exists, add it to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 Request with auth token to:', config.url)
    } else {
      console.log('👤 Guest request to:', config.url)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, token is invalid - clear it and redirect to login
    if (error.response && error.response.status === 401) {
      console.log('🚫 Unauthorized - clearing token')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Optionally redirect to login
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

console.log('🔧 Axios configured with base URL:', API_BASE_URL)
console.log('🔐 Auth interceptor enabled - will automatically send tokens')

export default axiosInstance
