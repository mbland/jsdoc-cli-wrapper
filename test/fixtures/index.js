/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Returns the absolute path to a test fixture directory.
 * @param {string} fixtureName - test fixture name
 * @returns {string} - the absolute path to the test fixture directory
 */
export function fixturePath(fixtureName) {
  return fileURLToPath(new URL(fixtureName, import.meta.url))
}

/**
 * A fake environment variable object
 * @typedef {object} FakeEnv
 * @property {string} PATH - platform-correct PATH variable
 */

/**
 * Returns an environment object containing PATH set for the test fixture.
 *
 * The PATH will always contain ['usr/local/bin', 'usr/bin', 'bin'] relative to
 * the fixture root. It will be constructed using the Node.js path module to
 * ensure it's native to the host platform.
 * @param {string} fixtureName - test fixture name
 * @returns {FakeEnv} - a fake environment for the specified test fixture
 */
export function fixtureEnv(fixtureName) {
  const root = fixturePath(fixtureName)
  const paths = [
    path.join('usr', 'local', 'bin'), path.join('usr', 'bin'), 'bin'
  ]
  const pathKey = process.platform !== 'win32' ? 'PATH' : 'Path'
  return {[pathKey]: paths.map(p => path.join(root, p)).join(path.delimiter)}
}
