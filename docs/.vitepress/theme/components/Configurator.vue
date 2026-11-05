<script setup lang="ts">
// Markup ported from the original docs' components/configurator.vue. The logic is the
// configurator in ../../configurator/, mounted here against this repo's bundle.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { css, loadEasepick } from '../easepick';
import '../../configurator/scss/index.scss';

const app = ref<HTMLElement>();
const loading = ref(true);
let destroy: (() => void) | undefined;
let unmounted = false;

onMounted(async () => {
  await loadEasepick();
  const { mountConfigurator } = await import('../../configurator/index');
  if (unmounted || !app.value) return;

  destroy = mountConfigurator(app.value, css);
  loading.value = false;
});

onBeforeUnmount(() => {
  unmounted = true;
  destroy?.();
});
</script>

<template>
  <div id="app-configurator" ref="app" :class="{ loading }">
    <div class="app-picker-layout">
      <div>
        <input id="app-picker" />
        <input id="app-picker-end" />
      </div>
    </div>
    <div class="app-wrapper">
      <div class="packages-list"></div>
      <div class="package-options">
        <div class="pkg-options-content"></div>
      </div>
    </div>

    <div class="custom-block tip">
      <p>Currently some options may not be available in the configurator.</p>
      <p>
        <span>You want to display all options anyway ?</span>
        <a href="#" id="yes-btn">Yes</a> <a href="#" id="no-btn">No</a>
      </p>
    </div>

    <h2 id="installation" tabindex="-1">
      Installation <a class="header-anchor" href="#installation" aria-label="Permalink to &quot;Installation&quot;">&#8203;</a>
    </h2>

    <div class="package-install">
      <div class="tabs-wrapper tabs-horizontal">
        <div class="tabs uppercase">
          <div class="tab active">
            <input type="radio" name="package_install" checked />
            bundle
          </div>
          <div class="tab">
            <input type="radio" name="package_install" />
            modular
          </div>
        </div>
        <div class="contents">
          <div class="tab-content active">
            <div class="tabs-wrapper tabs-vertical">
              <div class="tabs uppercase">
                <div class="tab active">npm</div>
                <div class="tab">cdn</div>
              </div>
              <div class="contents bg">
                <div class="tab-content active" id="bundle-npm"></div>
                <div class="tab-content" id="bundle-cdn"></div>
              </div>
            </div>
          </div>
          <div class="tab-content">
            <div class="tabs-wrapper tabs-vertical">
              <div class="tabs uppercase">
                <div class="tab active">npm</div>
                <div class="tab">cdn</div>
              </div>
              <div class="contents bg">
                <div class="tab-content active" id="modular-npm"></div>
                <div class="tab-content" id="modular-cdn"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h2 id="quick-example" tabindex="-1">
      Quick example <a class="header-anchor" href="#quick-example" aria-label="Permalink to &quot;Quick example&quot;">&#8203;</a>
    </h2>

    <div class="language-html">
      <span class="lang">html</span>
      <pre><code id="quick-example-code"></code></pre>
    </div>
  </div>
</template>

<style scoped>
#app-configurator.loading {
  min-height: 300px;
  opacity: 0.4;
  pointer-events: none;
}
</style>
