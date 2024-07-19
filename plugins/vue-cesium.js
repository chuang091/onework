import { defineNuxtPlugin } from '@nuxtjs/composition-api';
import VueCesium from 'vue-cesium';
import 'vue-cesium/lib/vue-cesium.css';

export default defineNuxtPlugin((context, inject) => {
  context.vueApp.use(VueCesium, {
    cesiumPath: 'https://unpkg.com/cesium@latest/Build/Cesium/Cesium.js'
  });
});
