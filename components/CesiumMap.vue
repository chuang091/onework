<template>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </template>
  
  <script>
  export default {
    mounted() {
      this.initCesium();
    },
    methods: {
      initCesium() {
        const Cesium = this.$cesium;
        if (Cesium) {
          try {
            const viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
              terrainProvider: Cesium.createWorldTerrain(),
            });
            viewer.scene.globe.enableLighting = true;
          } catch (error) {
            console.error('Error initializing Cesium:', error);
          }
        } else {
          console.error('Cesium is not available');
        }
      },
    },
  };
  </script>
  
  <style>
  .cesium-container {
    width: 100%;
    height: 100vh;
  }
  </style>
  