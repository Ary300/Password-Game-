export type ScreenMode = 'control' | 'projector'

export default function PodiumScreen({ mode }: { mode: ScreenMode }) {
  return <section className="flex h-full items-center justify-center text-4xl font-bold">{mode}</section>
}
