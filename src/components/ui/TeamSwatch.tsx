export default function TeamSwatch({ color, size = 14 }: { color: string; size?: number }) {
  return <span aria-hidden="true" className="inline-block shrink-0 rounded-full" style={{ backgroundColor: color, width: size, height: size }} />
}
