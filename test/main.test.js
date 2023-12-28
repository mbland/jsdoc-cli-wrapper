/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getPath } from '../lib'
import { fixturePath } from './fixtures'
import DestDirHelper from './DestDirHelper'
import { afterEach, describe, expect, test } from 'vitest'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

describe('jsdoc-cli-wrapper', () => {
  const root = fixturePath('fakeJsdoc')
  const destDirHelper = new DestDirHelper()
  const mainPath = fileURLToPath(new URL('../index.js', import.meta.url))

  afterEach(async () => await destDirHelper.cleanup())

  const spawnMain = async(testEnvPath, ...argv) => {
    const origEnvPath = process.env.PATH
    process.env.PATH = testEnvPath

    const result = await new Promise(resolve => {
      const wrapper = spawn(mainPath, argv)
      let stdout = ''
      let stderr = ''

      wrapper.stdout.on('data', data => stdout += data.toString())
      wrapper.stderr.on('data', data => stderr += data.toString())
      wrapper.on('close', exitCode => {
        const result = { exitCode }
        if (stdout) result.stdout = stdout
        if (stderr) result.stderr = stderr
        resolve(result)
      })
    })

    process.env.PATH = origEnvPath
    return result
  }

  const runMain = async (...argv) => {
    const testEnvPath = [root, process.env.PATH].join(path.delimiter)
    return spawnMain(testEnvPath, ...argv)
  }

  const runMainWithoutJsdoc = async (...argv) => {
    let testEnvPath = process.env.PATH

    try {
      const jsdocPath = await getPath('jsdoc', process.env, process.platform)
      const jsdocDir = path.dirname(jsdocPath)
      const pat = new RegExp(`${path.delimiter}?${jsdocDir}${path.delimiter}?`)
      testEnvPath = testEnvPath.replace(pat, '')
    } catch { /* It's OK if it's not actually installed. */ }

    return spawnMain(testEnvPath, ...argv)
  }

  test('success without index.html path', async () => {
    await expect(runMain('-h')).resolves.toStrictEqual({ exitCode: 0 })
  })

  test('error without index.html path', async () => {
    await expect(runMain('--exit-code', 1)).resolves
      .toStrictEqual({ exitCode: 1 })
  })

  test('success with index.html path', async () => {
    const { destDir, indexPath } = await destDirHelper.createIndexHtml(
      'jsdoc-cli-wrapper-test-', 'old-subdir', 'Old and Busted'
    )

    await expect(runMain('-d', destDir)).resolves.toStrictEqual({
      exitCode: 0,
      stdout: `${indexPath.replace('old-subdir', 'new-subdir')}\n`
    })
  })

  test('emit internal error', async () => {
    await expect(runMainWithoutJsdoc()).resolves.toStrictEqual({
      exitCode: 1,
      stderr: 'Run \'pnpm add -g jsdoc\' to install JSDoc: https://jsdoc.app\n'
    })
  })
})
