import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import ConnectApiState from '../components/ConnectApiState'
import EmptyState from '../components/EmptyState'
import PriorityBadge from '../components/PriorityBadge'
import { Sparkles, AlertTriangle, Leaf, FlaskConical, Droplets, Clock, ShieldCheck, CloudSun, Flame } from 'lucide-react'

export default function RescuePlanner() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [priorities, setPriorities] = useState([])
  const [selected, setSelected] = useState(scanId ? Number(scanId) : null)
  const [plan, setPlan] = useState(null)
  const [connected, setConnected] = useState(true)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    client.get('/priority').then((res) => {
      setPriorities(res.data)
      if (!selected && res.data.length > 0) setSelected(res.data[0].scan_id)
    }).finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setPlan(null)
    client.get(`/rescue/${selected}`).then((res) => {
      setConnected(res.data.connected)
      setReason(res.data.reason)
      setPlan(res.data.plan)
    }).finally(() => setLoading(false))
  }, [selected])

  if (listLoading) return <div className="text-earth-800/50">Loading…</div>

  if (priorities.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No issues to plan for yet"
        message="Scan a crop first, then come back for an AI-generated rescue plan."
        action={<a href="/scanner" className="btn-primary">Go to Crop Scanner</a>}
      />
    )
  }

  const current = priorities.find((p) => p.scan_id === selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-earth-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-farm-600" /> AI Rescue Planner
        </h1>
        <p className="text-sm text-earth-800/50">Personalized treatment plans for your active issues</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {priorities.map((p) => (
          <button
            key={p.scan_id}
            onClick={() => setSelected(p.scan_id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              selected === p.scan_id ? 'bg-farm-600 text-white border-farm-600' : 'bg-white border-farm-200 text-earth-800/70'
            }`}
          >
            {p.disease_name}
          </button>
        ))}
      </div>

      {current && (
        <div className="card flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-earth-800">{current.disease_name}</p>
            <p className="text-xs text-earth-800/50">{current.field_name} · {current.crop}</p>
          </div>
          <PriorityBadge tier={current.tier} score={current.score} />
        </div>
      )}

      {loading && <div className="text-earth-800/50">Generating rescue plan…</div>}

      {!loading && !connected && (
        <ConnectApiState
          title="AI Rescue Planner needs Groq connected"
          reason={reason || 'Add your Groq API key to generate a live, personalized rescue plan.'}
          envVar="GROQ_API_KEY"
        />
      )}

      {!loading && connected && plan && (
        <div className="grid sm:grid-cols-2 gap-4">
          <PlanCard icon={AlertTriangle} title="Immediate Action" text={plan.immediate_action} color="text-red-600" />
          <PlanCard icon={Leaf} title="Organic Treatment" text={plan.organic_treatment} color="text-farm-600" />
          <PlanCard icon={FlaskConical} title="Chemical Treatment" text={plan.chemical_treatment} color="text-purple-600" />
          <PlanCard icon={Droplets} title="Application Guidance" text={plan.application_guidance} color="text-blue-600" />
          <PlanCard icon={Clock} title="Recovery Time" text={plan.recovery_time} color="text-orange-600" />
          <PlanCard icon={ShieldCheck} title="Prevention" text={plan.prevention} color="text-farm-700" />
          <PlanCard icon={CloudSun} title="Weather Consideration" text={plan.weather_consideration} color="text-sky-600" full />
        </div>
      )}
    </div>
  )
}

function PlanCard({ icon: Icon, title, text, color, full }) {
  return (
    <div className={`card ${full ? 'sm:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="font-bold text-sm text-earth-800">{title}</p>
      </div>
      <p className="text-sm text-earth-800/70 whitespace-pre-line">{text || '—'}</p>
    </div>
  )
}
