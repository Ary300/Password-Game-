import { useGameStore } from '../store/useGameStore'
import ShortcutGroup from './shortcuts/ShortcutGroup'
import Modal from './ui/Modal'

export type Shortcut = {
  keys: string[]
  action: string
}

export type ShortcutGroupData = {
  title: string
  shortcuts: Shortcut[]
}

const theLeftColumn: ShortcutGroupData[] = [
  {
    title: 'Team up',
    shortcuts: [
      { keys: ['Space', 'Enter', 'N'], action: 'Start turn' },
      { keys: ['H'], action: 'Hold or resume' },
      { keys: ['X'], action: 'Skip team' },
      { keys: ['G'], action: 'Pick guesser' },
    ],
  },
  {
    title: 'Live',
    shortcuts: [
      { keys: ['Enter'], action: 'Correct' },
      { keys: ['S'], action: 'Skip word' },
      { keys: ['Space'], action: 'Pause or resume' },
      { keys: ['Esc'], action: 'End turn' },
      { keys: ['G'], action: 'Swap guesser' },
      { keys: ['N'], action: 'Next team (manual hand-off)' },
      { keys: ['+', '-'], action: 'Add or take a point' },
    ],
  },
]

const theRightColumn: ShortcutGroupData[] = [
  {
    title: 'Anywhere',
    shortcuts: [
      { keys: ['U'], action: 'Undo' },
      { keys: ['L'], action: 'Leaderboard, again to go back' },
      { keys: ['C'], action: 'Clue checker' },
      { keys: ['M'], action: 'Mute' },
      { keys: ['F'], action: 'Fullscreen' },
      { keys: ['?'], action: 'This list' },
    ],
  },
  {
    title: 'Setup',
    shortcuts: [{ keys: ['Enter'], action: 'Start quick game' }],
  },
  {
    title: 'Podium',
    shortcuts: [{ keys: ['Enter'], action: 'Play again' }],
  },
]

export default function ShortcutsOverlay() {
  const theOpen = useGameStore((theState) => theState.shortcutsOpen)
  const setShortcutsOpen = useGameStore((theState) => theState.setShortcutsOpen)

  const theLeft = []
  for (let n = 0; n < theLeftColumn.length; n++) {
    theLeft.push(<ShortcutGroup key={theLeftColumn[n].title} group={theLeftColumn[n]} />)
  }
  const theRight = []
  for (let n = 0; n < theRightColumn.length; n++) {
    theRight.push(<ShortcutGroup key={theRightColumn[n].title} group={theRightColumn[n]} />)
  }

  return (
    <Modal open={theOpen} onOpenChange={setShortcutsOpen} title="Keyboard shortcuts" width="max-w-3xl">
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <div className="flex flex-col gap-6">{theLeft}</div>
        <div className="flex flex-col gap-6">{theRight}</div>
      </div>
      <p className="label mt-6">Shortcuts pause while you type in a field.</p>
    </Modal>
  )
}
