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

- Phase 0 to 8 and 11 to 13: scaffold, 23,391-word school-safe list, engine with 51 unit tests, store, all five screens, settings drawer, clue checker, shortcuts overlay, classes and rosters, swap, career card, undo, class board, quick game, projector window.
- Park Tudor varsity scoreboard design, with a separate design critique pass.
- Phase 9: GitHub Pages workflow (manual trigger) and README teacher guide. Pages is not enabled yet because the game runs on localhost for now.

## Acceptance checklist (PRD section 10), run by a QA agent in a real browser

| Item | Result |
|---|---|
| First open, Start twice, playable Live screen | Pass |
| Word readable on a 1080p projector (324 px word, 295 px timer) | Pass |
| Timer within 50 ms over 20 s | Fixed: time up was 70 to 96 ms late; now fires on a timeout at the exact deadline and records the deadline |
| Enter, S, Space, N, Esc, and no firing in text fields | Fixed: Esc used to close a dialog also ended the turn |
| Refresh mid-turn keeps word and time | Pass |
| No repeats; small-pool warning | Fixed: warning now shows when fewer than 10 words remain, including tiny custom lists |
| Filters alone and combined | Pass |
| Guesser rotation cycles everyone first | Pass |
| Leaderboard order points, correct, fewest skips | Pass |
| Score edit updates leaderboard and podium | Pass |
| Five clue rules tested with reasons | Pass, plus doubled-consonant stems ("running" and "run") and 3-letter parts ("ear" in "bear") |
| Zero TypeScript and console errors | Pass |
| Deployed URL offline | Not run: the app is not deployed yet |

Other QA fixes: Enter on the podium no longer wipes results while a teacher is still pressing Enter, a turn keeps the length it started with, undo no longer reaches into a turn that ran out of time, and podium copy.

## Next

- Enable GitHub Pages and run the deploy workflow when the class wants a public link.
