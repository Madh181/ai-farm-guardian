import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyFarms from './pages/MyFarms'
import CropScanner from './pages/CropScanner'
import PriorityCenter from './pages/PriorityCenter'
import RescuePlanner from './pages/RescuePlanner'
import Weather from './pages/Weather'
import EconomicRisk from './pages/EconomicRisk'
import AiAssistant from './pages/AiAssistant'
import TreatmentTracker from './pages/TreatmentTracker'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/farms" element={<Protected><MyFarms /></Protected>} />
        <Route path="/scanner" element={<Protected><CropScanner /></Protected>} />
        <Route path="/priority" element={<Protected><PriorityCenter /></Protected>} />
        <Route path="/rescue" element={<Protected><RescuePlanner /></Protected>} />
        <Route path="/rescue/:scanId" element={<Protected><RescuePlanner /></Protected>} />
        <Route path="/weather" element={<Protected><Weather /></Protected>} />
        <Route path="/economic" element={<Protected><EconomicRisk /></Protected>} />
        <Route path="/assistant" element={<Protected><AiAssistant /></Protected>} />
        <Route path="/treatments" element={<Protected><TreatmentTracker /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
