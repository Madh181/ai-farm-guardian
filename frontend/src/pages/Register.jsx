import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, AlertCircle } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.phone)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-farm-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-farm-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-farm-800 text-xl">AI Farm Guardian</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-earth-800">Create your account</h1>
          <p className="text-sm text-earth-800/60 mt-1 mb-6">Start protecting your farm with AI</p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Full name</label>
              <input required className="input mt-1" value={form.name} onChange={update('name')} placeholder="Farmer name" />
            </div>
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Email</label>
              <input type="email" required className="input mt-1" value={form.email} onChange={update('email')} placeholder="you@farm.com" />
            </div>
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Phone (optional)</label>
              <input className="input mt-1" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="text-sm font-semibold text-earth-800/80">Password</label>
              <input type="password" required minLength={6} className="input mt-1" value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-earth-800/60 mt-5">
          Already have an account? <Link to="/login" className="text-farm-700 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  )
}
