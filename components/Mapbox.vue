<template>
  <div id="mapboxContainer"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      map: null,
      markers: [],
      routeLayers: [],
      highlightedLayer: null,
      startMarker: null,
      endMarker: null,
      youBikeMarkers: [],
      osmLayer: null,
      previousVisibleFeaturesCount: 0,
      previousBounds: null
    };
  },
  computed: {
    ...mapState(['zoomToStep', 'route'])
  },
  watch: {
    zoomToStep(newStep) {
      if (newStep) {
        this.zoomToStepMethod(newStep);
      }
    },
    route(newRoute) {
      if (newRoute) {
        this.drawRoute(newRoute);
      }
    }
  },
  mounted() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1YW5nMDkxMSIsImEiOiJjbHlxcWgydTUwaTluMmpwbWVybTJ3M3hyIn0.NrsijaI9kUByawxKd_FERA';
    this.map = new mapboxgl.Map({
      container: 'mapboxContainer',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5654, 25.0330],
      zoom: 16,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    this.map.on('load', () => {
      

      this.loadVisibleYouBikeStations();
      this.loadVisibleOSMData();
    });

    let isUpdatingFromMapbox = false;
    let isUpdatingFromCesium = false;
    let moveTimeout = null;

    this.map.on('moveend', () => {
      this.loadVisibleYouBikeStations();
      this.loadVisibleOSMData();
    });

    this.map.on('move', () => {
      if (isUpdatingFromCesium) return;
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isUpdatingFromMapbox = true;
        const center = this.map.getCenter();
        const newCoordinates = {
          longitude: center.lng,
          latitude: center.lat,
          zoom: this.map.getZoom(),
          pitch: this.map.getPitch(),
          bearing: this.map.getBearing()
        };
        console.log('Mapbox move end', newCoordinates);
        this.$store.dispatch('updateCoordinatesFromMapbox', newCoordinates);
        setTimeout(() => {
          isUpdatingFromMapbox = false;
        }, 1000);
      }, 500);
    });

    this.$store.watch(
      state => state.coordinates,
      coordinates => {
        if (coordinates.source === 'mapbox' || isUpdatingFromMapbox) return;
        isUpdatingFromCesium = true;
        console.log('Mapbox store watch', coordinates);
        this.map.flyTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: coordinates.zoom,
          pitch: coordinates.pitch,
          bearing: coordinates.bearing,
          essential: true
        });
        setTimeout(() => {
          isUpdatingFromCesium = false;
        }, 1000);
      },
      { immediate: true }
    );
  },
  methods: {
    async loadVisibleYouBikeStations() {
      const bounds = this.map.getBounds();
      try {
        const response = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
        const data = await response.json();
        
        this.youBikeMarkers.forEach(marker => marker.remove());
        this.youBikeMarkers = [];

        data.forEach(station => {
          const lon = parseFloat(station.longitude);
          const lat = parseFloat(station.latitude);
          if (isNaN(lon) || isNaN(lat)) {
            console.warn(`Invalid coordinates for station: ${station.sna}`);
            return;
          }

          if (bounds.contains([lon, lat])) {
            const marker = new mapboxgl.Marker({ color: 'lightblue' })
              .setLngLat([lon, lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${station.sna}</h3><p>可借：${station.available_rent_bikes} / 可還：${station.available_return_bikes}</p>`))
              .addTo(this.map);

            this.youBikeMarkers.push(marker);
          }
        });
      } catch (error) {
        console.error('Error fetching YouBike data:', error);
      }
    },
    async loadVisibleOSMData() {
      const bounds = this.map.getBounds();
      try {
        const response = await fetch('/osm-data.geojson'); // 使用相对路径从 static 文件夹加载资源
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (this.map.getLayer('osm-data')) {
          this.map.removeLayer('osm-data');
        }
        if (this.map.getSource('osm-data')) {
          this.map.removeSource('osm-data');
        }

        const visibleFeatures = {
          type: 'FeatureCollection',
          features: data.features.filter(feature => {
            if (feature.geometry.type === 'Polygon') {
              return feature.geometry.coordinates.some(polygon => 
                polygon.some(coord => 
                  !isNaN(coord[0]) && 
                  !isNaN(coord[1]) && 
                  bounds.contains(coord)
                )
              );
            }
            return false;
          })
        };

        if (visibleFeatures.features.length > 5000) {
          console.log('Too many visible features to render:', visibleFeatures.features.length);
          return;
        }

        if (visibleFeatures.features.length === this.previousVisibleFeaturesCount && this.boundsAreEqual(this.previousBounds, bounds)) {
          console.log('Visible features count has not changed.');
          return;
        }

        this.previousVisibleFeaturesCount = visibleFeatures.features.length;
        this.previousBounds = bounds;

        console.log('Visible features:', visibleFeatures);

        this.map.addSource('osm-data', {
          type: 'geojson',
          data: visibleFeatures
        });

        if (this.map.getLayer('buildings')) {
          this.map.removeLayer('buildings');
        }
        if (this.map.getLayer('buildings')) {
          this.map.removeLayer('buildings');
        }
        if (this.map.getSource('buildings')) {
          this.map.removeSource('buildings');
        }

        this.map.addLayer({
        id: 'buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['coalesce', ['get', 'height'], 20],
          'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
          'fill-extrusion-opacity': 0.6
        }
      });
      } catch (error) {
        console.error('Error fetching OSM data:', error);
      }
    },
    boundsAreEqual(bounds1, bounds2) {
      return bounds1.getWest() === bounds2.getWest() &&
             bounds1.getSouth() === bounds2.getSouth() &&
             bounds1.getEast() === bounds2.getEast() &&
             bounds1.getNorth() === bounds2.getNorth();
    },
    drawRoute(route) {
      if (!route || !route.legs) {
        console.error('Invalid route data:', route);
        return;
      }

      this.routeLayers.forEach(layer => {
        if (this.map.getLayer(layer)) {
          this.map.removeLayer(layer);
        }
        if (this.map.getSource(layer)) {
          this.map.removeSource(layer);
        }
      });
      this.routeLayers = [];

      route.legs.forEach((leg, index) => {
        const layerId = `route-leg-${index}`;
        const color = leg.weight_name === 'pedestrian' ? '#00ff00' : '#3887be';
        this.map.addSource(layerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: leg.geometry
          }
        });

        this.map.addLayer({
          id: layerId,
          type: 'line',
          source: layerId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 5,
            'line-opacity': 0.75
          }
        });

        this.routeLayers.push(layerId);
      });

      const bounds = new mapboxgl.LngLatBounds();
      route.legs.forEach(leg => {
        leg.geometry.coordinates.forEach(coord => {
          bounds.extend(coord);
        });
      });
      this.map.fitBounds(bounds, { padding: 50 });

      const start = route.legs[0].geometry.coordinates[0];
      const end = route.legs[route.legs.length - 1].geometry.coordinates.slice(-1)[0];

      if (this.startMarker) this.startMarker.remove();
      this.startMarker = new mapboxgl.Marker({ color: 'green' })
        .setLngLat(start)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>起點</h3>'))
        .addTo(this.map);

      if (this.endMarker) this.endMarker.remove();
      this.endMarker = new mapboxgl.Marker({ color: 'red' })
        .setLngLat(end)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>終點</h3>'))
        .addTo(this.map);

      this.map.on('mouseenter', 'route', (e) => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'route', () => {
        this.map.getCanvas().style.cursor = '';
      });

      this.map.on('click', 'route', (e) => {
        const coordinates = e.features[0].geometry.coordinates;
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => {
          bounds.extend(coord);
        });
        this.map.fitBounds(bounds, {
          padding: 50
        });
      });
    },
    highlightStep(step) {
      if (this.highlightedLayer) {
        if (this.map.getLayer('highlighted-step')) {
          this.map.removeLayer('highlighted-step');
        }
        if (this.map.getSource('highlighted-step')) {
          this.map.removeSource('highlighted-step');
        }
      }

      if (!step || !step.geometry || !step.geometry.coordinates) {
        console.error('Invalid step data:', step);
        return;
      }

      this.map.addSource('highlighted-step', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: step.geometry
        }
      });

      this.highlightedLayer = this.map.addLayer({
        id: 'highlighted-step',
        type: 'line',
        source: 'highlighted-step',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    },
    resetHighlight() {
      if (this.highlightedLayer) {
        if (this.map.getLayer('highlighted-step')) {
          this.map.removeLayer('highlighted-step');
        }
        if (this.map.getSource('highlighted-step')) {
          this.map.removeSource('highlighted-step');
        }
      }
    },
    zoomToStepMethod(step) {
      if (!step || !step.geometry || !step.geometry.coordinates) {
        console.error('Invalid step data:', step);
        return;
      }

      const bounds = new mapboxgl.LngLatBounds();
      step.geometry.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }
};
</script>

<style>
#mapboxContainer {
  width: 100%;
  height: 100vh;
}
</style>
