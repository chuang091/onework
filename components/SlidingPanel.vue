<template>
  <transition name="slide">
    <div v-if="isVisible" class="sliding-panel">
      <h2>路徑規劃</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="pointA">起點 (Point A)</label>
          <div id="geocoderA" class="geocoder-container"></div>
        </div>
        <div class="form-group">
          <label for="pointC">終點 (Point C)</label>
          <div id="geocoderC" class="geocoder-container"></div>
        </div>
        <button type="submit">提交</button>
      </form>
      <div class="results" v-if="routeResult">
        <h3>路徑結果</h3>
        <ul v-if="routeResult.legs && routeResult.legs.length > 0 && routeResult.legs[0].steps && routeResult.legs[0].steps.length > 0">
          <li v-for="(step, index) in routeResult.legs[0].steps" :key="index" @mouseover="highlightStep(step)" @mouseout="resetHighlight" @click="zoomToStep(step)">
            <strong>{{ index + 1 }}. </strong>{{ step.maneuver.instruction }}
            <span class="distance">距離：{{ (step.distance / 1000).toFixed(2) }} 公里</span>
          </li>
        </ul>
        <h3>總距離: {{ (routeResult.distance / 1000).toFixed(2) }} 公里</h3>
        <h3>總時間: {{ (routeResult.duration / 60).toFixed(2) }} 分鐘</h3>
      </div>
    </div>
  </transition>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      isVisible: false,
      pointA: '',
      pointC: '',
      routeResult: null
    };
  },
  mounted() {
    this.initializeGeocoders();
  },
  methods: {
    ...mapActions(['updateZoomToStep']),
    initializeGeocoders() {
      this.$nextTick(() => {
        const geocoderA = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          placeholder: '輸入起點',
          mapboxgl: mapboxgl
        });
        const geocoderC = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          placeholder: '輸入終點',
          mapboxgl: mapboxgl
        });

        geocoderA.on('result', (e) => {
          this.pointA = `${e.result.center[0]},${e.result.center[1]}`;
        });

        geocoderC.on('result', (e) => {
          this.pointC = `${e.result.center[0]},${e.result.center[1]}`;
        });

        this.$nextTick(() => {
          const geocoderAContainer = document.getElementById('geocoderA');
          const geocoderCContainer = document.getElementById('geocoderC');

          if (geocoderAContainer && geocoderCContainer) {
            geocoderA.addTo(geocoderAContainer);
            geocoderC.addTo(geocoderCContainer);
          }
        });
      });
    },
    async handleSubmit() {
      try {
        const directionsServiceUrl = `https://api.mapbox.com/directions/v5/mapbox/cycling/${this.pointA};${this.pointC}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
        const response = await fetch(directionsServiceUrl);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          this.routeResult = data.routes[0];
          this.$emit('route-found', data.routes[0]);
        } else {
          console.error('No routes found');
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    },
    togglePanel() {
      this.isVisible = !this.isVisible;
      if (this.isVisible) {
        this.initializeGeocoders();
      }
      this.$emit('toggle', this.isVisible);
    },
    highlightStep(step) {
      this.$emit('highlight-step', step);
    },
    resetHighlight() {
      this.$emit('reset-highlight');
    },
    zoomToStep(step) {
      this.updateZoomToStep(step);
    }
  }
};
</script>

<style>
.sliding-panel {
  width: 30%;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  background: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
  padding: 20px;
  z-index: 1000;
  overflow-y: auto;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter,
.slide-leave-to {
  transform: translateX(100%);
}
.form-group {
  margin-bottom: 20px;
}
.geocoder-container {
  width: 100%;
  margin-top: 5px;
}
.results {
  margin-top: 20px;
}
.results ul {
  list-style: none;
  padding: 0;
}
.results li {
  padding: 10px;
  cursor: pointer;
}
.results li:hover {
  background-color: #f0f0f0;
}
.distance {
  display: block;
  font-size: 0.8em;
  color: #555;
}
</style>
