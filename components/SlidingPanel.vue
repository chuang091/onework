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
        <ul v-if="routeResult.legs && routeResult.legs.length > 0">
          <li v-for="(leg, index) in routeResult.legs" :key="index">
            <strong>{{ getLegDescription(index) }}: </strong>
            <ul>
                <li v-for="(step, stepIndex) in leg.legs[0].steps" :key="stepIndex" @mouseover="highlightStep(step)" @mouseout="resetHighlight" @click="zoomToStep(step)">
                {{ step.maneuver.instruction }}
                <span class="distance">距離：{{ (step.distance / 1000).toFixed(2) }} 公里</span>
                </li>
            </ul>
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
      youBikeStations: [],
      routeResult: null
    };
  },
  mounted() {
    this.initializeGeocoders();
    this.fetchYouBikeData();
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
    async fetchYouBikeData() {
      try {
        const response = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
        const data = await response.json();
        this.youBikeStations = data;
      } catch (error) {
        console.error('Error fetching YouBike data:', error);
      }
    },
    async handleSubmit() {
      try {
        const walkToBike = await this.getWalkingRoute(this.pointA, this.findNearestStation(this.pointA, 'rent'));
        const bikeRide = await this.getCyclingRoute(this.findNearestStation(this.pointA, 'rent'), this.findNearestStation(this.pointC, 'return'));
        const walkToEnd = await this.getWalkingRoute(this.findNearestStation(this.pointC, 'return'), this.pointC);

        this.routeResult = {
          distance: walkToBike.distance + bikeRide.distance + walkToEnd.distance,
          duration: walkToBike.duration + bikeRide.duration + walkToEnd.duration,
          legs: [walkToBike, bikeRide, walkToEnd]
        };

        this.$emit('route-found', this.routeResult);
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    },
    async getWalkingRoute(start, end) {
      const directionsServiceUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
      const response = await fetch(directionsServiceUrl);
      const data = await response.json();
      return data.routes[0];
    },
    async getCyclingRoute(start, end) {
      const directionsServiceUrl = `https://api.mapbox.com/directions/v5/mapbox/cycling/${start};${end}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
      const response = await fetch(directionsServiceUrl);
      const data = await response.json();
      return data.routes[0];
    },
    findNearestStation(point, type) {
      const [lon, lat] = point.split(',').map(parseFloat);
      let nearestStation = null;
      let minDistance = Infinity;

      this.youBikeStations.forEach(station => {
        const stationLon = parseFloat(station.longitude);
        const stationLat = parseFloat(station.latitude);
        const distance = Math.sqrt(Math.pow(lon - stationLon, 2) + Math.pow(lat - stationLat, 2));

        if (type === 'rent' && station.available_rent_bikes > 0 && distance < minDistance) {
          nearestStation = `${stationLon},${stationLat}`;
          minDistance = distance;
        }

        if (type === 'return' && station.available_return_bikes > 0 && distance < minDistance) {
          nearestStation = `${stationLon},${stationLat}`;
          minDistance = distance;
        }
      });

      return nearestStation;
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
    },
    getLegDescription(index) {
      switch (index) {
        case 0:
          return '徒步至最近可借 YouBike 站點';
        case 1:
          return '騎行至離終點最近可還 YouBike 站點';
        case 2:
          return '徒步至終點';
        default:
          return `第 ${index + 1} 段`;
      }
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
