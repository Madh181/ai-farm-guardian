import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useFarm } from '../context/FarmContext'
import toast from 'react-hot-toast'
import {
  Upload, X, ScanLine, Leaf, AlertTriangle, CheckCircle, ChevronRight,
  Image, IndianRupee, Cpu, Target, Lightbulb, ArrowRight
} from 'lucide-react'

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '🔴', label: 'Critical Outbreak' },
  High:     { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '🔴', label: 'High Severity' },
  Medium:   { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '🟠', label: 'Medium Severity' },
  Low:      { color: '#22c55e', bg: '#f0fdf4', border: '#86efac', icon: '🟢', label: 'Low Severity' },
}

const CAT_COLORS = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
  HIGH:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' },
  MEDIUM:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
  LOW:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' },
}

export default function CropScanner() {
  const navigate = useNavigate()
  const { activeFarm } = useFarm()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropHint, setCropHint] = useState('Rice')
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const cropOptions = ['Rice', 'Wheat', 'Tomato', 'Corn', 'Cotton']

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file')
      return
    }
    setImage(file)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [])

  const handleScan = async () => {
    if (!image) { toast.error('Please upload a leaf image first'); return }
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('crop_type_hint', cropHint)
      if (activeFarm) {
        formData.append('farm_id', activeFarm.id)
        const targetFieldId = selectedFieldId || (activeFarm.fields?.[0]?.id)
        if (targetFieldId) formData.append('field_id', targetFieldId)
      }
      const res = await api.post('/scanner/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
      toast.success('AI scan complete! Dynamic agricultural risks identified & prioritized.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const sev = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Medium : null

  return (
    <div className="p-5 space-y-5 animate-fade-up">
      <div>
        <h1 className="section-title">🌿 Crop Scanner & Risk Identifier</h1>
        <p className="section-subtitle">
          Computer vision disease detection with automatic multi-risk analysis and XGBoost priority scheduling
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upload & Configuration Panel */}
        <div className="space-y-4">
          <div className="metric-card space-y-3">
            <div className="text-sm font-bold text-gray-800">1. Crop & Field Target</div>
            
            {/* Crop hint selection */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Crop Type</label>
              <div className="flex flex-wrap gap-2">
                {cropOptions.map(c => (
                  <button
                    key={c}
                    onClick={() => setCropHint(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      cropHint === c
                        ? 'bg-green-600 text-white shadow-md shadow-green-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Field selection if farm available */}
            {activeFarm?.fields?.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Link to Farm Field</label>
                <select
                  value={selectedFieldId || activeFarm.fields[0].id}
                  onChange={e => setSelectedFieldId(e.target.value)}
                  className="farm-input text-xs py-1.5"
                >
                  {activeFarm.fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.crop_type} ({f.growth_stage} stage, {f.area} acres)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Drop Zone */}
          <div
            className={`drop-zone p-8 text-center ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Leaf preview" className="max-h-56 mx-auto rounded-xl object-cover shadow-md" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); setResult(null) }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
                <div className="mt-3 text-sm text-green-700 font-medium">{image?.name}</div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Image size={28} className="text-green-500" />
                </div>
                <p className="text-sm font-semibold text-green-700">Drag & Drop Leaf Image</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse · JPG, PNG, WebP supported</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1 justify-center text-xs py-2.5"
            >
              <Upload size={14} /> Browse Image
            </button>
            <button
              onClick={handleScan}
              disabled={!image || scanning}
              className="btn-primary flex-1 justify-center text-xs py-2.5"
            >
              {scanning ? <><span className="spinner" /> Analyzing Risks...</> : <><ScanLine size={14} /> Scan & Prioritize</>}
            </button>
          </div>
        </div>

        {/* Scan & Dynamic Intervention Prioritization Result Panel */}
        <div>
          {result ? (
            <div className="metric-card space-y-4 animate-fade-up">
              {/* Primary Detection Header */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl shadow-sm" style={{ background: sev?.bg }}>
                    <Leaf size={22} style={{ color: sev?.color }} />
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900">{result.disease_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Evaluated for <strong>{result.farm_name}</strong> · {result.field_name} ({result.growth_stage} stage)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sev?.bg, color: sev?.color, border: `1px solid ${sev?.border}` }}>
                  {sev?.icon} {result.severity}
                </span>
              </div>

              {/* Key CV Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Confidence', value: `${result.confidence}%`, color: '#22c55e' },
                  { label: 'Canopy Lesion', value: `${result.affected_area_pct}%`, color: '#f97316' },
                  { label: 'Crop Type', value: result.crop_type, color: '#3b82f6' },
                  { label: 'Severity Level', value: result.severity, color: sev?.color },
                ].map(m => (
                  <div key={m.label} className="p-2.5 rounded-xl bg-gray-50 text-center">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">{m.label}</div>
                    <div className="text-xs sm:text-sm font-bold mt-0.5" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Economic Loss Card */}
              {result.economic_loss_est !== undefined && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                      <IndianRupee size={11} /> XGBoost Loss Projection
                    </div>
                    <div className="text-lg font-black text-red-700 mt-0.5">
                      ₹{(result.economic_loss_est || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      ✓ Timely action saves ~₹{(result.potential_savings || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      ⚡ {result.projected_yield_loss_pct}% Exposure
                    </span>
                  </div>
                </div>
              )}

              {/* MULTIPLE IDENTIFIED AGRICULTURAL PROBLEMS (DYNAMIC PRIORITIZATION) */}
              {result.interventions && result.interventions.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Target size={14} className="text-emerald-600" />
                      Dynamic Interventions Identified ({result.interventions.length}):
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Cpu size={10} /> XGBoost Ranked
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.interventions.map((item, idx) => {
                      const cTheme = CAT_COLORS[item.priority_category] || CAT_COLORS.LOW
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border transition-all hover:border-emerald-300 bg-white shadow-xs"
                          style={{ borderColor: idx === 0 ? '#fca5a5' : '#e5e7eb' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-gray-900">
                                  {item.problem_name}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                                  {item.reason}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cTheme.bg} ${cTheme.text} ${cTheme.border} border`}>
                                {item.priority_score}/100
                              </span>
                              <div className="text-[9px] text-gray-400 mt-0.5 font-bold">
                                {item.priority_category}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Main Call to Action: Open AI Rescue Planner */}
              <div className="pt-2 space-y-2">
                <Link
                  to={`/rescue?farm_id=${result.farm_id || ''}&field_id=${result.field_id || ''}`}
                  className="btn-primary w-full justify-center text-xs py-2.5 font-bold shadow-md shadow-emerald-200"
                >
                  <Lightbulb size={15} />
                  Open Prioritized Action Plan in AI Rescue Planner
                  <ArrowRight size={14} />
                </Link>

                <Link
                  to={`/priority`}
                  className="btn-secondary w-full justify-center text-xs py-2"
                >
                  <Target size={14} />
                  View in Priority Intervention Center
                </Link>
              </div>
            </div>
          ) : (
            <div className="metric-card h-full flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-2xl">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <ScanLine size={36} className="text-green-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Awaiting Crop Image</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                Upload a leaf photo and click "Scan & Prioritize" to identify multiple crop risks and build your prioritized plan.
              </p>
              <div className="mt-6 space-y-2 text-left w-full max-w-xs">
                {[
                  'Identifies multiple agricultural problems',
                  'Live microclimate weather analysis',
                  'XGBoost Dynamic Priority Engine scoring',
                  '1-click export to AI Rescue Planner'
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
