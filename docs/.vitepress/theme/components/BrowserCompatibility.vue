<script setup lang="ts">
import { withBase } from 'vitepress';

const browsers = [
  { name: 'Chrome', version: '75+', x: -3 },
  { name: 'Edge', version: '80+', x: -44 },
  { name: 'Firefox', version: '75+', x: -90 },
  { name: 'Opera', version: '60+', x: -132 },
  { name: 'Safari', version: '14.1+', x: -175 },
];

const sprite = `url('${withBase('/images/browsers.png')}')`;
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="b in browsers" :key="b.name" style="text-align: center">
          <div
            class="browser-icon"
            role="img"
            :aria-label="b.name"
            :title="b.name"
            :style="{ backgroundImage: sprite, backgroundPosition: `${b.x}px -3px` }"
          />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td v-for="b in browsers" :key="b.name" style="text-align: center">{{ b.version }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.browser-icon {
  width: 37px;
  height: 37px;
  background-size: 215px;
  background-repeat: no-repeat;
  display: inline-block;
}
</style>
