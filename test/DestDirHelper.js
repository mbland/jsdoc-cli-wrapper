/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { findFile } from '../lib/index.js'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

export default class DestDirHelper {
  /** @type {(string | null)} */
  #destDir = null

  /**
   * @typedef {object} TempIndexInfo
   * @property {string} destDir - path to the temporary destination directory
   * @property {string} indexPath - path to the generated index.html file
   */

  /**
   * Creates a new temporary directory and index.html file for testing
   * @param {string} destDirPrefix - prefix for temporary destination directory
   * @param {string} origSubdir - subdirectory within temporary directory
   * @param {string} origContent - content of generated index.html file
   * @returns {Promise<TempIndexInfo>} - object
   * @throws {Error} if creating the directory or the index.html file fails
   */
  async createIndexHtml(destDirPrefix, origSubdir, origContent) {
    this.#destDir = await mkdtemp(path.join(tmpdir(), destDirPrefix))
    const indexPath = path.join(this.#destDir, origSubdir, 'index.html')

    await mkdir(path.dirname(indexPath), {recursive: true})
    await writeFile(indexPath, origContent)
    return {destDir: this.#destDir, indexPath}
  }

  async readIndexHtml() {
    if (this.#destDir === null) {
      throw new Error('this.createIndexHtml() not called')
    }

    const actualPath = await findFile(this.#destDir, 'index.html')
    return {actualPath, content: await readFile(actualPath, {encoding: 'utf8'})}
  }

  async cleanup() {
    if (this.#destDir !== null) {
      await rm(this.#destDir, {force: true, recursive: true})
      this.#destDir = null
    }
  }
}
