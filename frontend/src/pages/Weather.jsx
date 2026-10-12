import React, { useEffect, useState } from 'react'
import client from '../api/client'
import ConnectApiState from '../components/ConnectApiState'
import EmptyState from '../components/EmptyState'
import { CloudSun, Droplets, Wind, ThermometerSun, Tractor } from 'lucide-react'

export default function Weather() {
  const [farms, setFarms] = useState([])
  const [farmId, setFarmId] = useState('')
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(true)
  const [reason, setReason] = useState('')
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/farms').then((res) => {
      setFarms(res.data)
      if (res.data.length > 0) setFarmId(String(res.data[0].id))
      else setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!farmId) return
    setLoading(true)
    client.get('/weather', { params: { farm_id: farmId } }).then((res) => {
      setConnected(res.data.connected)
      setReason(res.data.reason)
      setData(res.data.data)
      setInsights(res.data.insights || [])
    }).finally(() => setLoading(false))
  }, [farmId])

  if (farms.length === 0 && !loading) {
    return (
      <EmptyState icon={Tractor} title="No farms yet" message="Add a farm with a location to see live weather."
        action={<a href="/farms" className="btn-primary">Go to My Farms</a>} />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-earth-800 flex items-center gap-2">
          <CloudSun className="w-6 h-6 text-sky-500" /> Weather Intelligence
        </h1>
        <p className="text-sm text-earth-800/50">Live conditions for your farm location</p>
      </div>

      {farms.length > 0 && (
        <select className="input max-w-xs" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
          {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}

      {loading && <div className="text-earth-800/50">Loading weather…</div>}

      {!loading && !connected && (
        <ConnectApiState
          title="Weather Intelligence needs OpenWeatherMap connected"
          reason={reason || 'Add your OpenWeatherMap API key and set a farm location.'}
          envVar="OPENWEATHER_API_KEY"
        />
      )}

      {!loading && connected && data && (
        <>
          <div className="card bg-gradient-to-br from-farm-600 to-farm-700 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-farm-100">Current Conditions</p>
                <p className="text-4xl font-extrabold mt-1">{Math.round(data.temperature)}°C</p>
                <p className="capitalize text-farm-100">{data.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><Droplets className="w-5 h-5 mx-auto mb-1" /><p className="text-xs">{data.humidity}%</p></div>
                <div><Wind className="w-5 h-5 mx-auto mb-1" /><p className="text-xs">{data.wind_speed} m/s</p></div>
                <div><ThermometerSun className="w-5 h-5 mx-auto mb-1" /><p className="text-xs">{data.rain_probability}% rain</p></div>
              </div>
            </div>
          </div>

          {insights.length > 0 && (
            <div className="card">
              <p className="font-semibold text-earth-800 mb-3">AI Weather Insights</p>
              <ul className="space-y-2">
                {insights.map((i, idx) => (
                  <li key={idx} className="text-sm bg-sky-50 text-sky-800 rounded-xl px-3 py-2">{i}</li>
                ))}
              </ul>
            </div>
          )}

          {data.forecast?.length > 0 && (
            <div className="card overflow-x-auto">
              <p className="font-semibold text-earth-800 mb-3">Forecast</p>
              <div className="flex gap-3 min-w-max">
                {data.forecast.map((f, i) => (
                  <div key={i} className="bg-farm-50 rounded-xl p-3 text-center w-24 shrink-0">
                    <p className="text-[11px] text-earth-800/50">{f.time.split(' ')[1]?.slice(0, 5)}</p>
                    <p className="font-bold text-sm mt-1">{Math.round(f.temp)}°C</p>
                    <p className="text-[11px] text-earth-800/50 mt-1">{f.rain_probability}% rain</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
