/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { stripJsonComments } from '../lib/index.js'
import { describe, expect, test } from 'vitest'

describe('stripJsonComments', () => {
  const BASIC_OBJECT = {opts: {destination: 'foo'}}

  describe('doesn\'t modify', () => {
    test('the empty string', () => {
      expect(stripJsonComments('')).toBe('')
    })

    test('an object with plain strings and no comments', () => {
      const orig = JSON.stringify(BASIC_OBJECT, null, 2)

      expect(stripJsonComments(orig)).toBe(orig)
    })

    test('properly escaped strings', () => {
      const obj = {
        opts: {
          first: 'ignores escaped \\" before the end of the string',
          second: 'ignores escaped \\ before the end of the string \\\\\\\\'
        }
      }
      const orig = JSON.stringify(obj, null, 2)

      expect(stripJsonComments(orig)).toBe(orig)
    })

    test('strings containing comment patterns', () => {
      const obj = {
        opts: {
          line: 'looks like a // line comment, but isn\'t',
          block: 'looks like a /* block comment, */ but isn\'t'
        }
      }
      const orig = JSON.stringify(obj, null, 2)

      expect(stripJsonComments(orig)).toBe(orig)
    })

    test('strings including trailing commas', () => {
      const obj = {
        opts: {
          arrayWithTrailingComma: '[ "foo", "bar", "baz", ]',
          objectWithTrailingComma: '{ "foo": "bar", }'
        }
      }
      const orig = JSON.stringify(obj, null, 2)

      expect(stripJsonComments(orig)).toBe(orig)
    })
  })

  describe('replaces', () => {
    test('line comments, preserving existing whitespace', () => {
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

    test('block comments, preserving existing whitespace', () => {
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

    test('mixed comments and trailing commas before ] or }', () => {
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
        '  }, // Seventh, also with trailing comma for future expansion',
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
        '  }                                                           ',
        '             ',
        '}         ',
        '          '
      ].join('\n'))
      expect(JSON.parse(result)).toStrictEqual({
        opts: { destinations: ['foo', 'bar', 'baz'] }
      })
    })
  })

  describe('opens', () => {
    test('a block comment if character after "*/" is \'*\'', () => {
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

    test('a line comment if character after "*/" is \'/\'', () => {
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

  describe('maintains correct syntax error position info when', () => {
    // JSON.parse() from Node.js ^18.0.0 only ever fails with "Unexpected
    // token", whereas versions >= 19.0.0 provide more descriptive errors.
    const v18 = process.version.startsWith('v18.')
    /**
     * @param {string} token - token expected to cause a JSON.parse() error
     * @param {string} msg - expected Node.js v >= 19.0.0 JSON.parse() error
     * @returns {string} - the appropriate JSON.parse() error prefix
     */
    const errPrefix = (token, msg) => v18 ? `Unexpected token ${token} in` : msg

    /**
     * @param  {...string} lines - lines of text to join
     * @returns {string} - lines joined by newlines
     */
    const jsonSrc = (...lines) => lines.join('\n')
    /**
     * @param {string} src - original JSON source to strip
     * @returns {object} - object parsed from src
     */
    const stripAndParse = (src) => () => JSON.parse(stripJsonComments(src))

    test('* not preceded or followed by /', () => {
      const src = jsonSrc(
        '{',
        '  // Starting off strong...',
        '   "foo": "bar",',
        '   * ...but forgot opening slash on this line. */',
        '   "baz": "quux",',
        '}'
      )

      expect(stripAndParse(src)).toThrowError(
        errPrefix('*', 'Expected double-quoted property name in') +
        ` JSON at position ${src.indexOf('* ...but forgot opening slash')}`
      )
    })

    test('/ not followed by /', () => {
      const src = jsonSrc(
        '{',
        '  // Starting off strong...',
        '   "foo": "bar",',
        '   / ...but forgot opening slash on this line.',
        '   "baz": "quux",',
        '}'
      )

      expect(stripAndParse(src)).toThrowError(
        errPrefix('/', 'Expected double-quoted property name in') +
        ` JSON at position ${src.indexOf('/ ...but forgot opening slash')}`
      )
    })

    test('multiple trailing commas are present', () => {
      const src = jsonSrc(
        '{',
        '  // Starting off strong...',
        '   "foo": "bar",',
        '  // ...but added too many trailing commas on the next line.',
        '   "baz": "quux",,,',
        '}'
      )

      expect(stripAndParse(src)).toThrowError(
        errPrefix(',', 'Expected double-quoted property name in') +
        // The last comma will become a space, so JSON.parse() will break on the
        // one before that.
        ` JSON at position ${src.indexOf(',,,') + 1}`
      )
    })

    test('trailing commas don\'t follow an element or property', () => {
      const src = jsonSrc(
        '{',
        '  // Starting off strong...',
        '   "foo": "bar",',
        '  /* ...still looking good... */',
        '   "baz": "quux",',
        '}, // ...but this last comma is a problem.'
      )

      expect(stripAndParse(src)).toThrowError(
        errPrefix(',', 'Unexpected non-whitespace character after') +
        ` JSON at position ${src.indexOf(', // ...but this last comma')}`
      )
    })

    test('a string contains an escaped space before the closing quote', () => {
      const src = [
        '{',
        '  "opts": {',
        '    // This comment should disappear regardless.',
        '    "fubar": "If not handled, the comments below will remain.\\ "',
        '    /* Escaped space is illegal JSON, but it shouldn\'t hide a',
        '     * closing quote and prevent comment removal. */',
        '  }',
        '}'].join('\n')

      const result = stripJsonComments(src)

      expect(result).toBe([
        '{',
        '  "opts": {',
        '                                                ',
        '    "fubar": "If not handled, the comments below will remain.\\ "',
        '                                                             ',
        '                                                    ',
        '  }',
        '}'].join('\n'))
      expect(() => JSON.parse(result)).toThrowError(
        // It will choke on the space, not the escape slash.
        errPrefix(' ', 'Bad escaped character in') +
        ` JSON at position ${src.indexOf('\\ "') + 1}`
      )
    })
  })
})
