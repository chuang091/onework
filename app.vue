<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  mounted() {
    const cesium = this.$cesium;

    // 初始化 Cesium Viewer
    const viewer = new cesium.Viewer('cesiumContainer', {
      imageryProvider: new cesium.IonImageryProvider()
    });
  }
};
</script>

<style>
#cesiumContainer {
  width: 100%;
  height: 100vh;
}
</style>
