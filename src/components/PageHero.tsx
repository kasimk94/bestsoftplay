import Breadcrumb from './Breadcrumb'

interface Crumb {
  label: string
  href?: string
}

export default function PageHero({
  crumbs,
  title,
  subtitle,
}: {
  crumbs: Crumb[]
  title: React.ReactNode
  subtitle?: string
}) {
  return (
    <div
      className="pt-12 pb-10 px-4"
      style={{ background: 'linear-gradient(160deg, #EDE9FF 0%, #F5EEFF 40%, #FFF0E8 100%)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Breadcrumb crumbs={crumbs} />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
          {title}
        </h1>
        {subtitle && <p className="text-lg text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}
