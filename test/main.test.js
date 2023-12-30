/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getPath, pathKey } from '../lib'
import { fixturePath } from './fixtures'
import DestDirHelper from './DestDirHelper'
import { afterEach, describe, expect, test } from 'vitest'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PATH_KEY = pathKey(process.platform)

describe('jsdoc-cli-wrapper', () => {
  const root = fixturePath('jsdocStub')
  const destDirHelper = new DestDirHelper()
  const mainPath = fileURLToPath(new URL('../index.js', import.meta.url))
  const envPath = [root, process.env[PATH_KEY]].join(path.delimiter)

  afterEach(async () => await destDirHelper.cleanup())

  const spawnMain = (testEnvPath, ...argv) => new Promise((resolve, reject) => {
    const env = {...process.env, [PATH_KEY]: testEnvPath}
    const wrapper = spawn(process.execPath, [mainPath, ...argv], {env})
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
    wrapper.on('error', err => reject(err))
  })

  const runMain = (...argv) => spawnMain(envPath, ...argv)

  const runMainWithoutJsdoc = async (...argv) => {
    let envPath = process.env[PATH_KEY]

    try {
      const jsdocPath = await getPath('jsdoc', process.env, process.platform)
      const jsdocDir = path.dirname(jsdocPath)
      envPath = envPath.split(path.delimiter)
        .filter(p => p !== jsdocDir)
        .join(path.delimiter)
    } catch { /* It's OK if it's not actually installed. */ }

    return spawnMain(envPath, ...argv)
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
    const result = pathToFileURL(indexPath.replace('old-subdir', 'new-subdir'))

    await expect(runMain('-d', destDir)).resolves.toStrictEqual({
      exitCode: 0, stdout: `${result}\n`
    })
  })

  test('emit internal error', async () => {
    await expect(runMainWithoutJsdoc()).resolves.toStrictEqual({
      exitCode: 1,
      stderr: 'Run \'pnpm add -g jsdoc\' to install JSDoc: https://jsdoc.app\n'
    })
  })
})
