export type ScreenMode = 'control' | 'projector'

export default function LiveScreen({ mode }: { mode: ScreenMode }) {
  return <section className="flex h-full items-center justify-center text-4xl font-bold">{mode}</section>
}
