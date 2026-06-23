import dynamic from 'next/dynamic'

const CityMapInner = dynamic(() => import('./CityMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-3xl bg-[#EDE9FF] flex items-center justify-center text-gray-400 animate-pulse">
      <div className="text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="font-medium text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
})

export default CityMapInner
