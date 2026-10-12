import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useFarm } from '../context/FarmContext'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { 
  TrendingDown, AlertTriangle, IndianRupee, Target, Clock, 
  Sprout, Cpu, Sliders, ShieldCheck, ArrowRight, Sparkles 
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const CROP_OPTIONS = ['Rice', 'Wheat', 'Tomato', 'Corn', 'Cotton', 'Sugarcane', 'Soybean', 'Potato', 'Onion', 'Groundnut']
const STAGE_OPTIONS = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturation', 'Harvest']

export default function EconomicRisk() {
  const [searchParams] = useSearchParams()
  const { activeFarm } = useFarm()
  const [issues, setIssues] = useState([])
  const [selectedIssueId, setSelectedIssueId] = useState(searchParams.get('issue_id') || '')
  const [days, setDays] = useState(5)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Quick Simulator Mode State
  const [simMode, setSimMode] = useState(false)
  const [simCrop, setSimCrop] = useState('Rice')
  const [simArea, setSimArea] = useState(2.0)
  const [simSev, setSimSev] = useState('High')
  const [simAffPct, setSimAffPct] = useState(30)
  const [simStage, setSimStage] = useState('Flowering')

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get('/priority/')
        setIssues(res.data.filter(i => i.status !== 'RESOLVED'))
      } catch {}
    }
    fetchIssues()
  }, [])

  const fetchEconomicData = async () => {
    setLoading(true)
    try {
      if (simMode) {
        const res = await api.get('/economic/estimate', {
          params: {
            crop_type: simCrop,
            field_area_acres: simArea,
            severity: simSev,
            affected_area_pct: simAffPct,
            growth_stage: simStage,
            days_untreated: days
          }
        })
        setData(res.data)
      } else {
        const params = selectedIssueId
          ? { issue_id: selectedIssueId, days_untreated: days }
          : activeFarm ? { farm_id: activeFarm.id, days_untreated: days } : {}
        const res = await api.get('/economic/', { params })
        setData(res.data)
      }
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    fetchEconomicData() 
  }, [selectedIssueId, days, activeFarm, simMode, simCrop, simArea, simSev, simAffPct, simStage])

  const chartData = data?.timeline ? {
    labels: data.timeline.map(t => `Day ${t.day}`),
    datasets: [
      {
        label: 'XGBoost Yield Loss %',
        data: data.timeline.map(t => t.yield_loss_pct),
        fill: true,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: 'Financial Loss (₹)',
        data: data.timeline.map(t => t.financial_loss),
        fill: false,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        borderWidth: 2.5,
        tension: 0.35,
        yAxisID: 'y1',
        borderDash: [5, 5],
      }
    ]
  } : null

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: 'bold' } } },
      tooltip: { callbacks: { label: ctx => ctx.datasetIndex === 1 ? `₹${ctx.parsed.y.toLocaleString('en-IN')}` : `${ctx.parsed.y}% Yield Loss` } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { type: 'linear', position: 'left', title: { display: true, text: 'Yield Loss %', font: { size: 10 } }, grid: { color: '#f0fdf4' } },
      y1: { type: 'linear', position: 'right', title: { display: true, text: 'Financial Loss (₹)', font: { size: 10 } }, grid: { drawOnChartArea: false } }
    }
  }

  return (
    <div className="p-5 animate-fade-up space-y-5">
      {/* Page Title & ML Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title">💰 Economic Loss Predictor</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Cpu size={12} className="text-emerald-600 animate-pulse" /> XGBoost Regressor ML
            </span>
          </div>
          <p className="section-subtitle">Extreme Gradient Boosting engine evaluating yield reduction, monetary loss, and rescue ROI</p>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setSimMode(false)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
              !simMode ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Farm Issues
          </button>
          <button
            onClick={() => setSimMode(true)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
              simMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚡ Live What-If Simulator
          </button>
        </div>
      </div>

      {/* Simulator Inputs or Issue Selector */}
      <div className="metric-card bg-white border border-emerald-100 shadow-sm">
        {simMode ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-3">
              <Sliders size={14} /> Interactive Scenario Simulator (Powered by XGBoost)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Crop Type</label>
                <select value={simCrop} onChange={e => setSimCrop(e.target.value)} className="farm-input text-xs py-1.5">
                  {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Field Area (Acres)</label>
                <input type="number" min="0.1" step="0.5" value={simArea} onChange={e => setSimArea(parseFloat(e.target.value))} className="farm-input text-xs py-1.5" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Disease Severity</label>
                <select value={simSev} onChange={e => setSimSev(e.target.value)} className="farm-input text-xs py-1.5">
                  {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Canopy Affected (%)</label>
                <input type="number" min="5" max="95" value={simAffPct} onChange={e => setSimAffPct(parseFloat(e.target.value))} className="farm-input text-xs py-1.5" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Growth Stage</label>
                <select value={simStage} onChange={e => setSimStage(e.target.value)} className="farm-input text-xs py-1.5">
                  {STAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Select Farm Issue</label>
              <select value={selectedIssueId} onChange={e => setSelectedIssueId(e.target.value)} className="farm-input">
                <option value="">— Use Active Farm (Top Issue) —</option>
                {issues.map(i => (
                  <option key={i.id} value={i.id}>{i.issue_name} ({i.priority_category}) · {i.field_name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-600">Days Untreated Simulation</label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{days} Days</span>
              </div>
              <input type="range" min="0" max="25" value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full accent-emerald-600" />
            </div>
            <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              ⚡ <strong>XGBoost Regressor:</strong> Continuously recalculating non-linear pathogen propagation curves based on {days} days delay.
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="spinner w-10 h-10" style={{ borderWidth: 3 }} />
        </div>
      ) : !data || data.message ? (
        <div className="empty-state metric-card">
          <Sprout size={40} className="text-emerald-300 mb-4" />
          <h2 className="text-base font-bold text-gray-800 mb-1">No Active Threats Selected</h2>
          <p className="text-gray-500 text-xs max-w-sm mb-4">Select an issue above or switch to the What-If Simulator to run live XGBoost yield projections.</p>
          <button onClick={() => setSimMode(true)} className="btn-primary text-xs">
            Open XGBoost Simulator
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Projected Economic Loss', 
                value: `₹${(data.est_financial_loss || 0).toLocaleString('en-IN')}`, 
                sub: `Total revenue at risk`, 
                icon: IndianRupee, 
                color: '#dc2626', 
                bg: '#fef2f2' 
              },
              { 
                label: 'Projected Yield Loss', 
                value: `${data.projected_yield_loss_pct}%`, 
                sub: `XGBoost ML predicted`, 
                icon: TrendingDown, 
                color: '#ea580c', 
                bg: '#fff7ed' 
              },
              { 
                label: 'Est. Treatment Cost', 
                value: `₹${(data.treatment_cost || 0).toLocaleString('en-IN')}`, 
                sub: `Application & spray cost`, 
                icon: Target, 
                color: '#2563eb', 
                bg: '#eff6ff' 
              },
              { 
                label: 'Net Avoidable Loss (Saved)', 
                value: `₹${(data.potential_savings || 0).toLocaleString('en-IN')}`, 
                sub: `Saved by intervening now`, 
                icon: ShieldCheck, 
                color: '#059669', 
                bg: '#ecfdf5' 
              },
            ].map(m => (
              <div key={m.label} className="metric-card border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-500">{m.label}</span>
                  <div className="p-1.5 rounded-lg" style={{ background: m.bg }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] text-gray-400 mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Machine Learning Model Card & Warning */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Warning Banner */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center gap-4">
              <Clock size={28} className="text-red-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-red-800">
                  Critical Impact Window: ~{data.days_until_critical_impact} Days Remaining
                </div>
                <div className="text-xs text-red-600 mt-0.5 leading-relaxed">
                  If left untreated for <strong>{days} days</strong>, the XGBoost regressor estimates crop damage will cause a <strong>₹{(data.est_financial_loss || 0).toLocaleString('en-IN')}</strong> economic deficit ({data.projected_yield_loss_pct}% yield loss).
                </div>
              </div>
            </div>

            {/* Model Info Card */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <Cpu size={14} className="text-emerald-700" /> Model Architecture
                </div>
                <div className="text-sm font-extrabold text-emerald-800">{data.algorithm || 'XGBoost Regressor (v3.2.0)'}</div>
                <div className="text-[10px] text-emerald-600 mt-1">
                  80 gradient-boosted decision trees · Depth 4 · ICAR & agronomy extension loss calibration
                </div>
              </div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-2">
                ✓ Inference Time: &lt;12ms
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          {chartData && (
            <div className="metric-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">📈 XGBoost Yield & Economic Loss Trajectory</div>
                  <div className="text-[11px] text-gray-400">Comparing yield degradation vs. financial loss over 0 to 20 days untreated</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Dual-Axis Chart
                </span>
              </div>
              <div style={{ height: 260 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* XGBoost Feature Importance Breakdown & ROI */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Feature Importance */}
            <div className="metric-card">
              <div className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" /> Explainable AI: Loss Drivers
              </div>
              <p className="text-[11px] text-gray-400 mb-3">Relative contribution of agronomic factors to this predicted loss:</p>
              
              <div className="space-y-2.5">
                {Object.entries(data.feature_importances || {}).map(([feat, pct]) => (
                  <div key={feat}>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-0.5">
                      <span>{feat}</span>
                      <span className="text-emerald-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-1.5 rounded-full" style={{ width: `${Math.min(pct * 2, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment ROI Analysis */}
            <div className="metric-card bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-emerald-900 mb-1">💡 Economic Treatment ROI</div>
                <p className="text-xs text-emerald-700 mb-4">Every rupee invested in timely treatment delivers exponential savings.</p>

                <div className="grid grid-cols-3 gap-3 text-center bg-white/80 p-3 rounded-xl border border-emerald-100 mb-4">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Cost to Treat</div>
                    <div className="text-lg font-black text-blue-600">₹{(data.treatment_cost || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex items-center justify-center text-xl font-bold text-emerald-400">
                    →
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Loss Prevented</div>
                    <div className="text-lg font-black text-emerald-600">₹{(data.potential_savings || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-100/60 rounded-xl text-center">
                <span className="text-xs font-bold text-emerald-800">
                  Intervention ROI: ~{data.treatment_cost > 0 ? Math.round(((data.potential_savings) / data.treatment_cost) * 100) : 100}% Return on Treatment Investment
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
