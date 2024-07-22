<template>
  <div id="cesiumContainer"></div>
</template>

<script>
export default {
  data() {
    return {
      previousVisibleFeaturesCount: 0,
      previousBounds: { west: 0, south: 0, east: 0, north: 0 },
      boundsChangeThreshold: 0.0000, // 设置一个阈值
      maxFeatures: 5000, // 设置最大特征数量
      batchTimeout: 100 // 批量加载特征的延迟
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

        // 确保经纬度值不为 NaN
        if (isNaN(topLeftCartographic.longitude) || isNaN(topRightCartographic.longitude) ||
            isNaN(bottomLeftCartographic.longitude) || isNaN(bottomRightCartographic.longitude) ||
            isNaN(topLeftCartographic.latitude) || isNaN(topRightCartographic.latitude) ||
            isNaN(bottomLeftCartographic.latitude) || isNaN(bottomRightCartographic.latitude)) {
          throw new Error('Computed cartographic values have NaN components');
        }

        const bounds = {
          west: Math.min(topLeftCartographic.longitude, bottomLeftCartographic.longitude),
          south: Math.min(bottomLeftCartographic.latitude, bottomRightCartographic.latitude),
          east: Math.max(topRightCartographic.longitude, bottomRightCartographic.longitude),
          north: Math.max(topLeftCartographic.latitude, topRightCartographic.latitude)
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

        if (viewer.dataSources.getByName('osm-data').length > 0) {
          viewer.dataSources.remove(viewer.dataSources.getByName('osm-data')[0]);
        }

        const geoJsonDataSource = new cesium.GeoJsonDataSource('osm-data');
        await geoJsonDataSource.load(visibleFeatures);
        viewer.dataSources.add(geoJsonDataSource);

        geoJsonDataSource.entities.values.forEach(entity => {
          if (entity.polygon) {
            try {
              const height = entity.properties['building:levels'] ? entity.properties['building:levels'].getValue() * 3 : 10;
              entity.polygon.extrudedHeight = isNaN(height) ? 0 : height; // 如果高度为 NaN，则设置为 0
              entity.polygon.material = cesium.Color.ORANGE.withAlpha(0.5);
              //console.log('Processed entity:', entity);
            } catch (error) {
              console.error('Error processing entity:', error, entity);
            }
          }
        });

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
