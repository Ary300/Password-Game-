export default function BrandMark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className="leading-none">
        <div className="font-display text-2xl font-extrabold text-gold">Park Tudor Panthers</div>
        <div className="display mt-1 text-[clamp(88px,13vw,220px)]">Password</div>
      </div>
    )
  }
  return (
    <div className="flex items-baseline gap-2 leading-none">
      <span className="display text-3xl">Password</span>
      <span className="hidden bg-crimson px-1.5 py-0.5 font-display text-sm font-extrabold text-white sm:inline">Park Tudor</span>
    </div>
  )
}
