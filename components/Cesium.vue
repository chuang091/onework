<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  data() {
    return {
      previousVisibleFeaturesCount: 0,
      previousBounds: { west: 0, south: 0, east: 0, north: 0 },
      boundsChangeThreshold: 0.0001, // 設置一個閾值
      maxFeatures: 5000 // 設置最大特徵數量
    };
  },
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

    this.viewer.scene.camera.moveEnd.addEventListener(() => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        this.loadVisibleOSMData();
      }, 500);
    });
  },
  methods: {
    async loadVisibleOSMData() {
      try {
        const cesium = this.$cesium;
        const viewer = this.viewer;
        const camera = viewer.camera;
        const canvas = viewer.scene.canvas;

        const topLeft = camera.pickEllipsoid(new cesium.Cartesian2(0, 0));
        const topRight = camera.pickEllipsoid(new cesium.Cartesian2(canvas.width, 0));
        const bottomLeft = camera.pickEllipsoid(new cesium.Cartesian2(0, canvas.height));
        const bottomRight = camera.pickEllipsoid(new cesium.Cartesian2(canvas.width, canvas.height));

        if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
          throw new Error('Could not compute view rectangle');
        }

        const ellipsoid = cesium.Ellipsoid.WGS84;

        const topLeftCartographic = ellipsoid.cartesianToCartographic(topLeft);
        const topRightCartographic = ellipsoid.cartesianToCartographic(topRight);
        const bottomLeftCartographic = ellipsoid.cartesianToCartographic(bottomLeft);
        const bottomRightCartographic = ellipsoid.cartesianToCartographic(bottomRight);

        // 確保經緯度值不為 NaN
        if (isNaN(topLeftCartographic.longitude) || isNaN(topRightCartographic.longitude) ||
            isNaN(bottomLeftCartographic.longitude) || isNaN(bottomRightCartographic.longitude) ||
            isNaN(topLeftCartographic.latitude) || isNaN(topRightCartographic.latitude) ||
            isNaN(bottomLeftCartographic.latitude) || isNaN(bottomRightCartographic.latitude)) {
          console.error('Computed cartographic values have NaN components');
          console.error({
            topLeftCartographic,
            topRightCartographic,
            bottomLeftCartographic,
            bottomRightCartographic
          });
          throw new Error('Computed cartographic values have NaN components');
        }

        const bounds = {
          west: parseFloat(Math.min(topLeftCartographic.longitude, bottomLeftCartographic.longitude).toFixed(6)),
          south: parseFloat(Math.min(bottomLeftCartographic.latitude, bottomRightCartographic.latitude).toFixed(6)),
          east: parseFloat(Math.max(topRightCartographic.longitude, bottomRightCartographic.longitude).toFixed(6)),
          north: parseFloat(Math.max(topLeftCartographic.latitude, topRightCartographic.latitude).toFixed(6))
        };

        const boundsChanged = Math.abs(bounds.west - this.previousBounds.west) > this.boundsChangeThreshold ||
                              Math.abs(bounds.south - this.previousBounds.south) > this.boundsChangeThreshold ||
                              Math.abs(bounds.east - this.previousBounds.east) > this.boundsChangeThreshold ||
                              Math.abs(bounds.north - this.previousBounds.north) > this.boundsChangeThreshold;

        if (!boundsChanged) {
          console.log('Bounds have not changed significantly.');
          return;
        }

        this.previousBounds = bounds;

        console.log('Computed bounds:', bounds);

        const response = await fetch('/osm-data.geojson');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const visibleFeatures = {
          type: 'FeatureCollection',
          features: data.features.filter(feature => {
            if (feature.geometry.type === 'Polygon') {
              return feature.geometry.coordinates.some(polygon =>
                polygon.some(coord => (
                  !isNaN(coord[0]) &&
                  !isNaN(coord[1]) &&
                  coord[0] >= cesium.Math.toDegrees(bounds.west) &&
                  coord[0] <= cesium.Math.toDegrees(bounds.east) &&
                  coord[1] >= cesium.Math.toDegrees(bounds.south) &&
                  coord[1] <= cesium.Math.toDegrees(bounds.north)
                ))
              );
            }
            return false;
          })
        };

        if (visibleFeatures.features.length === 0) {
          console.log('No visible features to render.');
          return;
        }

        if (visibleFeatures.features.length === this.previousVisibleFeaturesCount) {
          console.log('Visible features count has not changed.');
          return;
        }

        if (visibleFeatures.features.length > this.maxFeatures) {
          console.log('Too many visible features to render:', visibleFeatures.features.length);
          return;
        }

        this.previousVisibleFeaturesCount = visibleFeatures.features.length;

        console.log('Visible features:', visibleFeatures);

        try {
          if (viewer.dataSources.getByName('osm-data').length > 0) {
            viewer.dataSources.remove(viewer.dataSources.getByName('osm-data')[0]);
          }

          const geoJsonDataSource = new cesium.GeoJsonDataSource('osm-data');
          await geoJsonDataSource.load(visibleFeatures);
          viewer.dataSources.add(geoJsonDataSource);

          geoJsonDataSource.entities.values.forEach(entity => {
            if (entity) {
              try {
                const height = entity.properties['building:levels'] ? entity.properties['building:levels'].getValue() * 3 : 10;
                if (!isNaN(height)){
                //console.log("height", height);
                
                
                entity.polygon.material = cesium.Color.ORANGE.withAlpha(0.5);
                }
              } catch (error) {
                console.error('Error processing entity:', error, entity);
              }
            }
          });
        } catch (error) {
          console.error('Error processing GeoJSON data:', error);
        }

      } catch (error) {
        console.error('Error fetching OSM data:', error);
      }
    },
    drawRoute(route) {
      if (!route || !route.legs) {
        console.error('Invalid route data:', route);
        return;
      }

      const cesium = this.$cesium;
      const viewer = this.viewer;

      viewer.entities.removeAll();

      route.legs.forEach((leg) => {
        const coordinates = leg.geometry.coordinates.flat().filter(coord => !isNaN(coord));
        if (coordinates.length === 0) {
          console.error('Leg contains invalid coordinates:', leg);
          return;
        }

        const color = leg.weight_name === 'pedestrian' ? cesium.Color.GREEN : cesium.Color.BLUE;

        viewer.entities.add({
          polyline: {
            positions: cesium.Cartesian3.fromDegreesArray(coordinates),
            width: 5,
            material: color
          }
        });
      });

      const start = route.legs[0].geometry.coordinates[0];
      const end = route.legs[route.legs.length - 1].geometry.coordinates.slice(-1)[0];

      if (!isNaN(start[0]) && !isNaN(start[1])) {
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
      }

      if (!isNaN(end[0]) && !isNaN(end[1])) {
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
      }

      const validCoordinates = route.legs.flatMap((leg) =>
        leg.geometry.coordinates.filter((coord) => !isNaN(coord[0]) && !isNaN(coord[1])).map((coord) =>
          cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        )
      );

      if (validCoordinates.length > 0) {
        const boundingSphere = cesium.BoundingSphere.fromPoints(validCoordinates);
        viewer.camera.flyToBoundingSphere(boundingSphere, { duration: 0 });
      }
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
