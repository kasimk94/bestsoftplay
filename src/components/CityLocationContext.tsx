'use client'

import { createContext, useContext, useState } from 'react'

type LatLng = { lat: number; lng: number }

type CityLocationContextType = {
  userLocation: LatLng | null
  setUserLocation: (loc: LatLng | null) => void
  nearestSortTrigger: number
  triggerNearestSort: () => void
}

const CityLocationContext = createContext<CityLocationContextType>({
  userLocation: null,
  setUserLocation: () => {},
  nearestSortTrigger: 0,
  triggerNearestSort: () => {},
})

export function CityLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [nearestSortTrigger, setNearestSortTrigger] = useState(0)

  const triggerNearestSort = () => setNearestSortTrigger((n) => n + 1)

  return (
    <CityLocationContext.Provider value={{ userLocation, setUserLocation, nearestSortTrigger, triggerNearestSort }}>
      {children}
    </CityLocationContext.Provider>
  )
}

export function useCityLocation() {
  return useContext(CityLocationContext)
}
