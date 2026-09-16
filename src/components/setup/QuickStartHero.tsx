import { findClass, teamsUseClass, useGameStore } from '../../store/useGameStore'
import SettingsSummary from './SettingsSummary'
import { teamNamesSentence } from './setupHelpers'

export default function QuickStartHero() {
  const theTeams = useGameStore((theState) => theState.teams)
  const theClasses = useGameStore((theState) => theState.classes)
  const theActiveClassId = useGameStore((theState) => theState.activeClassId)
  const thePhase = useGameStore((theState) => theState.game.phase)
  const quickGame = useGameStore((theState) => theState.quickGame)

  // Mirrors quickGame so the teacher knows who is about to play before pressing Start.
  let theCaption = teamNamesSentence(theTeams)
  const theClass = findClass(theClasses, theActiveClassId)
  if (theClass !== null && teamsUseClass(theTeams, theClass)) {
    theCaption = theCaption + ' from ' + theClass.name
  }

  let theNotice = null
  if (thePhase !== 'setup') {
    theNotice = <p className="mt-1 font-bold text-white">A game is running. Starting again ends it.</p>
  }

  return (
    <section className="@container varsity-cut mesh flex h-full min-h-0 flex-col bg-crimson text-white" aria-labelledby="setup-title">
      <div className="flex min-h-0 flex-1 flex-col pt-6 pr-14 pl-7 xl:pt-8 xl:pr-20 xl:pl-10">
        <p className="font-display text-2xl font-extrabold text-gold xl:text-3xl">Park Tudor Panthers</p>
        <h1 id="setup-title" className="display -ml-1 text-[clamp(88px,23cqw,300px)] leading-[0.8]">
          Password
        </h1>
        <p className="mt-3 text-lg font-semibold text-white/90 xl:text-2xl">Mr. Ritz's classroom word game</p>

        <div className="mt-auto pt-5 pb-6">
          <button
            type="button"
            onClick={() => quickGame()}
            aria-keyshortcuts="Enter"
            className="flex h-28 w-full items-center justify-between gap-4 whitespace-nowrap border-b-8 border-[#1a0606] bg-white px-7 text-[#95271a] transition-colors select-none hover:bg-[#fff4d6] active:translate-y-1 active:border-b-4 2xl:h-52 2xl:px-10"
          >
            <span className="display text-6xl 2xl:text-8xl">Start game</span>
            <kbd className="border-2 border-current px-2.5 py-1.5 font-sans text-base leading-none font-bold 2xl:text-2xl">Enter</kbd>
          </button>
          <p className="mt-3 text-base text-white/90 xl:text-lg">
            <span className="font-bold text-white">Plays with </span>
            {theCaption}
          </p>
          {theNotice}
        </div>
      </div>

      <SettingsSummary />
    </section>
  )
}
