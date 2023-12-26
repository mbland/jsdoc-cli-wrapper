#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * @file JSDoc command line interface wrapper.
 *
 * Removes the existing destination directory if it exists, runs JSDoc, and
 * emits the relative path to the generated index.html file.
 * @author Mike Bland <mbland@acm.org>
 */

import { runJsdoc } from './lib/index.js'
import { exit, stdout } from 'node:process'

try {
  const {exitCode, indexHtml} = await runJsdoc(
    process.argv.slice(2), process.env, process.platform
  )
  if (indexHtml !== undefined) stdout.write(`${indexHtml}\n`)
  exit(exitCode)

} catch (err) {
  console.error(err)
  exit(1)
}
