import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name}! 🌾`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, full_name) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { email, password, full_name })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      toast.success(`Welcome to AI Farm Guardian, ${res.data.user.full_name}! 🌱`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateApiKeys = async (keys) => {
    try {
      await api.post('/auth/update-keys', keys)
      const updatedUser = { ...user, ...keys }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      toast.success('API keys updated successfully!')
      return { success: true }
    } catch (err) {
      toast.error('Failed to update API keys')
      return { success: false }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateApiKeys }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
