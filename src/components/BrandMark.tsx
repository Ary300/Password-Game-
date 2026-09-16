export default function BrandMark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className="leading-none">
        <div className="font-serif text-xl text-gold italic">Park Tudor School</div>
        <div className="mt-2 text-[clamp(64px,11vw,180px)] font-black tracking-[-0.04em] wdth-wide">Password</div>
      </div>
    )
  }
  return (
    <div className="flex items-baseline gap-2 leading-none">
      <span className="text-xl font-black tracking-tight wdth-wide">Password</span>
      <span className="hidden font-serif text-sm text-gold italic sm:inline">Park Tudor</span>
    </div>
  )
}
