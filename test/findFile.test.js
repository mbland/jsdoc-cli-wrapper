/* eslint-env vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { findFile } from '../lib/index.js'
import { fixturePath } from './fixtures/index.js'
import { describe, expect, test } from 'vitest'
import path from 'node:path'

describe('findFile', () => {
  const root = fixturePath('findFile')

  test('find file at root of tree', async () => {
    await expect(findFile(root, 'rootFile'))
      .resolves.toBe(path.join(root, 'rootFile'))
  })

  test('find files using breadth-first search', async() => {
    await expect(findFile(root, 'foo'))
      .resolves.toBe(path.join(root, 'child0', 'foo'))
    await expect(findFile(root, 'bar'))
      .resolves.toBe(path.join(root, 'child1', 'bar'))
    await expect(findFile(root, 'baz'))
      .resolves.toBe(path.join(root, 'child2', 'baz'))
    await expect(findFile(root, 'quux'))
      .resolves.toBe(path.join(root, 'child0', 'child3', 'quux'))
  })

  test('rejects when file not found', async () => {
    await expect(findFile(root, 'nonexistent'))
      .rejects.toBe(`failed to find nonexistent in ${root}`)
  })
})
