# JSDoc Command Line Interface Wrapper

 Wrapper for the [jsdoc][cli] command line tool for generating [JSDoc][] HTML
 output. Removes the existing destination directory if it exists, runs `jsdoc`,
 and emits the relative path to the generated `index.html` file.

Source: <https://github.com/mbland/jsdoc-cli-wrapper>

[![License](https://img.shields.io/github/license/mbland/jsdoc-cli-wrapper.svg)](https://github.com/mbland/jsdoc-cli-wrapper/blob/main/LICENSE.txt)
[![CI status](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/run-tests.yaml/badge.svg)](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/run-tests.yaml?branch=main)
[![Test results](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/publish-test-results.yaml/badge.svg)](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/publish-test-results.yaml?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/mbland/jsdoc-cli-wrapper/badge.svg?branch=main)][coveralls-jsdw]

## Installation

You probably want to install the [jsdoc CLI][cli] first, though the wrapper will
kindly suggest you do so if it can't find it. Using [pnpm][] to install it once
for all your local projects:

```sh
pnpm add -g jsdoc
```

Then you're free to add this wrapper globally, or to a specific project. For
example, to add it to your `devDependencies`:

```sh
pnpm add -D jsdoc-cli-wrapper
```

## Usage

This wrapper passes every command line argument through to the `jsdoc` CLI as is
and doesn't change the behavior of `jsdoc` itself at all. Use it exactly as you
would use `jsdoc` on its own.

## Motivation

The `jsdoc` command will:

- silently write new output into an existing directory, and
- not show where the generated `index.html` entrypoint resides.

`jsdoc` doesn't have any command line options to deal with either of these
issues. Not even `--verbose` nor `--debug` will show the path to `index.html`.

This wrapper resolves both of those minor annoyances.

- Regarding the first, it can be surprising to change the structure of your
  project, run `jsdoc`, and have stale files and directories laying around.

- Regarding the second, it's really handy to print the path to `index.html`. It
  helps make sure things end up where you expect, and makes it convenient to
  copy and open in a browser. This is especially useful when the JavaScript code
  is embedded in a larger, possibly multilanguage repository.

## Examples

### This project

This project's ['jsdoc' script](./package.json) uses [jsdoc.json](./jsdoc.json)
as its configuration file, resulting in:

```sh
$ pnpm jsdoc

> jsdoc-cli-wrapper@1.0.0 jsdoc .../jsdoc-cli-wrapper
> node index.js -c jsdoc.json .

jsdoc/jsdoc-cli-wrapper/1.0.0/index.html
```

Of course, your own project would use `jsdoc-cli-wrapper` instead of `node
index.js`. (This project uses the latter to ensure Windows compatibility during development.)

### Multilanguage project

My [mbland/tomcat-servlet-testing-example][] project uses [Gradle][] to build
both the frontend and backend into a common `build/` directory. Its
`strcalc/src/main/frontend/jsdoc.json` config looks like:

```json
{
  "plugins": [ "plugins/markdown" ],
  "recurseDepth": 10,
  "source": {
    "includePattern": ".+\\.js$",
    "exclude": ["node_modules"]
  },
  "opts": {
    "destination": "../../../build/jsdoc",
    "recurse": true,
    "readme": "README.md",
    "package": "package.json"
  }
}
```

Its `package.json` contains a `jsdoc` script that runs this wrapper (before this
repository existed, it used a local version):

```sh
$ cd strcalc/src/main/frontend
$ pnpm jsdoc

> tomcat-servlet-testing-example-frontend@0.0.0 jsdoc .../tomcat-servlet-testing-example/strcalc/src/main/frontend
> node bin/jsdoc-cli-wrapper.js -c ./jsdoc.json .

../../../build/jsdoc/tomcat-servlet-testing-example-frontend/0.0.0/index.html
```

[JSDoc]: https://jsdoc.app/
[cli]: https://github.com/jsdoc/jsdoc
[coveralls-jsdw]: https://coveralls.io/github/mbland/jsdoc-cli-wrapper?branch=main
[pnpm]: https://pnpm.io/
[mbland/tomcat-servlet-testing-example]: https://github.com/mbland/tomcat-servlet-testing-example
[Gradle]: https://gradle.org/
