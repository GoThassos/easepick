import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bundlePkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../packages/bundle/package.json', import.meta.url)), 'utf-8'),
);

/** Version shown in CDN links and install snippets: the version this repo builds. */
const VERSION: string = bundlePkg.version;
const REPO = 'https://github.com/GoThassos/easepick';
const BASE = '/easepick/';
/** Packages with a page under /packages/ (docs/packages/<name>.md). */
const PACKAGE_PAGES = [
  'core', 'datetime', 'base-plugin', 'range-plugin', 'time-plugin',
  'lock-plugin', 'preset-plugin', 'kbd-plugin', 'amp-plugin', 'bundle',
];

export default defineConfig({
  title: 'easepick',
  description: 'Date picker - tiny size, no dependencies',
  base: BASE,
  cleanUrls: true,
  lastUpdated: true,
  // The option/method tables link to `#option-*` anchors that the original site never defined.
  ignoreDeadLinks: [/^#/],

  head: [
    ['link', { rel: 'icon', href: `${BASE}favicon.ico` }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { property: 'og:image', content: `${BASE}images/og_image.png` }],
  ],

  sitemap: {
    hostname: `https://gothassos.github.io${BASE}`,
  },

  markdown: {
    config(md) {
      // The original site swapped `[version.number]` for the latest release in the browser.
      // Here it is the version of the packages in this repo, filled in at build time.
      // The package pages include the packages' READMEs (<!--@include-->), whose links to
      // other packages point at GitHub: send those to the package pages of this site.
      const packageLinks = new RegExp(`${REPO}/tree/master/packages/(${PACKAGE_PAGES.join('|')})(?:#readme)?(?=[)#\\s])`, 'g');
      const parse = md.parse.bind(md);
      md.parse = (src, env) => parse(
        src.replace(/\[version\.number\]/g, VERSION).replace(packageLinks, '/packages/$1'),
        env,
      );
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      },
    },
    ssr: {
      // Plain ESM builds from this monorepo; let Vite bundle them for SSR.
      noExternal: [/^@gothassos\//],
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Configurator', link: '/configurator/' },
      { text: `v${VERSION}`, link: `${REPO}/releases` },
    ],

    socialLinks: [{ icon: 'github', link: REPO }],

    editLink: {
      pattern: `${REPO}/edit/master/docs/:path`,
      text: 'Edit this page on GitHub',
    },

    search: { provider: 'local' },

    footer: {
      message:
        'Released under the MIT License. Based on the original <a href="https://github.com/easepick/docs">easepick docs</a> by <a href="https://github.com/wakirin">Rinat G.</a>',
    },

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Guide', link: '/guide/' },
          { text: 'Configurator', link: '/configurator/' },
        ],
      },
      {
        text: 'Packages',
        items: [
          { text: 'bundle', link: '/packages/bundle' },
          { text: 'base-plugin', link: '/packages/base-plugin' },
          { text: 'datetime', link: '/packages/datetime' },
          { text: 'core', link: '/packages/core' },
          { text: 'amp-plugin', link: '/packages/amp-plugin' },
          { text: 'kbd-plugin', link: '/packages/kbd-plugin' },
          { text: 'lock-plugin', link: '/packages/lock-plugin' },
          { text: 'range-plugin', link: '/packages/range-plugin' },
          { text: 'preset-plugin', link: '/packages/preset-plugin' },
          { text: 'time-plugin', link: '/packages/time-plugin' },
        ],
      },
      {
        text: 'Examples',
        collapsed: false,
        items: [
          { text: 'Basic example', link: '/examples/basic' },
          { text: 'Basic hotel calendar', link: '/examples/hotel' },
          { text: 'Show nights in tooltip', link: '/examples/nights' },
          { text: 'Using another language', link: '/examples/language' },
          { text: 'Allowed days', link: '/examples/allowed-days' },
          { text: 'Days with prices', link: '/examples/days-with-prices' },
          { text: 'Customize', link: '/examples/customize' },
          { text: 'Month picker', link: '/examples/month-picker' },
          { text: 'Year picker', link: '/examples/year-picker' },
        ],
      },
      {
        text: 'Development',
        collapsed: true,
        items: [
          { text: 'Environment', link: '/development/environment' },
          { text: 'Creating plugins', link: '/development/plugins' },
        ],
      },
      {
        text: 'Support',
        collapsed: true,
        items: [
          { text: 'Getting support', link: '/support/getting-support' },
          { text: 'Reporting issues', link: '/support/reporting-issues' },
          { text: 'License', link: '/support/license' },
        ],
      },
    ],
  },
});
