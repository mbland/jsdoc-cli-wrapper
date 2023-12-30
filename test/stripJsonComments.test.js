/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { stripJsonComments } from '../lib'
import { describe, expect, test } from 'vitest'

describe('stripJsonComments', () => {
  const BASIC_OBJECT = {opts: {destination: 'foo'}}

  test('handles empty string', () => {
    expect(stripJsonComments('')).toBe('')
  })

  test('doesn\'t modify basic object without comments', () => {
    const orig = JSON.stringify(BASIC_OBJECT, null, 2)

    expect(stripJsonComments(orig)).toBe(orig)
  })

  test('doesn\'t modify properly escaped strings', () => {
    const obj = {
      opts: {
        first: 'ignores escaped \\" before the end of the string',
        second: 'ignores escaped \\ before the end of the string \\\\\\\\'
      }
    }
    const orig = JSON.stringify(obj, null, 2)

    expect(stripJsonComments(orig)).toBe(orig)
  })

  test('doesn\'t modify strings containing comment patterns', () => {
    const obj = {
      opts: {
        line: 'looks like a // line comment, but isn\'t',
        block: 'looks like a /* block comment, */ but isn\'t'
      }
    }
    const orig = JSON.stringify(obj, null, 2)

    expect(stripJsonComments(orig)).toBe(orig)
  })

  test('replaces line comments, preserves existing whitespace', () => {
    const orig = [
      '// Frist',
      '{//\tSecond',
      '  // Third\r',
      '  "opts": { // Fourth',
      '    // Fifth',
      '    "destination": "foo" // Sixth',
      '  } // Seventh',
      '  // Eighth',
      '}// Ninth',
      '// Tenth'
    ].join('\n')

    const result = stripJsonComments(orig)

    expect(result).toBe([
      '        ',
      '{  \t      ',
      '          \r',
      '  "opts": {          ',
      '            ',
      '    "destination": "foo"         ',
      '  }           ',
      '           ',
      '}        ',
      '        '
    ].join('\n'))
    expect(JSON.parse(result)).toStrictEqual(BASIC_OBJECT)
  })

  test('replaces block comments, preserves existing whitespace', () => {
    const orig = [
      '/** Frist */',
      '{/*\tSecond',
      '  * Third\r',
      '*/"opts": { /* Fourth',
      '       Fifth*/',
      '/*/ "destination": "foo"/* Sixth */',
      '  } /* Seventh',
      '   /*Eighth*/',
      '}/* Ninth',
      '   Tenth*/'
    ].join('\n')

    const result = stripJsonComments(orig)

    expect(result).toBe([
      '            ',
      '{  \t      ',
      '         \r',
      '  "opts": {          ',
      '              ',
      '    "destination": "foo"           ',
      '  }           ',
      '             ',
      '}        ',
      '          '
    ].join('\n'))
    expect(JSON.parse(result)).toStrictEqual(BASIC_OBJECT)
  })

  test('replaces mixed comments and trailing commas before ] or }', () => {
    const orig = [
      '// Frist',
      '{/* Second',
      '  * //Third',
      '*/"opts": { // Fourth',
      '     //*Fifth',
      '    "destinations": [',
      '      "foo",',
      '      "bar",',
      '      "baz", /* Sixth, with trailing comma for future expansion */',
      '    ],',  // Not a JSON comment, but here's another trailing comma.
      '  },// Seventh, also with trailing comma for future expansion',
      '   /*Eighth*/',
      '} /* Ninth',
      '   Tenth*/'
    ].join('\n')

    const result = stripJsonComments(orig)

    expect(result).toBe([
      '        ',
      '{         ',
      '           ',
      '  "opts": {          ',
      '             ',
      '    "destinations": [',
      '      "foo",',
      '      "bar",',
      '      "baz"                                                       ',
      '    ] ',
      '  }                                                          ',
      '             ',
      '}         ',
      '          '
    ].join('\n'))
    expect(JSON.parse(result)).toStrictEqual({
      opts: { destinations: ['foo', 'bar', 'baz'] }
    })
  })

  test('reopens block comment if character after "*/" is \'*\'', () => {
    const orig = [
      '{/* Frist',
      ' */*',
      '  "opts": {',
      '    "destination": "doesn\'t matter, because commented out"',
      '  }*/',
      '}'
    ].join('\n')

    const result = stripJsonComments(orig)

    expect(result).toBe([
      '{        ',
      '    ',
      '           ',
      '                                                          ',
      '     ',
      '}'
    ].join('\n'))
    expect(JSON.parse(result)).toStrictEqual({})
  })

  test('opens a line comment if character after "*/" is \'/\'', () => {
    const orig = [
      '{/* Frist',
      '  "opts": {',
      '    "destination": "doesn\'t matter, because commented out"',
      '  Still commented out here, but next line will open a line comment.',
      '  *//}',
      '}'
    ].join('\n')

    const result = stripJsonComments(orig)

    expect(result).toBe([
      '{        ',
      '           ',
      '                                                          ',
      '                                                                   ',
      '      ',
      '}'
    ].join('\n'))
    expect(JSON.parse(result)).toStrictEqual({})
  })
})
