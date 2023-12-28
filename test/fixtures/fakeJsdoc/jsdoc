#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Fake jsdoc implementation for testing
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { exit } from 'node:process'

try {
  const {willGenerate, destination, exitCode} = parseArgs(process.argv.slice(2))

  if (willGenerate && exitCode === 0) {
    const newSubDir = path.join(destination, 'new-subdir')
    await mkdir(newSubDir, {recursive: true})
    await writeFile(path.join(newSubDir, 'index.html'), 'New Hotness')
  }
  exit(exitCode)

} catch (err) {
  console.error(err)
  exit(1)
}

/**
 * The parameters parsed from process.argv by parseArgs()
 * @typedef {object} ArgsResult
 * @property {string} destination - the JSDoc destination directory
 * @property {boolean} willGenerate - true unless -h or --no-input-files present
 * @property {number} exitCode - the value of --exit-code or 0 by default
 */

/**
 * Parses fake jsdoc arguments
 * @param {string[]} argv - command line arguments
 * @returns {ArgsResult} - parameters determining fake jsdoc behavior
 */
function parseArgs(argv) {
  let destination = null
  let willGenerate = true
  let exitCode = 0

  for (let i = 0; i !== argv.length; ++i) {
    const arg = argv[i]
    const nextArg = argv[i+1]

    switch (arg) {
    case '-d':
      destination = nextArg
      break

    case '-h':
    case '--no-input-files':
      willGenerate = false
      break

    case '--exit-code':
      exitCode = nextArg
      break
    }
  }
  return {willGenerate, destination, exitCode}
}
