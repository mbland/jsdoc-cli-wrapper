/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getPath, pathKey } from '../lib/index.js'
import { fixturePath } from './fixtures/index.js'
import { describe, expect, test } from 'vitest'
import path from 'node:path'

describe('getPath', () => {
  const root = fixturePath('getPath')
  const envPath = ['usr/local/bin', 'usr/bin', 'bin']
    .map(p => path.join(root, p))
    .join(path.delimiter)
  /**
   * @param {string} platform - valid process.platform OS identifier
   * @returns {Object<string,string|undefined>} - process.env-like object
   */
  function makeEnv(platform) { return ({ [pathKey(platform)]: envPath }) }

  test('finds command on POSIX system', async() => {
    await expect(getPath('testcmd', makeEnv('linux'), 'linux')).resolves
      .toBe(path.join(root, 'bin/testcmd'))
  })

  test('finds command on Windows system', async() => {
    await expect(getPath('testcmd', makeEnv('win32'), 'win32')).resolves
      .toBe(path.join(root, 'usr/bin/testcmd.CMD'))
  })

  test('rejects when command isn\'t found', async () => {
    await expect(getPath('nonexistent', makeEnv('linux'), 'linux')).rejects
      .toBe(`nonexistent not found in ${pathKey('linux')}`)
  })

  test('throws if no appropriate environment variable found', async () => {
    await expect(getPath('borken', makeEnv('win32'), 'linux')).rejects
      .toThrowError(`"${pathKey('linux')}" environment variable not defined`)
  })
})
