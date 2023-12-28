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

const PATH_KEY = pathKey(process.platform)

describe('getPath', () => {
  const root = fixturePath('getPath')
  const envPath = ['usr/local/bin', 'usr/bin', 'bin']
    .map(p => path.join(root, p))
    .join(path.delimiter)

  test('finds command on POSIX system', async() => {
    const env = {[pathKey('linux')]: envPath}

    await expect(getPath('testcmd', env, 'linux')).resolves
      .toBe(path.join(root, 'bin/testcmd'))
  })

  test('finds command on Windows system', async() => {
    const env = {[pathKey('win32')]: envPath}

    await expect(getPath('testcmd', env, 'win32')).resolves
      .toBe(path.join(root, 'usr/bin/testcmd.CMD'))
  })

  test('rejects when command isn\'t found', async () => {
    const env = {[PATH_KEY]: envPath}

    await expect(getPath('nonexistent', env, process.platform)).rejects
      .toBe(`nonexistent not found in ${PATH_KEY}`)
  })
})
