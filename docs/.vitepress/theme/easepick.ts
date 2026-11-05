// Loads this repo's own easepick build (packages/bundle/dist) for the live demos.
// Run `npm run prod` first so the dist files exist.
//
// The bundle stylesheet is inlined as text rather than imported with `?url`: VitePress
// links the first .css file in the build output as the site stylesheet, so emitting
// another one would replace the theme's styles.
import bundleCss from '@gothassos/easepick-bundle/dist/index.css?inline';

export type Bundle = typeof import('@gothassos/easepick-bundle');

declare global {
  interface Window {
    easepick?: Bundle;
  }
}

/** Stylesheet text for the picker's shadow DOM. */
export const css: string = bundleCss;

/**
 * Value for the picker's `css` option: the bundle styles, then any extra stylesheets
 * (same order as `css: [bundleUrl, ...extraUrls]` on a page using the CDN).
 */
export function pickerCss(extraUrls: string[]): string | ((picker: { ui: { shadowRoot: ShadowRoot } }) => void) {
  if (!extraUrls.length) return bundleCss;

  return (picker) => {
    const style = document.createElement('style');
    style.textContent = bundleCss;
    const links = extraUrls.map((href) => Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
    picker.ui.shadowRoot.append(style, ...links);
  };
}

let loading: Promise<Bundle> | undefined;

/**
 * Import the bundle in the browser and expose it as `window.easepick`, as the UMD build
 * does. Core looks up plugins given by name (`plugins: ['RangePlugin']`) on that global.
 */
export function loadEasepick(): Promise<Bundle> {
  loading ??= import('@gothassos/easepick-bundle').then((mod) => {
    window.easepick = { ...mod };
    return mod;
  });
  return loading;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Replace the `[js.date.yyyy]`, `[js.date.mm]` and `[js.date.dd]` placeholders in code
 * samples with today's date, so examples with booked or locked days show the current month.
 */
export function fillDatePlaceholders(root: ParentNode | null): void {
  if (!root) return;
  const now = new Date();
  const values: Record<string, string> = {
    '[js.date.yyyy]': String(now.getFullYear()),
    '[js.date.mm]': pad(now.getMonth() + 1),
    '[js.date.dd]': pad(now.getDate()),
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue?.includes('[js.date.')) {
      node.nodeValue = node.nodeValue.replace(/\[js\.date\.(yyyy|mm|dd)\]/g, (m) => values[m]);
    }
  }
}
