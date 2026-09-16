import { describe, expect, it } from 'vitest'
import { checkClue, levenshtein, parseBannedList, stripSuffix } from './clueCheck'

const theKnown = ['sun', 'flower', 'sunflower', 'basket', 'ball', 'basketball', 'jump', 'jumping', 'happy', 'unhappy', 'teacher', 'teach']

describe('checkClue rules', () => {
  it('rule 1: flags the word itself, ignoring case and punctuation', () => {
    const theVerdict = checkClue('Banana!', 'banana', [], theKnown)
    expect(theVerdict.allowed).toBe(false)
    expect(theVerdict.reasons[0]).toContain('is the word itself')
  })
  it('rule 2: flags a clue that contains the word or is contained by it (4+ letters)', () => {
    expect(checkClue('bananas', 'banana', [], theKnown).allowed).toBe(false)
    expect(checkClue('bananasplit', 'banana', [], theKnown).reasons.join(' ')).toContain('contains the word')
    expect(checkClue('tele', 'telescope', [], theKnown).reasons.join(' ')).toContain('contains the clue')
    expect(checkClue('ear', 'bear', [], theKnown).allowed).toBe(false)
    expect(checkClue('at', 'catalog', [], theKnown).allowed).toBe(true)
  })
  it('rule 3: flags a shared stem after stripping common suffixes', () => {
    const theVerdict = checkClue('jumping', 'jumped', [], theKnown)
    expect(theVerdict.allowed).toBe(false)
    expect(theVerdict.reasons.join(' ')).toContain('Same root word')
    expect(stripSuffix('happiest')).toBe('happi')
    expect(stripSuffix('quickly')).toBe('quick')
    expect(checkClue('running', 'run', [], theKnown).allowed).toBe(false)
    expect(stripSuffix('running')).toBe('run')
    expect(stripSuffix('falling')).toBe('fall')
  })
  it('rule 4: flags clues within Levenshtein distance 2 for words of 5+ letters', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    const theVerdict = checkClue('bannana', 'banana', [], theKnown)
    expect(theVerdict.allowed).toBe(false)
    expect(theVerdict.reasons.join(' ')).toContain('letter or two away')
    expect(checkClue('cab', 'cat', [], theKnown).allowed).toBe(true)
  })
  it('rule 5: flags compound parts', () => {
    const theSun = checkClue('sun', 'sunflower', [], theKnown)
    expect(theSun.allowed).toBe(false)
    expect(theSun.reasons.join(' ')).toContain('compound')
    const theFlower = checkClue('flower', 'sunflower', [], theKnown)
    expect(theFlower.allowed).toBe(false)
    expect(theFlower.reasons.join(' ')).toContain('compound')
  })
  it('allows rhymes and unrelated words', () => {
    expect(checkClue('yellow', 'banana', [], theKnown).allowed).toBe(true)
    expect(checkClue('bandana', 'banana', [], theKnown).allowed).toBe(false)
    expect(checkClue('monkey', 'banana', [], theKnown).allowed).toBe(true)
  })
  it('respects the custom banned list', () => {
    const theVerdict = checkClue('yellow', 'banana', parseBannedList('Yellow\nmonkey, fruit'), theKnown)
    expect(theVerdict.allowed).toBe(false)
    expect(theVerdict.reasons[0]).toContain('banned list')
  })
})
