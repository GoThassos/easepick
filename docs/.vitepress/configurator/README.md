# Configurator

Source of the [Configurator](https://gothassos.github.io/easepick/configurator/) page.

Ported from [easepick/configurator](https://github.com/easepick/configurator) v1.0.8 by Rinat G. Unlike the rest of this repository (MIT), the files in this folder are licensed under the **GNU General Public License v2.0 or later**. See [LICENSE.md](LICENSE.md).

Changes from the original:

- Exports `mountConfigurator(app, cssUrl)` instead of registering a `gh.configurator()` global, and uses `@gothassos/easepick-bundle` from this repo instead of a CDN build.
- Install commands, CDN links and the quick example are built as plain text instead of by string-replacing Prism-highlighted samples hidden in the page.
- Package names and links point to the `@gothassos/easepick-*` packages and this site.
- Dark mode follows the site's theme toggle (`html.dark`) instead of `prefers-color-scheme`.
- Not obfuscated or minified separately: VitePress bundles it with the site.
