/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { spawn } from 'node:child_process'
import { access, readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

export const INSTALL_HINT = 'Run \'pnpm add [-g|-D] jsdoc\' ' +
  'to install JSDoc: https://jsdoc.app'

/**
 * Result of the `jsdoc` execution
 * @typedef {object} RunJsdocResults
 * @property {number} exitCode - 0 on success, nonzero on failure
 * @property {string} [indexHtml] - path to the generated index.html file
 */

/**
 * Removes the existing JSDoc directory, runs `jsdoc`, and emits the result path
 * @param {string[]} argv - JSDoc command line interface arguments
 * @param {EnvVars} env - environment variables, presumably process.env
 * @param {string} platform - the process.platform string
 * @returns {Promise<RunJsdocResults>} result of `jsdoc` execution
 * @throws if `jsdoc` isn't found or can't execute
 */
export async function runJsdoc(argv, env, platform) {
  /** @type {string} */
  let jsdocPath

  try {
    jsdocPath = await getPath('jsdoc', env, platform)
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : INSTALL_HINT)
  }

  const {destination, willGenerate} = await analyzeArgv(argv)

  if (willGenerate) await rm(destination, {force: true, recursive: true})

  const exitCode = await new Promise(resolve => {
    spawn(jsdocPath, argv, {stdio: 'inherit'})
      .on('close', code => resolve(code))
  })

  if (exitCode === 0 && willGenerate) {
    try {
      return {exitCode, indexHtml: await findFile(destination, 'index.html')}
    } catch {
      // If jsdoc finds no input files, it doesn't create the directory, but
      // prints "There are no input files to process." and exits 0.
    }
  }
  return {exitCode}
}

/**
 * Determines the key for the command search path within process.env.
 * @param {string} platform - the process.platform string
 * @returns {string} On every platform other than 'win32', this will be "PATH"
 * On 'win32', this will be "Path".
 */
export const pathKey = platform => platform !== 'win32' ? 'PATH' : 'Path'

/** @typedef {Object<string,string|undefined>} EnvVars */

/**
 * Returns the full path to the specified command
 * @param {string} cmdName - command to find in env[pathKey(platform)]
 * @param {EnvVars} env - environment variables, presumably process.env
 * @param {string} platform - the process.platform string
 * @returns {Promise<string>} path to the command
 * @throws if `jsdoc` isn't found
 */
export async function getPath(cmdName, env, platform) {
  const pk = pathKey(platform)
  const pathVar = env[pk]
  if (!pathVar) throw new Error(`"${pk}" environment variable not defined`)

  // pnpm will install both the original script and versions ending with .CMD
  // and .ps1. We'll just default to .CMD.
  if (platform === 'win32') cmdName += '.CMD'

  for (const p of pathVar.split(path.delimiter)) {
    try {
      const candidate = path.join(p, cmdName)
      await access(candidate)
      return candidate
    } catch { /* try next candidate */ }
  }
  return Promise.reject(`${cmdName} not found in ${pk}`)
}

/**
 * Results from analyzing JSDoc command line arguments
 * @typedef {object} ArgvResults
 * @property {string} destination - the JSDoc destination directory
 * @property {boolean} willGenerate - true unless --help or --version present
 */

/**
 * Analyzes JSDoc CLI args to determine if JSDoc will generate docs and where
 *
 * Expects any JSON config files specified via -c or --configure to be UTF-8
 * encoded.
 * @param {string[]} argv - JSDoc command line interface arguments
 * @returns {Promise<ArgvResults>} analysis results
 */
export async function analyzeArgv(argv) {
  /**
   * @param {(string|undefined)} nextArg - next argument after current one
   * @returns {boolean} true if defined and not another flag, false otherwise
   */
  function validArg(nextArg) { return !!nextArg && !nextArg.startsWith('-') }
  let destination, cmdLineDest, willGenerate = true

  for (let i = 0; i !== argv.length; ++i) {
    const arg = argv[i]
    const nextArg = argv[i+1]

    switch (arg) {
    case '-c': case '--configure':
      if (!cmdLineDest && validArg(nextArg)) {
        const jsonSrc = await readFile(nextArg, {encoding: 'utf8'})
        const config = JSON.parse(stripJsonComments(jsonSrc))
        if (config.opts !== undefined) destination = config.opts.destination
      }
      break

    case '-d': case '--destination':
      if (validArg(nextArg)) {
        destination = nextArg
        cmdLineDest = true
      }
      break

    case '-h': case '--help': case '-v': case '--version':
      willGenerate = false
      break
    }
  }

  // "out" is the JSDoc default directory.
  destination ??= 'out'
  return {willGenerate, destination}
}

/**
 * Replaces all comments and trailing commas in a JSON string with spaces
 *
 * Replaces rather than removes characters so that any JSON.parse() errors line
 * up with the original. Preserves all existing whitespace as is, including
 * newlines, carriage returns, and horizontal tabs.
 *
 * Details to be aware of:
 *
 * - Replaces trailing commas before the next ']' or '}' with a space.
 * - "/* /" (without the space) is a complete block comment. (Since this
 *   documentation is in a block comment, the space is necessary here.)
 * - If the next character after the end of a block comment ("* /" without the
 *   space) is:
 *   - '*': reopens the block comment
 *   - '/': opens a line comment
 *
 * If you really want to strip all the extra whitespace out:
 *
 * ```js
 * JSON.stringify(JSON.parse(stripJsonComments(str)))
 * ```
 *
 * If you want to reformat it to your liking, e.g., using two space indents:
 *
 * ```js
 * JSON.stringify(JSON.parse(stripJsonComments(str)), null, 2)
 * ```
 *
 * This function is necessary because the `jsdoc` command depends upon the
 * extremely popular strip-json-comments npm. Otherwise analyzeArgs() would
 * choke on config.json files containing comments.
 *
 * This implementation was inspired by strip-json-comments, but is a completely
 * original implementation to avoid adding any dependencies. It may become its
 * own separate package one day, likely scoped to avoid conflicts with
 * strip-json-comments.
 * @param {string} str - JSON text to strip
 * @returns {string} str with comments, trailing commas replaced by space
 */
export function stripJsonComments(str) {
  let inString = false, escaped = false, comment = null, comma = null
  let result = []

  for (let i = 0; i !== str.length; ++i) {
    let c = str[i]

    if (inString) {  // check first so illegally escaped whitespace won't hide "
      inString = c !== '"' || escaped
      escaped = c === '\\' && !escaped
    } else if (c === '\n') {
      if (comment === 'line') comment = null
    } else if (c.trimStart() === '') { // preserve all other existing whitespace
    } else if (comment) {
      if (c === '/'  && comment === 'block' && str[i-1] === '*') comment = null
      c = ' '
    } else if (c === '/' || c === '*') {  // maybe a comment, don't update comma
      if (str[i-1] === '/') {  // definitely a comment, or else a syntax error
        comment = (c === '/') ? 'line' : 'block'
        result[i-1] = c = ' '
      }
    } else if (c === ',') {
      comma = i
    } else {  // outside any valid string or comment, replace trailing commas
      if (c === '"') inString = true
      else if (comma && (c === ']' || c === '}')) result[comma] = ' '
      comma = null
    }
    result.push(c)
  }
  return result.join('')
}

/**
 * Searches for filename within a directory tree via breadth-first search
 * @param {string} dirname - current directory to search
 * @param {string} filename - name of file to find
 * @returns {Promise<string>} path to filename within dirname
 * @throws if filename not found
 */
export async function findFile(dirname, filename) {
  const childDirs = [dirname]
  let curDir

  while ((curDir = childDirs.shift()) !== undefined) {
    // This should be `for await (const entry of readdir(...))`:
    // - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for-await...of
    //
    // But Node 20.10.0 errors with:
    //   TypeError: readdir(...) is not a function or its return value is not
    //   async iterable
    const entries = await readdir(curDir, {withFileTypes: true})
    for (const entry of entries) {
      const childPath = path.join(curDir, entry.name)
      if (entry.name === filename) return childPath
      if (entry.isDirectory()) childDirs.push(childPath)
    }
  }
  return Promise.reject(`failed to find ${filename} in ${dirname}`)
}
