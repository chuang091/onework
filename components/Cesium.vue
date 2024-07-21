<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  mounted() {
    const cesium = this.$cesium;
    const viewer = new cesium.Viewer('cesiumContainer', {
      imageryProvider: new cesium.IonImageryProvider(),
      geocoder: false,
      sceneMode: cesium.SceneMode.COLUMBUS_VIEW, // 設置為 Columbus View 模式
      mapProjection: new cesium.WebMercatorProjection() // 使用 Web Mercator 投影
    });

    // 禁用其他模式的按鈕
    viewer.sceneModePicker.viewModel.duration = 0;
    viewer.sceneModePicker.viewModel.columbusViewMode = true;
    viewer.sceneModePicker.viewModel.sceneMode = cesium.SceneMode.COLUMBUS_VIEW;

    let isUpdatingFromCesium = false;
    let isUpdatingFromMapbox = false;
    let moveTimeout = null;

    function convertRangeToZoom(range) {
      let zoom = Math.round(Math.log(35200000 / range) / Math.log(2));
      if (zoom < 0) zoom = 0;
      else if (zoom > 19) zoom = 19;
      return zoom;
    }

    function convertZoomToRange(zoom) {
      let range = 35200000 / Math.pow(2, zoom);
      if (range < 300) range = 300;
      return range;
    }

    function convertCesiumPitchToMapbox(pitch) {
      return 90 - pitch;
    }

    function convertMapboxPitchToCesium(pitch) {
      return pitch - 90;
    }

    viewer.camera.changed.addEventListener(() => {
      if (isUpdatingFromMapbox) return;
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isUpdatingFromCesium = true;
        const center = viewer.camera.positionCartographic;
        const newCoordinates = {
          longitude: cesium.Math.toDegrees(center.longitude),
          latitude: cesium.Math.toDegrees(center.latitude),
          zoom: convertRangeToZoom(viewer.camera.positionCartographic.height),
          pitch: convertCesiumPitchToMapbox(Math.abs(cesium.Math.toDegrees(viewer.camera.pitch))),
          bearing: cesium.Math.toDegrees(viewer.camera.heading)
        };
        console.log('Cesium camera move end', newCoordinates);
        this.$store.dispatch('updateCoordinatesFromCesium', newCoordinates);
        setTimeout(() => {
          isUpdatingFromCesium = false;
        }, 1000); // 1秒後清除標誌
      }, 500); // 500 毫秒的延遲
    });

    this.$store.watch(
      state => state.coordinates,
      coordinates => {
        if (coordinates.source === 'cesium' || isUpdatingFromCesium) return;
        isUpdatingFromMapbox = true;
        console.log('Cesium store watch', coordinates);
        viewer.camera.flyTo({
          destination: cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, convertZoomToRange(coordinates.zoom)),
          orientation: {
            heading: cesium.Math.toRadians(coordinates.bearing),
            pitch: cesium.Math.toRadians(convertMapboxPitchToCesium(coordinates.pitch)),
            roll: 0
          }
        });
        setTimeout(() => {
          isUpdatingFromMapbox = false;
        }, 1000); // 1秒後清除標誌
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
