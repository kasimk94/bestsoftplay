import dynamic from 'next/dynamic'

const VenueMapInner = dynamic(() => import('./VenueMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-2xl bg-[#EDE9FF] flex items-center justify-center text-gray-400 animate-pulse">
      <div className="text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm font-medium text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
})

export default VenueMapInner
