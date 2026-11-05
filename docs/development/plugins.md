# Creating plugins

## Sample plugin

[`packages/sample-plugin`](https://github.com/GoThassos/easepick/tree/master/packages/sample-plugin) is a minimal plugin to start from. It colors today's day cell by listening to the picker's `view` event, and shows the parts every plugin has:

- `getName()` returns the name the plugin's options are read from (`SamplePlugin: { ... }`).
- `onAttach()` / `onDetach()` add and remove event listeners.
- `options` holds the defaults; the user's options are merged over them.
- `src/interface.ts` adds the options to the picker's config type through module augmentation.

It is built, tested and type-checked with the other packages, but not published to npm.

## Creating plugin in own repository

Copy `packages/sample-plugin` into a new repository, then:

1. Rename the package and the plugin class.
2. Add the `@gothassos/easepick-*` packages it imports as dependencies, plus a build setup (the root `rollup.config.js` and `tsconfig.json` are a starting point).
3. Remove `"private": true` from `package.json` to publish it.

## Adding plugin in main repository

1. Copy `packages/sample-plugin` to a new folder in `packages`. (Eg.: myawesome-plugin)
2. Rename the package in `package.json` and the plugin in `src`, and remove `"private": true` if it should be published.
3. Run `npm install` so npm links the new workspace into `node_modules/@gothassos`.
4. Add plugin references in `~/tsconfig.json`.
5. Add plugin in `rollup.config.js` file.
