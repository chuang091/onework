<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  mounted() {
    const cesium = this.$cesium;
    const viewer = new cesium.Viewer('cesiumContainer', {
      imageryProvider: new cesium.IonImageryProvider()
    });

    viewer.camera.setView({
      destination: cesium.Cartesian3.fromDegrees(121.5654, 25.0330, 10000),
      orientation: {
        heading: cesium.Math.toRadians(0),
        pitch: cesium.Math.toRadians(-45),
        roll: 0
      }
    });

    viewer.camera.moveEnd.addEventListener(() => {
      const center = viewer.camera.positionCartographic;
      const newCoordinates = {
        longitude: cesium.Math.toDegrees(center.longitude),
        latitude: cesium.Math.toDegrees(center.latitude),
        zoom: viewer.camera.positionCartographic.height,
        pitch: cesium.Math.toDegrees(viewer.camera.pitch),
        bearing: cesium.Math.toDegrees(viewer.camera.heading)
      };
      console.log('Cesium camera move end', newCoordinates);
      this.$store.dispatch('updateCoordinates', newCoordinates);
    });

    this.$store.watch(
      state => state.coordinates,
      coordinates => {
        console.log('Cesium store watch', coordinates);
        viewer.camera.setView({
          destination: cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.zoom),
          orientation: {
            heading: cesium.Math.toRadians(coordinates.bearing),
            pitch: cesium.Math.toRadians(coordinates.pitch),
            roll: 0
          }
        });
      },
      { immediate: true }
    );
  }
};
</script>

<style>
#cesiumContainer {
  width: 100%;
  height: 100vh;
}
</style>
