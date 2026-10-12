import { useState, useEffect } from 'react'
import api from '../api/client'
import { useFarm } from '../context/FarmContext'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Target, Plus, Trash2, ChevronRight, AlertTriangle, 
  Info, Lightbulb, Sprout, Cpu, IndianRupee, ShieldCheck, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle2, Sliders 
} from 'lucide-react'

const CATEGORY_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', badge: 'badge-critical', icon: '🔴', pulse: 'pulse-critical', label: 'Critical — Immediate Action Required' },
  HIGH:     { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', badge: 'badge-high',     icon: '🟠', pulse: 'pulse-high',     label: 'High — Action Required Soon' },
  MEDIUM:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', badge: 'badge-medium',   icon: '🟡', pulse: '',              label: 'Medium — Monitor & Address' },
  LOW:      { color: '#22c55e', bg: '#f0fdf4', border: '#86efac', badge: 'badge-low',      icon: '🟢', pulse: '',              label: 'Low — Routine Monitoring' },
}

const COMMON_THREATS = [
  'Rice Leaf Blast',
  'Tomato Early Blight',
  'Brown Planthopper',
  'Wheat Rust',
  'Powdery Mildew',
  'Bacterial Leaf Streak',
  'Stem Borer',
  'Corn Smut'
]

const SEVERITY_PRESETS = [
  { 
    id: 'Low', 
    label: 'Mild Spotting', 
    desc: 'Early stage detection, ~10% leaf canopy affected',
    badge: '🟢 Low Threat',
    affectedArea: 10.0,
    spreadRisk: 2.5
  },
  { 
    id: 'Medium', 
    label: 'Moderate Spread', 
    desc: 'Noticeable symptoms, ~25% canopy area showing lesions',
    badge: '🟡 Medium Threat',
    affectedArea: 25.0,
    spreadRisk: 5.0
  },
  { 
    id: 'High', 
    label: 'Severe Hotspot', 
    desc: 'Aggressive infection, ~45% canopy affected, spreading fast',
    badge: '🟠 High Threat',
    affectedArea: 45.0,
    spreadRisk: 7.5
  },
  { 
    id: 'Critical', 
    label: 'Critical Outbreak', 
    desc: 'Emergency condition, >65% canopy infected, risk of total crop failure',
    badge: '🔴 Critical Outbreak',
    affectedArea: 65.0,
    spreadRisk: 9.0
  }
]

export default function PriorityCenter() {
  const [searchParams] = useSearchParams()
  const { activeFarm } = useFarm()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('disease') || searchParams.get('scan_id')))
  const [submitting, setSubmitting] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  
  // Streamlined Form State - professional & minimal
  const [form, setForm] = useState({
    issue_name: searchParams.get('disease') || '',
    severity: searchParams.get('severity') || 'High',
    farm_id: '',
    field_id: '',
    // Advanced options (auto-calculated by default)
    showAdvanced: false,
    affected_area_pct: 45,
    spread_risk: 7.5,
    water_stress: 5.0,
    nutrient_deficiency: 3.0,
    pest_severity: 4.0,
    economic_loss_est: 0, // 0 means auto-predict via XGBoost
    confidence: 94.0
  })

  // Live XGBoost preview state
  const [liveEconPreview, setLiveEconPreview] = useState(null)

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await api.get('/priority/')
      setIssues(res.data)
      if (res.data.length > 0 && !selectedIssue) {
        setSelectedIssue(res.data[0])
      }
    } catch { toast.error('Failed to load priority issues') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchIssues()
    if (activeFarm) {
      setForm(f => ({ 
        ...f, 
        farm_id: activeFarm.id, 
        field_id: activeFarm.fields?.[0]?.id || '' 
      }))
    }
  }, [activeFarm])

  // Live XGBoost estimation when field or severity changes
  useEffect(() => {
    const getPreview = async () => {
      if (!form.field_id || !activeFarm) return
      const field = activeFarm.fields?.find(f => f.id === parseInt(form.field_id))
      if (!field) return

      try {
        const res = await api.get('/economic/estimate', {
          params: {
            crop_type: field.crop_type,
            field_area_acres: field.area,
            severity: form.severity,
            affected_area_pct: form.affected_area_pct,
            growth_stage: field.growth_stage,
            days_untreated: 5
          }
        })
        setLiveEconPreview(res.data)
      } catch {}
    }
    getPreview()
  }, [form.field_id, form.severity, form.affected_area_pct, activeFarm])

  const handleSeveritySelect = (preset) => {
    setForm(f => ({
      ...f,
      severity: preset.id,
      affected_area_pct: preset.affectedArea,
      spread_risk: preset.spreadRisk
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.farm_id || !form.field_id) { 
      toast.error('Select a farm and field first')
      return 
    }
    if (!form.issue_name.trim()) {
      toast.error('Please enter or select a threat name')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        farm_id: parseInt(form.farm_id),
        field_id: parseInt(form.field_id),
        issue_name: form.issue_name.trim(),
        severity: form.severity,
        affected_area_pct: parseFloat(form.affected_area_pct),
        spread_risk: parseFloat(form.spread_risk),
        water_stress: parseFloat(form.water_stress),
        nutrient_deficiency: parseFloat(form.nutrient_deficiency),
        pest_severity: parseFloat(form.pest_severity),
        confidence: parseFloat(form.confidence),
        // If 0, backend auto-predicts with XGBoost
        economic_loss_est: form.economic_loss_est > 0 ? parseFloat(form.economic_loss_est) : null
      }

      const res = await api.post('/priority/analyze', payload)
      toast.success(
        `XGBoost Prioritized! Score: ${res.data.priority_score}/100 — Est. Loss: ₹${(res.data.economic_loss_est || 0).toLocaleString('en-IN')}`,
        { duration: 4000 }
      )
      setShowForm(false)
      setForm(f => ({
        ...f,
        issue_name: '',
        severity: 'High',
        affected_area_pct: 45,
        spread_risk: 7.5,
        economic_loss_est: 0,
        showAdvanced: false
      }))
      fetchIssues()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to analyze issue')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this issue from the priority ranking?')) return
    try {
      await api.delete(`/priority/${id}`)
      toast.success('Issue removed')
      fetchIssues()
      if (selectedIssue?.id === id) setSelectedIssue(null)
    } catch { toast.error('Failed to delete') }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/priority/${id}/status?status=${status}`)
      toast.success(`Status updated to ${status}`)
      fetchIssues()
      if (selectedIssue?.id === id) {
        setSelectedIssue(prev => prev ? { ...prev, status } : null)
      }
    } catch { toast.error('Failed to update status') }
  }

  const handleRecalculate = async () => {
    if (!activeFarm) {
      toast.error('Select an active farm first')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/priority/recalculate', { farm_id: activeFarm.id })
      toast.success(res.data.message || 'Priorities dynamically recalculated with live weather!')
      fetchIssues()
    } catch {
      toast.error('Failed to recalculate')
      setLoading(false)
    }
  }

  const sortedIssues = [...issues].sort((a, b) => b.priority_score - a.priority_score)

  return (
    <div className="p-5 animate-fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title">🎯 Priority Intervention Center</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Cpu size={12} className="text-emerald-600" /> XGBoost Loss-Aware
            </span>
          </div>
          <p className="section-subtitle">Dynamic threat ranking calibrated with real-time weather and XGBoost economic loss estimation</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeFarm && (
            <button
              onClick={handleRecalculate}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Cpu size={14} className="text-emerald-600" /> Recalculate with Weather
            </button>
          )}
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
          >
            <Plus size={16} /> Prioritize New Issue
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {issues.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
            const count = issues.filter(i => i.priority_category === cat).length
            const lossForCat = issues
              .filter(i => i.priority_category === cat)
              .reduce((sum, item) => sum + (item.economic_loss_est || 0), 0)
            return (
              <div 
                key={cat} 
                className="p-3.5 rounded-2xl transition-all" 
                style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{cat}</span>
                  <span className="text-base">{cfg.icon}</span>
                </div>
                <div className="text-2xl font-black mt-1" style={{ color: cfg.color }}>{count}</div>
                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-0.5 font-medium">
                  Est. Loss: <strong className="text-gray-700">₹{lossForCat.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Professional Streamlined Add Issue Form */}
      {showForm && (
        <div className="metric-card bg-white border-2 border-emerald-300 shadow-lg animate-fade-up">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Target size={16} className="text-emerald-600" /> Professional Threat Assessment
              </div>
              <div className="text-xs text-gray-400">All complex micro-climate & economic loss numbers are auto-predicted via XGBoost ML</div>
            </div>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field Selection */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">1. Select Target Field *</label>
              <select 
                value={form.field_id} 
                onChange={e => setForm({...form, field_id: e.target.value})} 
                className="farm-input"
                required
              >
                <option value="">-- Choose Field from Active Farm --</option>
                {activeFarm?.fields?.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.crop_type} ({f.area} acres, {f.growth_stage} stage)
                  </option>
                ))}
              </select>
              {!activeFarm && (
                <div className="text-xs text-amber-600 mt-1">
                  ⚠️ No active farm found. <Link to="/farms" className="underline font-bold">Add a farm & field first</Link>.
                </div>
              )}
            </div>

            {/* Threat Name & Quick Suggestions */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">2. Disease / Pest / Threat Name *</label>
              <input 
                required 
                value={form.issue_name} 
                onChange={e => setForm({...form, issue_name: e.target.value})}
                placeholder="e.g. Rice Leaf Blast or Stem Borer" 
                className="farm-input text-sm" 
              />
              
              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-gray-400 font-semibold">Common Threats:</span>
                {COMMON_THREATS.map(threat => (
                  <button
                    key={threat}
                    type="button"
                    onClick={() => setForm({...form, issue_name: threat})}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    + {threat}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Preset Cards */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">3. Observed Severity Condition *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {SEVERITY_PRESETS.map(preset => {
                  const isSelected = form.severity.toLowerCase() === preset.id.toLowerCase()
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSeveritySelect(preset)}
                      className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' 
                          : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{preset.label}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-emerald-600" />}
                      </div>
                      <div className="text-[10px] text-gray-500 leading-tight">{preset.desc}</div>
                      <div className="mt-2 text-[10px] font-bold text-gray-700">{preset.badge}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Live XGBoost Economic Preview Box */}
            {liveEconPreview && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      ⚡ Live XGBoost Regressor Estimation
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Crop: {liveEconPreview.crop_type} · Projected Yield Loss: <strong>{liveEconPreview.projected_yield_loss_pct}%</strong>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs text-gray-500 font-medium">Auto-Predicted Financial Loss</div>
                  <div className="text-xl font-black text-red-600">
                    ₹{(liveEconPreview.est_financial_loss || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    Treatment Saves: ₹{(liveEconPreview.potential_savings || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Agronomic Overrides (Accordion) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, showAdvanced: !f.showAdvanced }))}
                className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
              >
                <Sliders size={13} />
                {form.showAdvanced ? 'Hide Technical Overrides' : '🛠️ Advanced Technical Overrides (Optional)'}
                {form.showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {form.showAdvanced && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Affected Area (%)</label>
                    <input 
                      type="number" min="1" max="100" 
                      value={form.affected_area_pct} 
                      onChange={e => setForm({...form, affected_area_pct: e.target.value})} 
                      className="farm-input text-xs py-1" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Spread Risk (0-10)</label>
                    <input 
                      type="number" min="0" max="10" step="0.5" 
                      value={form.spread_risk} 
                      onChange={e => setForm({...form, spread_risk: e.target.value})} 
                      className="farm-input text-xs py-1" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Confidence (%)</label>
                    <input 
                      type="number" min="50" max="100" 
                      value={form.confidence} 
                      onChange={e => setForm({...form, confidence: e.target.value})} 
                      className="farm-input text-xs py-1" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Manual Loss Override (₹)</label>
                    <input 
                      type="number" min="0" step="500" 
                      value={form.economic_loss_est} 
                      placeholder="0 = Auto XGBoost"
                      onChange={e => setForm({...form, economic_loss_est: e.target.value})} 
                      className="farm-input text-xs py-1" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={submitting || !activeFarm} 
                className="btn-primary"
              >
                {submitting ? (
                  <><span className="spinner" /> Evaluating Priority...</>
                ) : (
                  <><Target size={15} /> Calculate Priority Score</>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-10 h-10" style={{ borderWidth: 3 }} />
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state bg-white rounded-2xl border border-emerald-100 p-8 text-center">
          <div className="empty-state-icon mx-auto mb-3">
            <Target size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">No Active Priority Threats</h2>
          <p className="text-gray-400 text-xs max-w-sm mx-auto mb-5">
            Scan a leaf in the Crop Scanner or click "Prioritize New Issue" to run the dynamic ranking engine.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs">
            <Plus size={14} /> Add First Issue
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-5">
          {/* Issue List (Left Column) */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <span>Ranked Threat Queue ({issues.length})</span>
              <span className="text-[10px] text-emerald-700 font-bold">XGBoost Loss-Ordered</span>
            </div>

            {sortedIssues.map((issue, idx) => {
              const cfg = CATEGORY_CONFIG[issue.priority_category] || CATEGORY_CONFIG.LOW
              const isSelected = selectedIssue?.id === issue.id

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`metric-card cursor-pointer transition-all border ${
                    isSelected 
                      ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md bg-emerald-50/20' 
                      : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="text-[10px] font-bold text-gray-400">#{idx + 1}</div>
                      <div 
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${cfg.pulse}`}
                        style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}
                      >
                        {cfg.icon}
                      </div>
                    </div>

                    {/* Threat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{issue.issue_name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {issue.field_name} · {issue.crop_type} ({issue.farm_name})
                      </div>

                      {/* Score & XGBoost Economic Loss */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="text-xs font-extrabold" style={{ color: cfg.color }}>
                          {issue.priority_score}/100
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                          {issue.priority_category}
                        </span>
                        
                        {/* XGBoost Economic Loss Tag */}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold bg-red-50 text-red-700 border border-red-200 flex items-center gap-0.5">
                          <IndianRupee size={9} /> {(issue.economic_loss_est || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={14} className="text-gray-300 self-center" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Issue Detail View (Right Column) */}
          <div className="md:col-span-3">
            {selectedIssue ? (
              <div className="metric-card space-y-4 border border-emerald-100 shadow-sm animate-fade-up">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{selectedIssue.issue_name}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CATEGORY_CONFIG[selectedIssue.priority_category]?.badge}`}>
                        {selectedIssue.priority_category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Located in <strong>{selectedIssue.field_name}</strong> · {selectedIssue.crop_type} ({selectedIssue.growth_stage} stage) · {selectedIssue.farm_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedIssue.id, selectedIssue.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                        selectedIssue.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {selectedIssue.status === 'ACTIVE' ? '✓ Mark Resolved' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedIssue.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Economic Loss & Priority Score Highlight */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-[10px] text-red-600 font-bold uppercase flex items-center gap-1">
                      <IndianRupee size={11} /> Est. Economic Loss
                    </div>
                    <div className="text-xl font-black text-red-700 mt-0.5">
                      ₹{(selectedIssue.economic_loss_est || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[9px] text-red-500 mt-0.5">XGBoost Projected Deficit</div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase flex items-center gap-1">
                      <Target size={11} /> Priority Score
                    </div>
                    <div className="text-xl font-black text-emerald-800 mt-0.5">
                      {selectedIssue.priority_score}<span className="text-xs font-medium text-emerald-600">/100</span>
                    </div>
                    <div className="text-[9px] text-emerald-600 mt-0.5">Multi-Factor Calibrated</div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-blue-700 font-bold uppercase flex items-center gap-1">
                      <Cpu size={11} /> Spread Risk
                    </div>
                    <div className="text-xl font-black text-blue-800 mt-0.5">
                      {selectedIssue.spread_risk}<span className="text-xs font-medium text-blue-600">/10</span>
                    </div>
                    <div className="text-[9px] text-blue-600 mt-0.5">Pathogen Velocity Index</div>
                  </div>
                </div>

                {/* Explainable AI Rationale */}
                <div>
                  <div className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-amber-500" /> Explainable AI: Why This Rank?
                  </div>
                  <div className="space-y-1.5">
                    {Array.isArray(selectedIssue.rationale) && selectedIssue.rationale.length > 0 ? (
                      selectedIssue.rationale.map((r, i) => (
                        <div key={i} className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-start gap-2">
                          <span className="text-emerald-600 font-bold text-sm leading-none">•</span>
                          <span>{r}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">High priority crop health intervention required.</div>
                    )}
                  </div>
                </div>

                {/* Recommended Action & Evidence */}
                {selectedIssue.recommended_action && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                      🎯 Recommended Action
                    </div>
                    <div className="text-xs text-emerald-950 font-medium">
                      {selectedIssue.recommended_action}
                    </div>
                  </div>
                )}

                {/* Fast Action Links */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/rescue?farm_id=${selectedIssue.farm_id}&field_id=${selectedIssue.field_id}&issue_id=${selectedIssue.id}`}
                    className="btn-primary flex-1 justify-center text-xs py-2"
                  >
                    <ShieldCheck size={14} /> Open Prioritized AI Rescue Plan
                  </Link>
                  <Link
                    to={`/economic?issue_id=${selectedIssue.id}`}
                    className="btn-secondary flex-1 justify-center text-xs py-2"
                  >
                    <IndianRupee size={14} /> View XGBoost Loss Curves
                  </Link>
                </div>
              </div>
            ) : (
              <div className="metric-card text-center py-16 text-gray-400">
                Select an issue on the left to inspect detailed XGBoost loss analytics
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
