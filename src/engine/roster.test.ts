import { describe, expect, it } from 'vitest'
import { absentIds, defaultTeams, makeClass, parseNames, presentStudents, splitIntoTeams } from './roster'

describe('roster helpers', () => {
  it('parses names from lines or commas and drops duplicates', () => {
    expect(parseNames('Ana\nBen, Cy\n\n ana \nDee')).toEqual(['Ana', 'Ben', 'Cy', 'Dee'])
  })
  it('gives default names and distinct colors', () => {
    const theTeams = defaultTeams(3)
    expect(theTeams[2].name).toBe('Team 3')
    expect(theTeams[0].color).not.toBe(theTeams[1].color)
  })
  it('builds a class and tracks absences', () => {
    const theClass = makeClass('Period 2', 'Ana\nBen\nCy')
    theClass.students[1] = { ...theClass.students[1], absent: true }
    expect(presentStudents(theClass).length).toBe(2)
    expect(absentIds(theClass)).toEqual([theClass.students[1].id])
  })
  it('splits 24 students into 4 even teams with everyone placed once', () => {
    const theNames: string[] = []
    for (let n = 0; n < 24; n++) {
      theNames.push('S' + String(n))
    }
    const theClass = makeClass('Big', theNames.join('\n'))
    const theTeams = splitIntoTeams(theClass.students, 4, Math.random, [])
    let theTotal = 0
    for (let n = 0; n < theTeams.length; n++) {
      expect(theTeams[n].players.length).toBe(6)
      theTotal = theTotal + theTeams[n].players.length
    }
    expect(theTotal).toBe(24)
  })
  it('keeps sizes within one for uneven splits', () => {
    const theClass = makeClass('Odd', 'A\nB\nC\nD\nE')
    const theTeams = splitIntoTeams(theClass.students, 2, () => 0.3, [])
    expect(Math.abs(theTeams[0].players.length - theTeams[1].players.length)).toBeLessThanOrEqual(1)
  })
})
