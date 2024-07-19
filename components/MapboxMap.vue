<template>
    <div ref="mapContainer" class="map-container"></div>
  </template>
  
  <script>
  export default {
    mounted() {
      this.initMapbox();
    },
    methods: {
      initMapbox() {
        const mapboxgl = this.$mapbox;
        if (mapboxgl) {
          try {
            const map = new mapboxgl.Map({
              container: this.$refs.mapContainer,
              style: 'mapbox://styles/mapbox/streets-v11',
              center: [0, 0],
              zoom: 2,
            });
          } catch (error) {
            console.error('Error initializing Mapbox:', error);
          }
        } else {
          console.error('MapboxGL is not available');
        }
      },
    },
  };
  </script>
  
  <style>
  .map-container {
    width: 100%;
    height: 100vh;
  }
  </style>
  