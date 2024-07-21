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
      routeLayer: null,
      highlightedLayer: null
    };
  },
  computed: {
    ...mapState(['zoomToStep'])
  },
  watch: {
    zoomToStep(newStep) {
      if (newStep) {
        this.zoomToStepMethod(newStep);
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
      pitch: 0,
      bearing: 0
    });

    let isUpdatingFromMapbox = false;
    let isUpdatingFromCesium = false;
    let moveTimeout = null;

    this.map.on('moveend', () => {
      this.loadVisibleYouBikeStations();
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

    this.loadVisibleYouBikeStations();
  },
  methods: {
    async loadVisibleYouBikeStations() {
      const bounds = this.map.getBounds();
      try {
        const response = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
        const data = await response.json();
        
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        data.forEach(station => {
          const lon = parseFloat(station.longitude);
          const lat = parseFloat(station.latitude);
          if (isNaN(lon) || isNaN(lat)) {
            console.warn(`Invalid coordinates for station: ${station.sna}`);
            return;
          }

          if (bounds.contains([lon, lat])) {
            const marker = new mapboxgl.Marker()
              .setLngLat([lon, lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${station.sna}</h3><p>可借：${station.available_rent_bikes} / 可還：${station.available_return_bikes}</p>`))
              .addTo(this.map);

            this.markers.push(marker);
          }
        });
      } catch (error) {
        console.error('Error fetching YouBike data:', error);
      }
    },
    drawRoute(route) {
      if (this.routeLayer) {
        if (this.map.getLayer('route')) {
          this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
          this.map.removeSource('route');
        }
      }

      this.map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry
        }
      });

      this.routeLayer = this.map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });

      const bounds = new mapboxgl.LngLatBounds();
      route.geometry.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
      this.map.fitBounds(bounds, { padding: 50 });

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
