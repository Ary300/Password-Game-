# Progress

## Game loop, restated

Teams take turns at the projector. The guesser faces away from the screen while teammates shout one-word clues for the word shown. The clock runs for the whole turn: every correct guess (Enter) scores and brings a new word, a skip (S) swaps the word within the skip limit, and when the buzzer sounds the word is revealed for two seconds. The next team's hand-off screen then counts down and starts their turn on its own, so the game keeps cycling through teams until the rounds are done and the podium appears. Inside each team the guesser rotates to whoever has guessed the fewest times.

## Decisions the PRD did not settle

Each one picks the option that is simplest for a teacher standing at a projector.

- **Turn length drives the hand-off (user request).** Default is "keep guessing until time runs out" plus auto hand-off with a 5 s countdown. One-word-per-turn and manual hand-off are settings.
- **Every word in play (user request).** The list is expanded well past the PRD's 1,500 to 2,500 target to the full school-safe common vocabulary, and the default difficulty is All so syllables become the main filter. Curated words keep their categories and the rest are "Everything else".
- **Skip does not end the turn.** The state diagram shows Skip ending the turn, but a per-turn skip limit only makes sense if skipping swaps the word, so it does.
- **Esc ends the turn** and records it as time up with 0 points and the note "Ended early".
- **Widening order** when fewer than 10 words remain: categories, then difficulty, then word length, then syllables. If every word has been used the list restarts and the Team up screen says so.
- **Custom words** skip all filters, since the teacher typed them on purpose.
- **Players are objects with ids** instead of plain strings so class rosters, absences, and career stats survive renames.
- **Score edits** add an "adjust" history row with the delta and a note, so totals stay derived from history.
- **Undo** reaches back within the current turn and its aftermath, and lands on the paused moment before the action.
- **Career stats and class totals** commit once when a game ends (podium, play again, or new game). Mid-game cards add the uncommitted game on top.
- **Two-screen mode** syncs through localStorage change events, which work the same as BroadcastChannel for two windows in one browser and need no extra code path.
- **Sounds** only play in the teacher's window so a projector window on the same laptop does not double them.
- **Theme** is dark by default for projection, with a light theme in the top bar.
- **Branding** uses Park Tudor crimson and gold from parktudor.org, with Libre Baskerville only in the school wordmark.

## Done

- Phase 0: Vite, React, TypeScript, Tailwind v4, Zustand, React Router (hash) scaffold.
- Phase 1: Word list build script from CMUdict and frequency data, pickWord with filters and no repeats.
- Engine: scoring, ranking, timer math, clue checker, rotation, rosters, careers, class board, CSV, with Vitest coverage.
- Store: full turn flow, auto hand-off, classes, swap, undo, persistence.
- Sounds: countdown beeps, last-five-seconds ticks, time-up buzzer, correct chime, skip, podium fanfare.

## In progress

- Screens: Setup and classes, Team up, Live, Leaderboard, Podium, settings drawer, clue checker, shortcuts overlay.
- Expanded word list.
- Review pass and acceptance checklist.
