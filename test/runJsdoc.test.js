/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { runJsdoc, pathKey, INSTALL_HINT } from '../lib/index.js'
import { fixturePath } from './fixtures/index.js'
import DestDirHelper from './DestDirHelper.js'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import path from 'node:path'

const PATH_KEY = pathKey(process.platform)

describe('runJsdoc', () => {
  const root = fixturePath('jsdocStub')
  const env = { [PATH_KEY]: root }
  const platform = process.platform
  const destDirHelper = new DestDirHelper()

  /** @type {string} */
  let origIndexPath
  /** @type {string[]} */
  let argv = []

  beforeEach(async () => {
    const { destDir, indexPath } = await destDirHelper.createIndexHtml(
      'runJsdoc-test-', 'old-subdir', 'Old and Busted'
    )
    argv = ['-d', destDir]
    origIndexPath = indexPath
  })

  afterEach(async () => await destDirHelper.cleanup())

  const readIndexHtml = async () => destDirHelper.readIndexHtml()

  test('throws error if PATH/Path env var not found', async () => {
    await expect(runJsdoc(argv, {}, platform))
      .rejects.toThrowError(`"${PATH_KEY}" environment variable not defined`)
  })

  test('emits error if jsdoc not found', async () => {
    const bogusPath = path.join(root, 'nonexistent')

    await expect(runJsdoc(argv, {[PATH_KEY]: bogusPath}, platform))
      .rejects.toContain(INSTALL_HINT)
    await expect(readIndexHtml()).resolves.toStrictEqual({
      actualPath: origIndexPath, content: 'Old and Busted'
    })
  })

  test('returns success on -h, doesn\'t delete existing dir', async () => {
    await expect(runJsdoc(argv.concat('-h'), env, platform))
      .resolves.toStrictEqual({exitCode: 0})
    await expect(readIndexHtml()).resolves.toStrictEqual({
      actualPath: origIndexPath, content: 'Old and Busted'
    })
  })

  test('deletes existing output and returns error', async () => {
    await expect(runJsdoc(argv.concat('--exit-code', '1'), env, platform))
      .resolves.toStrictEqual({exitCode: 1})
    await expect(readIndexHtml())
      .rejects.toThrowError(/no such file or directory/)
  })

  test('replaces existing output and returns success', async () => {
    const expectedIndexPath = origIndexPath.replace('old-subdir', 'new-subdir')

    await expect(runJsdoc(argv, env, platform))
      .resolves.toStrictEqual({exitCode: 0, indexHtml: expectedIndexPath})
    await expect(readIndexHtml()).resolves.toStrictEqual({
      actualPath: expectedIndexPath, content: 'New Hotness'
    })
  })

  test('deletes existing output and returns success', async () => {
    // As noted in the code, this will happen if jsdoc finds no input files.
    await expect(runJsdoc(argv.concat('--no-input-files'), env, platform))
      .resolves.toStrictEqual({exitCode: 0})
    await expect(readIndexHtml())
      .rejects.toThrowError(/no such file or directory/)
  })
})
