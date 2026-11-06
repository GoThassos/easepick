
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import terser from '@rollup/plugin-terser';
import * as sass from 'sass';
import { fileURLToPath, pathToFileURL } from 'url';

const path = require('path');
const pkg = require('./package.json');
const ENV_PROD = process.env.BUILD === 'production';

// Drop `import './index.scss'` from emitted .d.ts files: types do not need
// styles, and TypeScript 6 (noUncheckedSideEffectImports on by default)
// reports them as errors in consumers' projects.
const stripStyleImportsFromDeclarations = () => ({
  name: 'strip-style-imports-from-declarations',
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'asset' && file.fileName.endsWith('.d.ts')) {
        file.source = String(file.source).replace(/^import ['"][^'"]+\.s?css['"];\r?\n/gm, '');
      }
    }
  },
});

// rollup-plugin-postcss's built-in Sass loader calls the legacy render() API,
// which Dart Sass deprecates and will remove in 2.0. A loader registered under
// the same name replaces it.
const sassLoader = {
  name: 'sass',
  test: /\.scss$/,
  process({ code }) {
    const result = sass.compileString(code, {
      url: pathToFileURL(this.id),
      sourceMap: Boolean(this.sourceMap),
      sourceMapIncludeSources: true,
    });

    for (const url of result.loadedUrls) {
      if (url.protocol === 'file:') {
        this.dependencies.add(fileURLToPath(url));
      }
    }

    return {
      code: result.css,
      map: result.sourceMap && JSON.stringify(result.sourceMap),
    };
  },
};

const output = (name) => {
  const pkg = require(path.join(__dirname, `packages/${name}/package.json`));

  return [
    {
      file: `packages/${name}/dist/index.umd.js`,
      format: 'umd',
      name: 'easepick',
      sourcemap: false,
      extend: true,
      banner: `/**
* @license
* Package: ${pkg.name}
* Version: ${pkg.version}
* https://github.com/GoThassos/easepick
* Copyright (c) 2026 Rinat Garifyanov
*
* Licensed under the ${pkg.license} License.
*/`,
      globals(id) {
        if (/^@gothassos\//.test(id)) {
          return 'easepick';
        }

        return id;
      }
    },
    {
      file: `packages/${name}/dist/index.esm.js`,
      format: 'esm',
      sourcemap: false,
      extend: true,
    },
  ];
}

const input = (name) => {
  return `packages/${name}/src/index.ts`;
}

const getPackageConfig = (name) => {
  return {
    input: input(name),
    output: output(name),
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __VERSION__: JSON.stringify(pkg.version),
        },
      }),
      resolve({
        resolveOnly: [/^@gothassos\/.*$/]
      }),
      typescript({
        tsconfig: `packages/${name}/tsconfig.json`,
        declaration: true,
        declarationDir: path.join(__dirname, `packages/${name}/dist`),
        outputToFilesystem: false,
      }),
      postcss({
        extract: 'index.css',
        loaders: [sassLoader],
        plugins: [autoprefixer],
        minimize: ENV_PROD,
      }),
      ENV_PROD && terser(),
      stripStyleImportsFromDeclarations(),
    ],
    external(id) {
      return /^@gothassos\//.test(id);
    }
  };
}

export default [
  getPackageConfig('datetime'),
  getPackageConfig('core'),

  getPackageConfig('base-plugin'),
  getPackageConfig('lock-plugin'),
  getPackageConfig('range-plugin'),
  getPackageConfig('preset-plugin'),
  getPackageConfig('time-plugin'),
  getPackageConfig('kbd-plugin'),
  getPackageConfig('amp-plugin'),
  getPackageConfig('sample-plugin'),
  getPackageConfig('mselect-plugin'),

  // @gothassos/bundle
  {
    input: 'packages/bundle/src/index.ts',
    output: output('bundle'),
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __VERSION__: JSON.stringify(pkg.version),
        },
      }),
      resolve({
        dedupe: ['@gothassos/easepick-base-plugin'],
        resolveOnly: [/^@gothassos\/.*$/]
      }),
      typescript({
        tsconfig: 'packages/bundle/tsconfig.json',
        declaration: true,
        declarationDir: path.join(__dirname, 'packages/bundle/dist'),
        outputToFilesystem: false,
      }),
      postcss({
        extract: 'index.css',
        loaders: [sassLoader],
        plugins: [autoprefixer],
        minimize: ENV_PROD,
      }),
      ENV_PROD && terser(),
      stripStyleImportsFromDeclarations(),
    ],
  },
]
