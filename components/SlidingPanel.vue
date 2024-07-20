<template>
    <transition name="slide">
      <div v-if="isVisible" class="sliding-panel">
        <h2>路徑規劃</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="pointA">起點 (Point A)</label>
            <input type="text" id="pointA" v-model="pointA" placeholder="例如：台北101" />
          </div>
          <div class="form-group">
            <label for="pointC">終點 (Point C)</label>
            <input type="text" id="pointC" v-model="pointC" placeholder="例如：台大醫院" />
          </div>
          <button type="submit">提交</button>
        </form>
        <div class="results" v-if="routeResult">
          <h3>路徑結果</h3>
          <pre>{{ routeResult }}</pre>
        </div>
      </div>
    </transition>
  </template>
  
  <script>
  import mapboxgl from 'mapbox-gl';
  
  export default {
    data() {
      return {
        isVisible: false,
        pointA: '',
        pointC: '',
        routeResult: null
      };
    },
    methods: {
      async handleSubmit() {
        try {
          const directionsServiceUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.pointA};${this.pointC}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
          const response = await fetch(directionsServiceUrl);
          const data = await response.json();
          this.routeResult = data.routes[0];
          this.$emit('route-found', data.routes[0]);
        } catch (error) {
          console.error('Error fetching directions:', error);
        }
      },
      togglePanel() {
        this.isVisible = !this.isVisible;
        this.$emit('toggle', this.isVisible);
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
  .results {
    margin-top: 20px;
  }
  </style>
  