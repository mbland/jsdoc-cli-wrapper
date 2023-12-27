/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { analyzeArgv } from '../lib'
import { fixturePath } from './fixtures'
import { describe, expect, test } from 'vitest'
import path from 'node:path'

describe('analyzeArgv', () => {
  const root = fixturePath('analyzeArgv')
  const configs = {
    foo: path.join(root, 'conf-foo.json'),
    bar: path.join(root, 'conf-bar.json'),
    undefDest: path.join(root, 'conf-undef-dest.json'),
    undefOpts: path.join(root, 'conf-undef-opts.json')
  }

  test('empty argv returns defaults', async () => {
    await expect(analyzeArgv([])).resolves
      .toStrictEqual({destination: 'out', willGenerate: true})
  })

  test('destination not set if flag not followed by valid arg', async () => {
    const result = {destination: 'out', willGenerate: true}

    await expect(analyzeArgv(['--configure'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['-c', '--wtf'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['--destination'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['-d', '--wtf'])).resolves.toStrictEqual(result)
  })

  test('-d or --destination sets destination', async () => {
    const result = {destination: 'foobar', willGenerate: true}

    await expect(analyzeArgv(['-d', 'foobar'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['--destination', 'foobar'])).resolves
      .toStrictEqual(result)
  })

  test('last -d wins', async () => {
    await expect(analyzeArgv(['-d', 'foobar', '-d', 'bazquux'])).resolves
      .toStrictEqual({destination: 'bazquux', willGenerate: true})
  })

  test('-h, --help, -v, or --version sets willGenerate to false', async () => {
    const result = {destination: 'out', willGenerate: false}

    await expect(analyzeArgv(['-h'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['--help'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['-v'])).resolves.toStrictEqual(result)
    await expect(analyzeArgv(['--version'])).resolves.toStrictEqual(result)
  })

  test('-c or --configure sets destination if opts defined', async () => {
    const result = {destination: 'foo', willGenerate: true}

    await expect(analyzeArgv(['-c', configs.foo]))
      .resolves.toStrictEqual(result)
    await expect(analyzeArgv(['--configure', configs.foo]))
      .resolves.toStrictEqual(result)
  })

  test('last -c with opts defined wins', async () => {
    const args = [
      '-c', configs.foo, '-c', configs.bar, '-c', configs.undefOpts
    ]

    await expect(analyzeArgv(args))
      .resolves.toStrictEqual({destination: 'bar', willGenerate: true})
  })

  test('-c with opts.destination undefined resets destination', async () => {
    await expect(analyzeArgv(['-c', configs.foo, '-c', configs.undefDest]))
      .resolves.toStrictEqual({destination: 'out', willGenerate: true})
  })

  test('-d overrides -c', async () => {
    await expect(analyzeArgv(['-d', 'foobar', '-c', configs.foo]))
      .resolves.toStrictEqual({destination: 'foobar', willGenerate: true})
  })
})
