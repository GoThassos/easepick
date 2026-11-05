<script setup lang="ts">
// Live picker for the example pages: <Demo name="hotel" />. Options live in ../demos.ts.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { loadEasepick, pickerCss } from '../easepick';
import { demos } from '../demos';

const props = defineProps<{
  name: string;
  /** Hide the input (for `inline: true` pickers). */
  hideInput?: boolean;
}>();

const input = ref<HTMLInputElement>();
const loading = ref(true);
let picker: { destroy(): void } | undefined;
let unmounted = false;

onMounted(async () => {
  const factory = demos[props.name];
  if (!factory) {
    console.warn(`No easepick demo named "${props.name}".`);
    return;
  }

  const ep = await loadEasepick();
  if (unmounted) return;

  const options = factory(ep);
  const extraCss = (options.css as string[] | undefined) ?? [];

  picker = new ep.create({
    ...options,
    element: input.value,
    css: pickerCss(extraCss.map((href) => withBase(href))),
  });
  loading.value = false;
});

onBeforeUnmount(() => {
  unmounted = true;
  picker?.destroy();
});
</script>

<template>
  <div class="easepick-demo" :class="{ loading }">
    <input ref="input" type="text" class="easepick-demo-input" :hidden="hideInput" />
  </div>
</template>

<style scoped>
.easepick-demo {
  margin: 16px 0;
}

.easepick-demo.loading {
  min-height: 2rem;
}
</style>
