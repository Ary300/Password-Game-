import { useGameStore } from '../../store/useGameStore'
import { roundsLabel, wordFilterLabels } from './setupHelpers'

export default function SettingsSummary() {
  const theSettings = useGameStore((theState) => theState.settings)
  const theTeams = useGameStore((theState) => theState.teams)
  const setSettingsOpen = useGameStore((theState) => theState.setSettingsOpen)

  let theTeamCount = theTeams.length
  if (theTeamCount < 2) {
    theTeamCount = theSettings.teamCount
  }
  const theStats = [
    { label: 'Seconds', value: String(theSettings.turnSeconds) },
    { label: 'Rounds', value: roundsLabel(theSettings) },
    { label: 'Teams', value: String(theTeamCount) },
  ]
  const theStatItems = []
  for (let n = 0; n < theStats.length; n++) {
    let theValueSize = 'text-5xl 2xl:text-7xl'
    if (theStats[n].value.length > 3) {
      theValueSize = 'text-4xl 2xl:text-5xl'
    }
    theStatItems.push(
      <div key={theStats[n].label} className="flex min-w-0 flex-col-reverse">
        <dt className="mt-1 text-sm font-semibold text-white/75">{theStats[n].label}</dt>
        <dd className={'display ' + theValueSize}>{theStats[n].value}</dd>
      </div>,
    )
  }

  return (
    <div className="stripes bg-crimson-deep pt-5 pr-16 pb-5 pl-7 xl:pr-20 xl:pl-10">
      <div className="flex items-end gap-5">
        <dl className="flex gap-5 2xl:gap-8">{theStatItems}</dl>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="ml-auto h-11 shrink-0 border-b-4 border-[#1a0606] bg-[#1a0606] px-3 font-display text-lg font-extrabold 2xl:px-4 2xl:text-xl text-white transition-colors hover:bg-black"
        >
          Change settings
        </button>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-white/80">{wordFilterLabels(theSettings).join(' / ')}</p>
    </div>
  )
}
