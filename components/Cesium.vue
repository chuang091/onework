<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  mounted() {
    const cesium = this.$cesium;
    this.viewer = new cesium.Viewer('cesiumContainer', {
      imageryProvider: new cesium.IonImageryProvider(),
      geocoder: false,
      sceneMode: cesium.SceneMode.COLUMBUS_VIEW,
      mapProjection: new cesium.WebMercatorProjection()
    });

    this.viewer.sceneModePicker.viewModel.duration = 0;
    this.viewer.sceneModePicker.viewModel.columbusViewMode = true;
    this.viewer.sceneModePicker.viewModel.sceneMode = cesium.SceneMode.COLUMBUS_VIEW;

    let isUpdatingFromCesium = false;
    let isUpdatingFromMapbox = false;
    let moveTimeout = null;

    const convertRangeToZoom = (range) => {
      let zoom = Math.round(Math.log(35200000 / range) / Math.log(2));
      return Math.max(0, Math.min(19, zoom));
    };

    const convertZoomToRange = (zoom) => {
      return Math.max(300, 35200000 / Math.pow(2, zoom));
    };

    const convertCesiumPitchToMapbox = (pitch) => 90 - pitch;

    const convertMapboxPitchToCesium = (pitch) => pitch - 90;

    this.viewer.camera.changed.addEventListener(() => {
      if (isUpdatingFromMapbox) return;
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isUpdatingFromCesium = true;
        const center = this.viewer.camera.positionCartographic;
        const newCoordinates = {
          longitude: cesium.Math.toDegrees(center.longitude),
          latitude: cesium.Math.toDegrees(center.latitude),
          zoom: convertRangeToZoom(this.viewer.camera.positionCartographic.height),
          pitch: convertCesiumPitchToMapbox(Math.abs(cesium.Math.toDegrees(this.viewer.camera.pitch))),
          bearing: cesium.Math.toDegrees(this.viewer.camera.heading)
        };
        console.log('Cesium camera move end', newCoordinates);
        this.$store.dispatch('updateCoordinatesFromCesium', newCoordinates);
        setTimeout(() => {
          isUpdatingFromCesium = false;
        }, 1000);
      }, 500);
    });

    this.$store.watch(
      (state) => state.coordinates,
      (coordinates) => {
        if (coordinates.source === 'cesium' || isUpdatingFromCesium) return;
        isUpdatingFromMapbox = true;
        console.log('Cesium store watch', coordinates);
        this.viewer.camera.flyTo({
          destination: cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, convertZoomToRange(coordinates.zoom)),
          orientation: {
            heading: cesium.Math.toRadians(coordinates.bearing),
            pitch: cesium.Math.toRadians(convertMapboxPitchToCesium(coordinates.pitch)),
            roll: 0
          }
        });
        setTimeout(() => {
          isUpdatingFromMapbox = false;
        }, 1000);
      },
      { immediate: true }
    );

    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'setRoute') {
        this.drawRoute(state.route);
      }
    });
  },
  methods: {
    drawRoute(route) {
      if (!route || !route.legs) {
        console.error('Invalid route data:', route);
        return;
      }

      const cesium = this.$cesium;
      const viewer = this.viewer;

      viewer.entities.removeAll();

      route.legs.forEach((leg) => {
        const color = leg.weight_name === 'pedestrian' ? cesium.Color.GREEN : cesium.Color.BLUE;

        viewer.entities.add({
          polyline: {
            positions: cesium.Cartesian3.fromDegreesArray(leg.geometry.coordinates.flat()),
            width: 5,
            material: color
          }
        });
      });

      const start = route.legs[0].geometry.coordinates[0];
      const end = route.legs[route.legs.length - 1].geometry.coordinates.slice(-1)[0];

      viewer.entities.add({
        position: cesium.Cartesian3.fromDegrees(start[0], start[1]),
        point: {
          pixelSize: 10,
          color: cesium.Color.GREEN
        },
        label: {
          text: '起點',
          verticalOrigin: cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new cesium.Cartesian2(0, -10)
        }
      });

      viewer.entities.add({
        position: cesium.Cartesian3.fromDegrees(end[0], end[1]),
        point: {
          pixelSize: 10,
          color: cesium.Color.RED
        },
        label: {
          text: '終點',
          verticalOrigin: cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new cesium.Cartesian2(0, -10)
        }
      });

      const boundingSphere = cesium.BoundingSphere.fromPoints(
        route.legs.flatMap((leg) => leg.geometry.coordinates.map((coord) => cesium.Cartesian3.fromDegrees(coord[0], coord[1])))
      );
      viewer.camera.flyToBoundingSphere(boundingSphere, { duration: 0 });
    }
  }
};
</script>

<style>
#cesiumContainer {
  width: 100%;
  height: 100vh;
}
</style>
