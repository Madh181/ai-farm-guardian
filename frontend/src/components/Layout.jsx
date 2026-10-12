import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Tractor, ScanLine, Flame, Sparkles, CloudSun,
  Wallet, MessageCircle, ClipboardCheck, Bell, User, LogOut, Menu, X, Leaf
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/farms', label: 'My Farms', icon: Tractor },
  { to: '/scanner', label: 'Crop Scanner', icon: ScanLine },
  { to: '/priority', label: 'Priority Center', icon: Flame },
  { to: '/rescue', label: 'AI Rescue Planner', icon: Sparkles },
  { to: '/weather', label: 'Weather', icon: CloudSun },
  { to: '/economic', label: 'Economic Risk', icon: Wallet },
  { to: '/assistant', label: 'AI Farm Assistant', icon: MessageCircle },
  { to: '/treatments', label: 'Treatment Tracker', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
]

const MOBILE_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/scanner', label: 'Scan', icon: ScanLine },
  { to: '/priority', label: 'Priority', icon: Flame },
  { to: '/assistant', label: 'Assistant', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-farm-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-farm-100 h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-farm-100">
          <div className="w-9 h-9 rounded-xl bg-farm-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-farm-800 leading-tight">AI Farm Guardian</p>
            <p className="text-[11px] text-farm-500 leading-tight">Smart Crop Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-farm-600 text-white shadow-sm'
                    : 'text-earth-800/70 hover:bg-farm-50 hover:text-farm-700'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-farm-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-farm-100 flex items-center justify-center text-farm-700 font-bold">
              {(user?.full_name || user?.name || 'M')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name || user?.name || 'Madhumitha'}</p>
              <p className="text-xs text-earth-800/50 truncate">{user?.email || 'madhu@gmail.com'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-1 flex items-center gap-2 w-full px-3 py-2 text-sm text-earth-800/60 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-farm-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-farm-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-farm-800 text-sm">AI Farm Guardian</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-farm-700">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-farm-800">Menu</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-farm-600 text-white' : 'text-earth-800/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-red-600">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-farm-100 flex items-center justify-around py-2">
        {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
                isActive ? 'text-farm-700' : 'text-earth-800/40'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
