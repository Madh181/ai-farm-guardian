import { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'

const CAT_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '🚨' },
  HIGH:     { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '⚠️' },
  WARNING:  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⚡' },
  INFO:     { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️' },
  WEATHER:  { color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc', icon: '🌦️' },
  ALERT:    { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🔔' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/alerts/')
      setNotifications(res.data)
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => api.patch(`/alerts/${n.id}/read`)))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('All notifications marked as read')
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="section-title">🔔 Notifications</h1>
          <p className="section-subtitle">Smart alerts for critical diseases, weather warnings, and treatment reminders</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-xs py-1.5">
            <CheckCheck size={13} /> Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner w-10 h-10" style={{ borderWidth: 3 }} /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state metric-card">
          <div className="empty-state-icon"><Bell size={32} className="text-green-300" /></div>
          <h2 className="text-base font-bold text-green-900 mb-2">All Clear!</h2>
          <p className="text-gray-400 text-sm">No notifications yet. Alerts will appear here automatically when critical diseases are detected or weather warnings occur.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const cfg = CAT_CONFIG[n.category] || CAT_CONFIG.ALERT
            return (
              <div
                key={n.id}
                className={`metric-card transition-all cursor-pointer ${!n.is_read ? 'border-l-4' : 'opacity-70'}`}
                style={!n.is_read ? { borderLeftColor: cfg.color } : {}}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cfg.bg }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-gray-900">{n.title}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                          {n.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                    <div className="text-[10px] text-gray-400 mt-1.5">
                      {new Date(n.created_at).toLocaleString()}
                      {!n.is_read && <span className="ml-2 text-green-500">· Click to mark read</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
