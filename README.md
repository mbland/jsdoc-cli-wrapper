# JSDoc Command Line Interface Wrapper

 Wrapper for the [`jsdoc`][cli] command line tool for generating [JSDoc][] HTML
 output. Removes the existing destination directory if it exists, runs `jsdoc`,
 and emits the relative path to the generated `index.html` file.

Source: <https://github.com/mbland/jsdoc-cli-wrapper>

[![License](https://img.shields.io/github/license/mbland/jsdoc-cli-wrapper.svg)](https://github.com/mbland/jsdoc-cli-wrapper/blob/main/LICENSE.txt)
[![CI status](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/run-tests.yaml/badge.svg)](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/run-tests.yaml?branch=main)
[![Test results](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/publish-test-results.yaml/badge.svg)](https://github.com/mbland/jsdoc-cli-wrapper/actions/workflows/publish-test-results.yaml?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/mbland/jsdoc-cli-wrapper/badge.svg?branch=main)][coveralls-jsdw]
[![npm version](https://badge.fury.io/js/jsdoc-cli-wrapper.svg)][npm-jsdw]

## Installation

You probably want to install the [`jsdoc` CLI][cli] first, though the wrapper will
kindly suggest you do so if it can't find it. Using [`pnpm`][pnpm] to install it
once for all your local projects:

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
would use `jsdoc` on its own:

```sh
$ jsdoc-cli-wrapper -v
JSDoc 4.0.2 (Sun, 19 Feb 2023 23:01:18 GMT)
```

You may wish to add a `package.json` script (replacing `jsdoc-config.json` with
the path to your JSDoc config file):

```json
"scripts": {
  "jsdoc": "jsdoc-cli-wrapper -c ./jsdoc-config.json ."
}
```

### Opening the link

Running the wrapper will generate the local `file://` URL to the generated
`index.html` file, e.g.:

```text
file:///Users/.../jsdoc/jsdoc-cli-wrapper/1.0.0/index.html
```

You can click on or copy this link to open it in your browser. You can also open
this link from the command line via the following commands, replacing
`path/to/index.html` with your actual `index.html` path:

- **macOS**: `open file:///path/to/index.html`
- **Linux**: `xdg-open file:///path/to/index.html`
- **Windows**: `start file:///C:/path/to/index.html`

## Motivation

The `jsdoc` command will:

1. silently write new output into an existing directory, and
2. not show where the generated `index.html` entrypoint resides.

While admittedly minor annoyances, they're still annoyances:

1. It can be surprising to change the structure of your project, run `jsdoc`,
   and have stale files and directories laying around. This can make it
   inconvenient to find where the newly generated documentation actually is.

2. Seeing the path to the new `index.html` helps make sure things end up where
   you expect. This is especially useful when the JavaScript code is embedded in
   a larger, possibly multilanguage repository. It also makes it far more
   convenient to copy the path and open it in a browser.

`jsdoc` doesn't have any command line options to deal with either of these
issues. Not even `--verbose` nor `--debug` will show the path to `index.html`.

This wrapper resolves both of these minor annoyances.

## Examples

### This project

[The 'jsdoc' script from this project's `package.json`](./package.json) uses
[`jsdoc.json`](./jsdoc.json) as its configuration file, resulting in:

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
repository existed, it used a local version, reflected below):

```sh
$ cd strcalc/src/main/frontend
$ pnpm jsdoc

> tomcat-servlet-testing-example-frontend@0.0.0 jsdoc .../tomcat-servlet-testing-example/strcalc/src/main/frontend
> node bin/jsdoc-cli-wrapper.js -c ./jsdoc.json .

../../../build/jsdoc/tomcat-servlet-testing-example-frontend/0.0.0/index.html
```

## Development

Uses [pnpm][] and [Vitest][] for building and testing.

### JSON with comments

You may want to configure your editor to recognize comments in JSON files, since
this project and [JSDoc][] both support them.

#### [Vim][]

Add to your `~/.vimrc`, based on advice from [Stack Overflow: Why does Vim
highlight all my JSON comments in red?][so-vim]:

```vim
" With a little help from:
" - https://stackoverflow.com/questions/55669954/why-does-vim-highlight-all-my-json-comments-in-red
autocmd FileType json syntax match Comment "//.*"
autocmd FileType json syn region jsonBlockComment start="/\*" end="\*/" fold
autocmd FileType json hi def link jsonBlockComment Comment
```

#### [Visual Studio Code][]

[VS Code supports JSON with Comments][vsc-jsonc]. Following the good advice from
[Stack Overflow: In VS Code, disable error "Comments are not permitted in
JSON"][so-vsc]:

##### Method 1, verbatim from <https://stackoverflow.com/a/47834826>

1. Click on the letters JSON in the bottom right corner. (A drop-down will
   appear to "Select the Language Mode.")
2. Select "Configure File Association for '.json'..."
3. Type "jsonc" and press Enter.

##### Method 2, nearly verbatim from <https://stackoverflow.com/a/48773989>

Add this to your User Settings:

```json
"files.associations": {
    "*.json": "jsonc"
},
```

If you don't already have a user settings file, you can create one. Hit
**&#8984;, or CTRL-,** (that's a comma) to open your settings, then hit
the Open Settings (JSON) button in the upper right. (It looks like a page with a
little curved arrow over it.)

- Or invoke the **[Preferences: Open User Settings (JSON)][vsc-settings]**
  command.

#### [IntelliJ IDEA][]

You can effectively enable comments by [extending the JSON5 syntax to all JSON
files][idea-json5]:

1. In the Settings dialog (**&#8984;,** or **CTRL-,**), go to **Editor | File
   Types**.
2. In the **Recognized File Types** list, select **JSON5**.
3. In the **File Name Patterns** area, click **&#65291; (Add)** and type `.json`
   in the **Add Wildcard** dialog that opens.

## Background

I developed this while experimenting with JSDoc on
[mbland/tomcat-servlet-testing-example][]. I was surprised and frustrated that
the CLI was silent when it came to reporting where it emitted its output.

My first version of the wrapper was a short [Bash][] script, which is available
here as [`orig/jsdoc.sh`](./orig/jsdoc.sh). It was short and to the point, and
used variations of `sed` and `find` that I'd somehow never used before. (In
fact, that's the main reason why I'm keeping it around, for reference.)

It helped me move forward and was a great proof of concept, but was nowhere near
as robust as the [Node.js][] version in this package. It also wasn't natively
portable to Windows. So I decided to dig in and make it so, using it as a
Node.js, JSDoc, and [npm packaging][] exercise as well.

## Copyright

&copy; 2023 Mike Bland &lt;<mbland@acm.org>&gt; (<https://mike-bland.com/>)

## License

Licensed under the [Mozilla Public License, v. 2.0][mpl-20], included in this
repository as [LICENSE.txt](./LICENSE.txt). See the [MPL 2.0 FAQ][mpl-faq] for a
higher level explanation.

[JSDoc]: https://jsdoc.app/
[cli]: https://github.com/jsdoc/jsdoc
[coveralls-jsdw]: https://coveralls.io/github/mbland/jsdoc-cli-wrapper?branch=main
[npm-jsdw]: https://www.npmjs.com/package/jsdoc-cli-wrapper
[pnpm]: https://pnpm.io/
[mbland/tomcat-servlet-testing-example]: https://github.com/mbland/tomcat-servlet-testing-example
[Gradle]: https://gradle.org/
[Vitest]: https://vitest.dev/
[Vim]: https://www.vim.org/
[so-vim]: https://stackoverflow.com/questions/55669954/why-does-vim-highlight-all-my-json-comments-in-red
[Visual Studio Code]: https://code.visualstudio.com/
[vsc-jsonc]: https://code.visualstudio.com/Docs/languages/json#_json-with-comments
[so-vsc]: https://stackoverflow.com/questions/47834825/in-vs-code-disable-error-comments-are-not-permitted-in-json
[vsc-settings]: https://code.visualstudio.com/docs/getstarted/settings#_settingsjson
[IntelliJ IDEA]: https://www.jetbrains.com/idea/
[idea-json5]: https://www.jetbrains.com/help/idea/json.html#ws_json_choose_version_procedure
[Bash]: https://www.gnu.org/software/bash/
[Node.js]: https://nodejs.org/
[npm packaging]: https://docs.npmjs.com/packages-and-modules
[mpl-20]: https://mozilla.org/MPL/2.0/
[mpl-faq]: https://www.mozilla.org/MPL/2.0/FAQ/
