# Development environment

The main package’s GitHub repository hosts [all other easepick sub-packages](https://github.com/GoThassos/easepick/tree/master/packages).

## Requirements

In order to start developing `easepick` you will require:

* Node.js 22+
* npm 10+
* Git

## Setting up the easepick development environment

Clone the `easepick` repository:

```bash
git clone https://github.com/GoThassos/easepick.git
cd easepick
```

And install all easepick dependencies from the [npm registry](https://www.npmjs.com/).

```bash
npm install
```

The packages are npm workspaces, so `npm install` links them into `node_modules/@gothassos/` for you.

## Running tests

In order to run tests, you need to use the `test`.

```bash
npm test
```

Any new code that can be tested must come with tests, bug fixes included. The packages are at 100% coverage and CI fails if it drops. Check it with:

```bash
npm run test:coverage
```

See [CONTRIBUTING.md](https://github.com/GoThassos/easepick/blob/master/CONTRIBUTING.md) for what to run before opening a pull request.

## Creating a build

Creating development version:

```bash
npm run dev
```

Creating minified version:

```bash
npm run prod
```

## Working on the documentation

This site lives in the `docs/` folder and is built with [VitePress](https://vitepress.dev/). Its live demos use the packages built from this repository, so build them first:

```bash
npm run prod
npm run docs:dev
```

`npm run docs:build` creates the static site in `docs/.vitepress/dist`.
