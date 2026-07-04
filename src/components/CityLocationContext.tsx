'use client'
import { createContext, useContext, useState } from 'react'

type LatLng = { lat: number; lng: number }

type CityLocationContextType = {
  userLocation: LatLng | null
  setUserLocation: (loc: LatLng | null) => void
  nearestSortTrigger: number
  triggerNearestSort: () => void
  postcodeQuery: string | null
  setPostcodeQuery: (q: string | null) => void
  searchReset: number
  triggerSearchReset: () => void
}

const CityLocationContext = createContext<CityLocationContextType>({
  userLocation: null, setUserLocation: () => {},
  nearestSortTrigger: 0, triggerNearestSort: () => {},
  postcodeQuery: null, setPostcodeQuery: () => {},
  searchReset: 0, triggerSearchReset: () => {},
})

export function CityLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [nearestSortTrigger, setNearestSortTrigger] = useState(0)
  const [postcodeQuery, setPostcodeQuery] = useState<string | null>(null)
  const [searchReset, setSearchReset] = useState(0)

  const triggerNearestSort = () => setNearestSortTrigger((n) => n + 1)
  const triggerSearchReset = () => setSearchReset((n) => n + 1)

  return (
    <CityLocationContext.Provider value={{
      userLocation, setUserLocation,
      nearestSortTrigger, triggerNearestSort,
      postcodeQuery, setPostcodeQuery,
      searchReset, triggerSearchReset,
    }}>
      {children}
    </CityLocationContext.Provider>
  )
}

export function useCityLocation() { return useContext(CityLocationContext) }
