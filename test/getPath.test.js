/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getPath, pathKey } from '../lib'
import { fixturePath } from './fixtures'
import { describe, expect, test } from 'vitest'
import path from 'node:path'

describe('getPath', () => {
  const root = fixturePath('getPath')
  const envPath = ['usr/local/bin', 'usr/bin', 'bin']
    .map(p => path.join(root, p))
    .join(path.delimiter)
  const makeEnv = platform => ({[pathKey(platform)]: envPath})

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
})
