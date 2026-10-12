import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-farm-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-farm-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-farm-800 text-xl">AI Farm Guardian</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-earth-800">Welcome back</h1>
          <p className="text-sm text-earth-800/60 mt-1 mb-6">Log in to your farm dashboard</p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Email</label>
              <input type="email" required className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farm.com" />
            </div>
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Password</label>
              <input type="password" required className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-earth-800/60 mt-5">
          Don't have an account? <Link to="/register" className="text-farm-700 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  )
}
