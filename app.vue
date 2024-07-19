<template>
  <div class="dual-map-container">
    <div ref="cesiumContainer" class="map" />
    <div ref="mapboxContainer" class="map" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const cesiumContainer = ref(null);
const mapboxContainer = ref(null);

const { $cesium, $mapbox } = useNuxtApp();

const initializeCesium = () => {
  const viewer = new $cesium.Viewer(cesiumContainer.value, {
    imageryProvider: new $cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/'
    })
  });
};

const initializeMapbox = () => {
  const map = new $mapbox.Map({
    container: mapboxContainer.value,
    style: 'mapbox://styles/mapbox/streets-v11'
  });
};

onMounted(() => {
  initializeCesium();
  initializeMapbox();
});
</script>

<style>
.dual-map-container {
  display: flex;
}
.map {
  width: 50%;
  height: 100vh;
}
</style>
