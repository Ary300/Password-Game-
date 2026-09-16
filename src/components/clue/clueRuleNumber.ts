// checkClue returns reason sentences only; these prefixes tie each sentence back to its PRD rule number.
const theRulePrefixes: { prefix: string; rule: number }[] = [
  { prefix: 'The clue is the word itself', rule: 1 },
  { prefix: 'The clue contains the word', rule: 2 },
  { prefix: 'The word contains the clue', rule: 2 },
  { prefix: 'Same root word', rule: 3 },
  { prefix: 'Only a letter or two away', rule: 4 },
]

export function clueRuleNumber(theReason: string): number {
  for (let n = 0; n < theRulePrefixes.length; n++) {
    if (theReason.startsWith(theRulePrefixes[n].prefix)) {
      return theRulePrefixes[n].rule
    }
  }
  if (theReason.indexOf('is part of the compound word') !== -1) {
    return 5
  }
  return 0
}
