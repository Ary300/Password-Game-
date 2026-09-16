# Password, Park Tudor edition

A classroom word-guessing game for Mr. Ritz's classes at Park Tudor School. It replaces three browser tabs (a timer, a random word generator, and a leaderboard) with one screen built for the projector.

## The 30-second teacher guide

1. Open the app and press **Start game**. Two teams, a 20-second clock, and every word in the list are ready with no setup.
2. The guesser stands with their back to the screen. Teammates shout one-word clues.
3. Press **Enter** when they get it. The team gets a new word and keeps going until time runs out.
4. When the buzzer sounds, the next team is up automatically after a short hand-off countdown. Press **H** to hold it or **Space** to start now.
5. After the last round the podium shows the winners.

Stuck on a disputed clue? Press **C** and type it in. Forgot a key? Press **?**.

| Key | Team up | Live |
|---|---|---|
| Space | Start turn | Pause or resume |
| Enter | Start turn | Correct |
| S | | Skip word |
| Esc | | End turn |
| G | Pick guesser | Swap guesser |
| H | Hold the hand-off | |
| U | Undo | Undo |
| L | Leaderboard | Leaderboard |

## Classes

On the Setup screen, open **Classes**, name the class, and paste student names one per line. Mark anyone absent today, split the room into teams with one button, and start a class game. Lifetime stats and the class board fill in as you play.

## Projector window

The monitor icon in the top bar opens a second window that shows only the game. Drag it to the projector and keep controls on the laptop.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine unit tests
npm run build        # static files in dist/, works from a USB stick or any static host
npm run build-words  # rebuild src/data/words.json from words/source.txt, CMUdict, and a frequency list
```

To publish on GitHub Pages, enable Pages with GitHub Actions as the source in the repository settings, then run the "Deploy to GitHub Pages" workflow.
