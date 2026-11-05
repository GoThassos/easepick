import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { useRoute, withBase } from 'vitepress';
import { h, nextTick, onMounted, watch } from 'vue';
import Demo from './components/Demo.vue';
import BrowserCompatibility from './components/BrowserCompatibility.vue';
import Configurator from './components/Configurator.vue';
import { fillDatePlaceholders } from './easepick';
import './custom.css';

/** As on the original site, the tab icon shows today's day of the month (favicon/1–31.png). */
function setDailyFavicon() {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = withBase(`/favicon/${new Date().getDate()}.png`);
}

export default {
  extends: DefaultTheme,

  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Inline two-month range picker under the hero, like the original home page.
      'home-hero-after': () => h('div', { class: 'home-demo' }, [h(Demo, { name: 'home', hideInput: true })]),
    });
  },

  enhanceApp({ app }) {
    app.component('Demo', Demo);
    app.component('BrowserCompatibility', BrowserCompatibility);
    app.component('Configurator', Configurator);
  },

  setup() {
    const route = useRoute();
    const fill = () => nextTick(() => fillDatePlaceholders(document.querySelector('.vp-doc')));
    onMounted(() => {
      fill();
      setDailyFavicon();
    });
    watch(() => route.path, fill, { flush: 'post' });
  },
} satisfies Theme;
