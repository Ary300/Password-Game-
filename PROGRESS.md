# Progress

## Game loop, restated

Teams take turns. On a turn, one student (the guesser) faces the class with their back to the projector. The screen shows a word and a countdown. Teammates shout one-word clues that are not the word, do not contain it, and are not an obvious variant. If the guesser says the word before the clock hits zero, the team scores. The teacher presses Enter for a correct guess, S to skip, Space to pause, and the next team is up. A round is one turn per team. After the last round the podium shows the winners. Within a team the guesser role rotates so every player guesses before anyone repeats.

## Decisions the PRD did not settle

Each one picked the option that is simplest for a teacher standing at a projector.

- **Where players are unnamed.** If a team has no student names, the guesser is shown as "Guesser 1", "Guesser 2", and rotation is by turn count. The TeamUp screen still shows who is up.
- **Widening the filter one step.** Order of loosening when the pool drops under 10 words: category → difficulty → word length → syllables. Each step is reported on the TeamUp warning so the teacher knows what changed.
- **Multi-word mode scoring.** Each correct guess in one turn is its own history row with the same round and team, so points and correct counts stay derived from history.
- **Time bonus in multi-word mode.** Bonus is computed from seconds left at the moment of each correct guess.
- **N key.** On TeamUp, N (and Space) starts the turn. On Live after the turn ends, N advances to the next team. Esc on Live ends the turn early and records it as time up with 0 points.
- **Unlimited rounds.** The game keeps going until the teacher presses End game on the leaderboard.
- **Difficulty "Medium" default.** Medium includes only medium-tier words. "Mixed" includes all tiers.
- **Custom word list.** Pasted words get syllables from the same vowel-group heuristic the build script uses, tier "medium", category "custom". A toggle chooses replace vs add.
- **Score edit.** Editing a team's total adds a synthetic history row (outcome "adjust") with the point delta, so the log shows the edit and totals stay derived.
- **Theme.** Dark by default (projector friendly). Toggle lives in the top bar and persists.

## Done

- Phase 0: Vite + React + TypeScript + Tailwind v4 + Zustand + React Router (hash) scaffold, five routes with headings, bundled fonts (Inter, Outfit) so the app works offline.

## Next

- Phase 1: word list source, build script, words.json, pickWord.
