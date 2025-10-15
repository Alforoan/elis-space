import axios from 'axios'

// Configure axios to use the backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Set the default base URL for all axios requests
axios.defaults.baseURL = API_BASE_URL

console.log('🔧 Axios configured with base URL:', API_BASE_URL)

export default axios
