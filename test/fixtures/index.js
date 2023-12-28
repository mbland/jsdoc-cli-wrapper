/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { fileURLToPath } from 'node:url'

/**
 * Returns the absolute path to a test fixture directory.
 * @param {string} fixtureName - test fixture name
 * @returns {string} - the absolute path to the test fixture directory
 */
export function fixturePath(fixtureName) {
  return fileURLToPath(new URL(fixtureName, import.meta.url))
}
