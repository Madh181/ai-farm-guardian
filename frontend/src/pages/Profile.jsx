import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Key, Eye, EyeOff, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout, updateApiKeys } = useAuth()
  const navigate = useNavigate()
  const [groqKey, setGroqKey] = useState(user?.groq_api_key || '')
  const [weatherKey, setWeatherKey] = useState(user?.openweather_api_key || '')
  const [showGroq, setShowGroq] = useState(false)
  const [showWeather, setShowWeather] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSaveKeys = async () => {
    setSaving(true)
    await updateApiKeys({ groq_api_key: groqKey, openweather_api_key: weatherKey })
    setSaving(false)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="p-5 animate-fade-up max-w-2xl">
      <h1 className="section-title mb-1">👤 Farmer Profile</h1>
      <p className="section-subtitle mb-5">Manage your account and API key credentials</p>

      {/* Profile Info */}
      <div className="metric-card mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-2xl font-bold text-white">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{user?.full_name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-xs text-green-500 font-medium mt-0.5">🌾 AI Farm Guardian Member</div>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            { icon: User, label: 'Full Name', value: user?.full_name },
            { icon: Mail, label: 'Email', value: user?.email },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <f.icon size={15} className="text-green-500" />
              <div>
                <div className="text-[10px] text-gray-400">{f.label}</div>
                <div className="text-sm font-medium text-gray-800">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="metric-card mb-5">
        <div className="text-sm font-bold text-gray-800 mb-1">🔑 API Key Configuration</div>
        <p className="text-xs text-gray-400 mb-4">
          Configure your API keys to enable Groq AI rescue planning and live weather data. Without keys, the system uses built-in AI models and Open-Meteo's free weather API.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1.5">
              <span className="text-purple-500">🤖</span> Groq API Key
              <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-100">AI Rescue Planner + Farm Assistant</span>
            </label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showGroq ? 'text' : 'password'}
                value={groqKey}
                onChange={e => setGroqKey(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxx..."
                className="farm-input pl-8 pr-9"
              />
              <button onClick={() => setShowGroq(!showGroq)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showGroq ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Get your free key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-purple-500 underline">console.groq.com</a> — Llama 3.3 70B access is free.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1.5">
              <span className="text-blue-400">🌦️</span> OpenWeatherMap API Key
              <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">Optional — Free fallback active</span>
            </label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showWeather ? 'text' : 'password'}
                value={weatherKey}
                onChange={e => setWeatherKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="farm-input pl-8 pr-9"
              />
              <button onClick={() => setShowWeather(!showWeather)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showWeather ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Without this key, the system uses <strong>Open-Meteo (free, no key needed)</strong> automatically for live weather.
            </p>
          </div>
        </div>

        <button onClick={handleSaveKeys} disabled={saving} className="btn-primary mt-4">
          {saving ? <span className="spinner" /> : <Key size={14} />} Save API Keys
        </button>
      </div>

      {/* Logout */}
      <div className="metric-card">
        <div className="text-sm font-bold text-gray-800 mb-2">Account Actions</div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium w-full">
          <LogOut size={15} /> Sign Out from AI Farm Guardian
        </button>
      </div>
    </div>
  )
}
