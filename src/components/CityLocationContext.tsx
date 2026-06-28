'use client'

import { createContext, useContext, useState } from 'react'

type LatLng = { lat: number; lng: number }

type CityLocationContextType = {
  userLocation: LatLng | null
  setUserLocation: (loc: LatLng | null) => void
}

const CityLocationContext = createContext<CityLocationContextType>({
  userLocation: null,
  setUserLocation: () => {},
})

export function CityLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)

  return (
    <CityLocationContext.Provider value={{ userLocation, setUserLocation }}>
      {children}
    </CityLocationContext.Provider>
  )
}

export function useCityLocation() {
  return useContext(CityLocationContext)
}
