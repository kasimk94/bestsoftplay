interface SectionCardProps {
  icon: string
  color: string
  title: string
  children: React.ReactNode
}

export default function SectionCard({ icon, color, title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
      </div>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </div>
  )
}
