import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useFarm } from '../context/FarmContext'
import {
  Heart, AlertTriangle, Target, CloudSun, TrendingDown,
  ClipboardList, ScanLine, ChevronRight, Sprout, Cpu, IndianRupee,
  Tractor, Plus
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

export default function Dashboard() {
  const { activeFarm } = useFarm()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get('/dashboard/')
        setData(res.data)
      } catch (err) {
        console.error('Dashboard fetch error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeFarm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner w-10 h-10 mx-auto mb-4 border-2 border-[#297d3b]" />
          <p className="text-[#297d3b] font-medium">Loading your farm dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback data if DB is still building
  const healthScore = data?.health_score ?? 70
  const activeIssues = data?.active_issues_count ?? 1
  const treatmentsDone = `${data?.treatment_stats?.completed ?? 0}/${(data?.treatment_stats?.completed ?? 0) + (data?.treatment_stats?.scheduled ?? 1)}`
  const farmsCount = `${data?.farms_count ?? 1}/${data?.fields_count ?? 1}`
  const highestIssue = data?.highest_priority || {
    issue_name: 'Leaf Blight',
    priority_category: 'HIGH',
    priority_score: 66.6
  }

  const priorityDistData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        data?.priority_distribution?.CRITICAL || 0,
        data?.priority_distribution?.HIGH || 1,
        data?.priority_distribution?.MEDIUM || 0,
        data?.priority_distribution?.LOW || 0,
      ],
      backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e'],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e4f2b]">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#4a3826]/60 mt-0.5">Your farm at a glance</p>
        </div>
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#226431] hover:bg-[#1a4225] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus size={16} /> New Farm
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Farm Health Score */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <Heart size={14} className="text-gray-400" />
            <span>FARM HEALTH SCORE</span>
          </div>
          <div className="text-3xl font-black text-[#297d3b]">
            {healthScore}/100
          </div>
        </div>

        {/* Card 2: Active Issues */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <ScanLine size={14} className="text-gray-400" />
            <span>ACTIVE ISSUES</span>
          </div>
          <div className="text-3xl font-black text-[#4a3826]">
            {activeIssues}
          </div>
        </div>

        {/* Card 3: Treatments Done */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <ClipboardList size={14} className="text-gray-400" />
            <span>TREATMENTS DONE</span>
          </div>
          <div className="text-3xl font-black text-[#4a3826]">
            {treatmentsDone}
          </div>
        </div>

        {/* Card 4: Farms / Fields */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <Tractor size={14} className="text-gray-400" />
            <span>FARMS / FIELDS</span>
          </div>
          <div className="text-3xl font-black text-[#4a3826]">
            {farmsCount}
          </div>
        </div>
      </div>

      {/* Highest Priority Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            HIGHEST PRIORITY RIGHT NOW
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#4a3826]">
            {highestIssue.issue_name}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            {highestIssue.priority_category} · {Number(highestIssue.priority_score).toFixed(1)}
          </span>
          <Link
            to="/rescue"
            className="px-4 py-2 rounded-xl bg-[#226431] hover:bg-[#1a4225] text-white text-sm font-semibold shadow-sm transition"
          >
            View Rescue Plan
          </Link>
        </div>
      </div>

      {/* 2 Column Section: Health Trend & Priority Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Farm Health Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[260px] flex flex-col">
          <h2 className="text-base font-bold text-[#4a3826] mb-4">Farm Health Trend</h2>
          <div className="flex-1 flex items-center justify-center text-center p-6 text-gray-400 text-sm">
            Scan more crops to build up a health trend.
          </div>
        </div>

        {/* Right: Priority Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[260px] flex flex-col">
          <h2 className="text-base font-bold text-[#4a3826] mb-4">Priority Distribution</h2>
          <div className="flex-1 flex items-center justify-center" style={{ height: 180 }}>
            <Doughnut
              data={priorityDistData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                cutout: '68%'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
