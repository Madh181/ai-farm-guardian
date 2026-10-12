import { useState, useEffect } from 'react'
import api from '../api/client'
import { useFarm } from '../context/FarmContext'
import toast from 'react-hot-toast'
import {
  Sprout, Plus, Trash2, MapPin, Calendar, Leaf, ChevronDown, 
  ChevronUp, Crosshair, Navigation, Globe, ShieldCheck, Check, 
  Layers, AlertTriangle, Sparkles
} from 'lucide-react'

const CROP_OPTIONS = ['Rice', 'Wheat', 'Tomato', 'Corn', 'Cotton', 'Sugarcane', 'Soybean', 'Potato', 'Onion', 'Groundnut']
const STAGE_OPTIONS = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturation', 'Harvest']

// Curated Region Presets for 1-Click GPS
const REGION_PRESETS = [
  { name: 'Kurnool, Andhra Pradesh', lat: 15.8281, lng: 78.0373 },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { name: 'Varanasi, Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
]

// Unique Green Themes for Each Farm
const UNIQUE_GREEN_THEMES = [
  {
    id: 'emerald',
    name: 'Lush Emerald',
    gradient: 'from-emerald-500 to-emerald-700',
    cardBorder: 'border-emerald-300',
    activeRing: 'ring-emerald-500',
    headerBg: 'bg-emerald-50/80',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pulseColor: '#059669',
    accent: 'text-emerald-700'
  },
  {
    id: 'jade',
    name: 'Verdant Jade',
    gradient: 'from-teal-500 to-teal-700',
    cardBorder: 'border-teal-300',
    activeRing: 'ring-teal-500',
    headerBg: 'bg-teal-50/80',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    pulseColor: '#0d9488',
    accent: 'text-teal-700'
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    gradient: 'from-green-600 to-green-800',
    cardBorder: 'border-green-300',
    activeRing: 'ring-green-600',
    headerBg: 'bg-green-50/80',
    badgeBg: 'bg-green-100 text-green-800 border-green-300',
    pulseColor: '#15803d',
    accent: 'text-green-800'
  },
  {
    id: 'mint',
    name: 'Alpine Mint',
    gradient: 'from-emerald-400 to-teal-600',
    cardBorder: 'border-emerald-300',
    activeRing: 'ring-emerald-400',
    headerBg: 'bg-emerald-50/80',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pulseColor: '#10b981',
    accent: 'text-emerald-700'
  },
  {
    id: 'shamrock',
    name: 'Bright Shamrock',
    gradient: 'from-green-500 to-emerald-700',
    cardBorder: 'border-green-300',
    activeRing: 'ring-green-500',
    headerBg: 'bg-green-50/80',
    badgeBg: 'bg-green-100 text-green-800 border-green-300',
    pulseColor: '#16a34a',
    accent: 'text-green-700'
  },
  {
    id: 'sage',
    name: 'Organic Sage',
    gradient: 'from-lime-600 to-emerald-800',
    cardBorder: 'border-lime-300',
    activeRing: 'ring-lime-600',
    headerBg: 'bg-lime-50/80',
    badgeBg: 'bg-lime-100 text-lime-800 border-lime-300',
    pulseColor: '#4d7c0f',
    accent: 'text-lime-800'
  }
]

export default function MyFarms() {
  const { farms, fetchFarms, setActiveFarm, activeFarm } = useFarm()
  const [showAddFarm, setShowAddFarm] = useState(false)
  const [expandedFarm, setExpandedFarm] = useState(null)
  const [showAddField, setShowAddField] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)

  // Farm Form
  const [farmForm, setFarmForm] = useState({
    name: '',
    location_name: '',
    latitude: 12.9716,
    longitude: 77.5946,
    total_area: 2.0,
    fields: []
  })

  // Field Form
  const [fieldForm, setFieldForm] = useState({
    name: '',
    crop_type: 'Rice',
    growth_stage: 'Flowering',
    area: 1.0,
    planting_date: new Date().toISOString().split('T')[0]
  })

  // Auto-detect browser GPS coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarmForm(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(4)),
          longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          location_name: prev.location_name || 'My Current Field GPS'
        }))
        toast.success(`📍 Coordinates captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        setLocating(false)
      },
      (err) => {
        toast.error('Unable to retrieve location. Select a region preset below.')
        setLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Select regional preset
  const handleSelectPreset = (preset) => {
    setFarmForm(prev => ({
      ...prev,
      location_name: preset.name,
      latitude: preset.lat,
      longitude: preset.lng
    }))
    toast.success(`Selected region: ${preset.name}`)
  }

  const handleAddFarm = async (e) => {
    e.preventDefault()
    const cleanName = farmForm.name.trim()
    if (!cleanName) {
      toast.error('Please enter a farm name')
      return
    }

    // Client-side uniqueness check
    const duplicate = farms.some(f => f.name.toLowerCase() === cleanName.toLowerCase())
    if (duplicate) {
      toast.error(`A farm named "${cleanName}" already exists! Each farm must have a unique name.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/farms/', farmForm)
      toast.success(`Farm "${cleanName}" registered with unique code ${res.data.farm_code}!`)
      setShowAddFarm(false)
      setFarmForm({ 
        name: '', 
        location_name: '', 
        latitude: 12.9716, 
        longitude: 77.5946, 
        total_area: 2.0, 
        fields: [] 
      })
      fetchFarms()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create farm')
    } finally { 
      setSubmitting(false) 
    }
  }

  const handleAddField = async (e, farmId) => {
    e.preventDefault()
    const cleanFieldName = fieldForm.name.trim()
    if (!cleanFieldName) {
      toast.error('Please enter a field name')
      return
    }

    const currentFarm = farms.find(f => f.id === farmId)
    if (currentFarm?.fields?.some(f => f.name.toLowerCase() === cleanFieldName.toLowerCase())) {
      toast.error(`Field "${cleanFieldName}" already exists in this farm. Choose a unique field name.`)
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/farms/${farmId}/fields`, fieldForm)
      toast.success(`Field "${cleanFieldName}" added to farm!`)
      setShowAddField(null)
      setFieldForm({ 
        name: '', 
        crop_type: 'Rice', 
        growth_stage: 'Flowering', 
        area: 1.0, 
        planting_date: new Date().toISOString().split('T')[0] 
      })
      fetchFarms()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add field')
    } finally { 
      setSubmitting(false) 
    }
  }

  const handleDeleteFarm = async (id, name) => {
    if (!confirm(`Are you sure you want to delete farm "${name}"? All associated fields, scans, and priority issues will be removed.`)) return
    try {
      await api.delete(`/farms/${id}`)
      toast.success(`Farm "${name}" deleted`)
      fetchFarms()
    } catch { 
      toast.error('Failed to delete farm') 
    }
  }

  return (
    <div className="p-5 animate-fade-up space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title">🌿 Farm Territory & Fields</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Unique Green Profiles
            </span>
          </div>
          <p className="section-subtitle">Manage uniquely themed farms with GPS boundary coordinates, live health scores, and field plots</p>
        </div>
        <button onClick={() => setShowAddFarm(!showAddFarm)} className="btn-primary self-start">
          <Plus size={16} /> Add Unique Farm
        </button>
      </div>

      {/* Streamlined Add Farm Modal / Form */}
      {showAddFarm && (
        <div className="metric-card bg-white border-2 border-emerald-300 shadow-xl animate-fade-up">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sprout size={16} className="text-emerald-600" /> Create Unique Farm Territory
              </div>
              <div className="text-xs text-gray-400">Each farm is assigned a distinctive green identity, GPS tag, and code</div>
            </div>
            <button onClick={() => setShowAddFarm(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
          </div>

          <form onSubmit={handleAddFarm} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Farm Name * (Must be Unique)</label>
                <input 
                  required 
                  value={farmForm.name} 
                  onChange={e => setFarmForm({...farmForm, name: e.target.value})}
                  placeholder="e.g. Green Valley Farm or Krishna River Plot" 
                  className="farm-input" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Location / Village Name</label>
                <input 
                  value={farmForm.location_name} 
                  onChange={e => setFarmForm({...farmForm, location_name: e.target.value})}
                  placeholder="e.g. Kurnool District, AP" 
                  className="farm-input" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Total Farm Area (Acres)</label>
                <input 
                  type="number" min="0.1" step="0.5" 
                  value={farmForm.total_area}
                  onChange={e => setFarmForm({...farmForm, total_area: parseFloat(e.target.value)})} 
                  className="farm-input" 
                />
              </div>

              {/* GPS Coordinates with 1-Click Detect */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">GPS Coordinates</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    <Crosshair size={11} className={locating ? 'animate-spin' : ''} />
                    {locating ? 'Locating...' : 'Auto-Detect My GPS'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" step="0.0001" placeholder="Latitude"
                    value={farmForm.latitude}
                    onChange={e => setFarmForm({...farmForm, latitude: parseFloat(e.target.value)})} 
                    className="farm-input text-xs py-1.5" 
                  />
                  <input 
                    type="number" step="0.0001" placeholder="Longitude"
                    value={farmForm.longitude}
                    onChange={e => setFarmForm({...farmForm, longitude: parseFloat(e.target.value)})} 
                    className="farm-input text-xs py-1.5" 
                  />
                </div>
              </div>
            </div>

            {/* Quick Regional Presets */}
            <div>
              <div className="text-[11px] font-bold text-gray-500 mb-1.5">Or Pick a Quick Agri-Belt Region:</div>
              <div className="flex flex-wrap gap-1.5">
                {REGION_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 border border-gray-200 transition-colors"
                  >
                    📍 {p.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <span className="spinner" /> : <Plus size={15} />} Register Unique Farm
              </button>
              <button type="button" onClick={() => setShowAddFarm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Unique Farms Showcase / Territory Overview */}
      {farms.length > 0 && (
        <div className="metric-card bg-gradient-to-r from-emerald-950 via-teal-950 to-green-950 text-white border-0 shadow-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Globe size={14} /> Territory Radar: All Farms in Green
              </div>
              <div className="text-base font-black text-white mt-0.5">
                {farms.length} Unique Farm Territories Registered
              </div>
            </div>
            <div className="text-xs text-emerald-300">
              Total Area: <strong className="text-white">{farms.reduce((acc, f) => acc + (f.total_area || 0), 0)} acres</strong> · 
              Fields: <strong className="text-white">{farms.reduce((acc, f) => acc + (f.fields?.length || 0), 0)}</strong>
            </div>
          </div>

          {/* Farm Grid in Unique Green Styles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {farms.map((farm, idx) => {
              const theme = farm.green_theme || UNIQUE_GREEN_THEMES[idx % UNIQUE_GREEN_THEMES.length]
              const isActive = activeFarm?.id === farm.id

              return (
                <div
                  key={farm.id}
                  onClick={() => setActiveFarm(farm)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-emerald-800/40 border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.gradient || 'from-emerald-500 to-emerald-700'} flex items-center justify-center text-white shadow-sm`}>
                        <Sprout size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[130px]">{farm.name}</div>
                        <div className="text-[10px] text-emerald-300 font-mono">{farm.farm_code || `FRM-${String(farm.id).padStart(3, '0')}`}</div>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-400 text-emerald-950 flex items-center gap-1">
                        <Check size={10} /> ACTIVE
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveFarm(farm) }}
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-emerald-200 hover:bg-white/20 transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 pt-2 border-t border-white/10">
                    <div>📐 {farm.total_area} Acres</div>
                    <div>🌱 {farm.fields?.length || 0} Fields</div>
                    <div className="truncate">📍 {farm.location_name?.split(',')[0] || 'Field'}</div>
                    <div className="text-emerald-400 font-bold">♥ Health: {farm.health_score || 95}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Farm Cards List */}
      {farms.length === 0 ? (
        <div className="empty-state metric-card p-12 text-center bg-white rounded-2xl border border-emerald-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 mx-auto mb-3 flex items-center justify-center">
            <Sprout size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">No Farm Territories Added Yet</h2>
          <p className="text-gray-400 text-xs max-w-sm mx-auto mb-5">
            Add your first farm with unique coordinates to unlock AI disease detection, weather tracking, and XGBoost loss forecasting.
          </p>
          <button onClick={() => setShowAddFarm(true)} className="btn-primary text-xs">
            <Plus size={15} /> Add Your First Unique Farm
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Detailed Farm Management ({farms.length})
          </div>

          {farms.map((farm, idx) => {
            const isExpanded = expandedFarm === farm.id
            const isActive = activeFarm?.id === farm.id
            const theme = farm.green_theme || UNIQUE_GREEN_THEMES[idx % UNIQUE_GREEN_THEMES.length]

            return (
              <div 
                key={farm.id} 
                className={`metric-card transition-all border-2 ${
                  isActive 
                    ? `${theme.cardBorder || 'border-emerald-400'} ring-2 ${theme.activeRing || 'ring-emerald-400'} shadow-md` 
                    : 'border-gray-100 hover:border-emerald-200'
                }`}
              >
                {/* Farm Header */}
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedFarm(isExpanded ? null : farm.id)}
                >
                  {/* Unique Theme Icon */}
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.gradient || 'from-emerald-500 to-emerald-700'} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
                    <Sprout size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-bold text-gray-900">{farm.name}</div>
                      
                      {/* Unique Farm Code Badge */}
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {farm.farm_code || `FRM-${String(farm.id).padStart(3, '0')}`}
                      </span>

                      {/* Unique Green Theme Tag */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg || 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                        {theme.badge || theme.name || 'Lush Green'}
                      </span>

                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-sm">
                          <Check size={10} /> ACTIVE TERRITORY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-600" /> {farm.location_name || 'Location Not Specified'}
                      </span>
                      <span>📐 {farm.total_area} acres</span>
                      <span>🌱 {farm.fields?.length || 0} fields</span>
                      <span className="text-emerald-700 font-bold">♥ Health Score: {farm.health_score || 95}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={e => { e.stopPropagation(); setActiveFarm(farm) }}
                        className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-bold transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteFarm(farm.id, farm.name) }}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete Farm"
                    >
                      <Trash2 size={15} />
                    </button>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Fields Panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-up space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Layers size={14} className="text-emerald-600" />
                        Crop Fields in {farm.name} ({farm.fields?.length || 0})
                      </div>
                      <button
                        onClick={() => setShowAddField(showAddField === farm.id ? null : farm.id)}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        <Plus size={12} /> Add Field Plot
                      </button>
                    </div>

                    {/* Add Field Form */}
                    {showAddField === farm.id && (
                      <form onSubmit={e => handleAddField(e, farm.id)} className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 animate-fade-up">
                        <div className="text-xs font-bold text-emerald-900 mb-1">Add Field Plot to {farm.name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Field Plot Name *</label>
                            <input 
                              required 
                              value={fieldForm.name} 
                              onChange={e => setFieldForm({...fieldForm, name: e.target.value})}
                              placeholder="e.g. Field Alpha" 
                              className="farm-input text-xs py-1.5" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Crop Variety</label>
                            <select 
                              value={fieldForm.crop_type} 
                              onChange={e => setFieldForm({...fieldForm, crop_type: e.target.value})} 
                              className="farm-input text-xs py-1.5"
                            >
                              {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Growth Stage</label>
                            <select 
                              value={fieldForm.growth_stage} 
                              onChange={e => setFieldForm({...fieldForm, growth_stage: e.target.value})} 
                              className="farm-input text-xs py-1.5"
                            >
                              {STAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Plot Area (Acres)</label>
                            <input 
                              type="number" min="0.05" step="0.1" 
                              value={fieldForm.area}
                              onChange={e => setFieldForm({...fieldForm, area: parseFloat(e.target.value)})} 
                              className="farm-input text-xs py-1.5" 
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={submitting} className="btn-primary text-xs py-1.5 px-3">
                            {submitting ? <span className="spinner w-3 h-3" /> : null} Add Field
                          </button>
                          <button type="button" onClick={() => setShowAddField(null)} className="btn-secondary text-xs py-1.5 px-3">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Field Cards */}
                    {farm.fields?.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                        No field plots configured yet. Click "Add Field Plot" above to register your crop zones.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {farm.fields.map(field => (
                          <div key={field.id} className="p-3 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Leaf size={14} className="text-emerald-600" />
                                <span className="text-xs font-bold text-gray-800">{field.name}</span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                                {field.area} ac
                              </span>
                            </div>
                            <div className="text-xs font-bold text-emerald-800">{field.crop_type}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                              <span>Stage: {field.growth_stage}</span>
                              {field.planting_date && (
                                <span className="flex items-center gap-0.5"><Calendar size={9} /> {field.planting_date}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
