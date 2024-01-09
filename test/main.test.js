/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { INSTALL_HINT, pathKey } from '../lib/index.js'
import { fixturePath } from './fixtures/index.js'
import DestDirHelper from './DestDirHelper.js'
import { afterEach, describe, expect, test } from 'vitest'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PATH_KEY = pathKey(process.platform)

describe('jsdoc-cli-wrapper', () => {
  const destDirHelper = new DestDirHelper()
  const mainPath = fileURLToPath(new URL('../index.js', import.meta.url))
  const envPath = [fixturePath('jsdocStub'), process.env[PATH_KEY]]
    .join(path.delimiter)

  afterEach(async () => await destDirHelper.cleanup())

  /**
   * @typedef {object} JsdocResult
   * @property {(number | null)} exitCode - the exit code from 'jsdoc'
   * @property {string} [stdout] - standard output from 'jsdoc'
   * @property {string} [stderr] - standard error from 'jsdoc'
   */

  /**
   * @param {string} testEnvPath - command line search path environment variable
   * @param {...string} argv - command line arguments to pass to 'jsdoc'
   * @returns {Promise<JsdocResult>} - exit code and output from 'jsdoc'
   */
  const spawnMain = (testEnvPath, ...argv) => new Promise((resolve, reject) => {
    const env = {...process.env, [PATH_KEY]: testEnvPath}
    const wrapper = spawn(process.execPath, [mainPath, ...argv], {env})
    let stdout = ''
    let stderr = ''

    wrapper.stdout.on('data', data => stdout += data.toString())
    wrapper.stderr.on('data', data => stderr += data.toString())
    wrapper.on('close', exitCode => {
      /** @type {JsdocResult} */
      const result = { exitCode }
      if (stdout) result.stdout = stdout
      if (stderr) result.stderr = stderr
      resolve(result)
    })
    wrapper.on('error', err => reject(err))
  })

  /**
   * @callback JsdocRunner
   * @param {...string} argv - command line arguments to pass to 'jsdoc'
   * @returns {Promise<JsdocResult>} - exit code and output from 'jsdoc'
   */

  /** @type {JsdocRunner} */
  const runMain = (...argv) => spawnMain(envPath, ...argv)

  /** @type {JsdocRunner} */
  const runMainWithoutJsdoc = async (...argv) => {
    return spawnMain('/bogus/bin', ...argv)
  }

  test('success without index.html path', async () => {
    await expect(runMain('-h')).resolves.toStrictEqual({ exitCode: 0 })
  })

  test('error without index.html path', async () => {
    await expect(runMain('--exit-code', '1')).resolves
      .toStrictEqual({ exitCode: 1 })
  })

  test('success with index.html path', async () => {
    const { destDir, indexPath } = await destDirHelper.createIndexHtml(
      'jsdoc-cli-wrapper-test-', 'old-subdir', 'Old and Busted'
    )
    const result = pathToFileURL(indexPath.replace('old-subdir', 'new-subdir'))

    await expect(runMain('-d', destDir)).resolves
      .toStrictEqual({ exitCode: 0, stdout: `${result}\n` })
  })

  test('emit internal error', async () => {
    await expect(runMainWithoutJsdoc()).resolves
      .toStrictEqual({ exitCode: 1, stderr: `${INSTALL_HINT}\n` })
  })
})
