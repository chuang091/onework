<template>
  <div id="app">
    <div class="container">
      <div class="left">
        <Cesium />
      </div>
      <div class="right">
        <Mapbox />
      </div>
    </div>
  </div>
</template>

<script>
import Cesium from './components/Cesium.vue';
import Mapbox from './components/Mapbox.vue';

export default {
  components: {
    Cesium,
    Mapbox
  }
};
</script>

<style>
.container {
  display: flex;
  width: 100%;
  height: 100vh;
}

.left,
.right {
  width: 50%;
  height: 100%;
}

.left {
  border-right: 1px solid #ccc;
}
</style>
