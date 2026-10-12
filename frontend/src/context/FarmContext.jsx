import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const FarmContext = createContext(null)

export function FarmProvider({ children }) {
  const { user } = useAuth()
  const [farms, setFarms] = useState([])
  const [activeFarm, setActiveFarm] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchFarms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.get('/farms/')
      setFarms(res.data)
      if (res.data.length > 0 && !activeFarm) {
        setActiveFarm(res.data[0])
      }
    } catch (err) {
      console.error('Failed to fetch farms', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFarms()
  }, [fetchFarms])

  return (
    <FarmContext.Provider value={{ farms, activeFarm, setActiveFarm, loading, fetchFarms }}>
      {children}
    </FarmContext.Provider>
  )
}

export const useFarm = () => useContext(FarmContext)
