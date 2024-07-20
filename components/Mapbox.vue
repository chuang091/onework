<template>
  <div id="mapboxContainer"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
export default {
  mounted() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1YW5nMDkxMSIsImEiOiJjbHlxcWgydTUwaTluMmpwbWVybTJ3M3hyIn0.NrsijaI9kUByawxKd_FERA';
    const map = new mapboxgl.Map({
      container: 'mapboxContainer',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5654, 25.0330], // 台北的經緯度
      zoom: 12, // 初始縮放級別
      pitch: 0, // 初始視角的傾斜度
      bearing: 0 // 初始方向角
    });

    let isUpdatingFromMapbox = false;
    let isUpdatingFromCesium = false;
    let moveTimeout = null;

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving', // or 'mapbox/cycling', 'mapbox/walking'
      interactive: false
    });

    map.addControl(directions, 'top-left');

    // 設置一個初始路徑
    directions.setOrigin([121.5654, 25.0330]); // 台北
    directions.setDestination([121.4737, 31.2304]); // 上海

    map.on('move', () => {
      if (isUpdatingFromCesium) return;
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isUpdatingFromMapbox = true;
        const center = map.getCenter();
        const newCoordinates = {
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing()
        };
        console.log('Mapbox move end', newCoordinates);
        this.$store.dispatch('updateCoordinatesFromMapbox', newCoordinates);
        isUpdatingFromMapbox = false;
      }, 5); // 5 毫秒的延遲
    });

    this.$store.watch(
      state => state.coordinates,
      coordinates => {
        if (coordinates.source === 'mapbox' || isUpdatingFromMapbox) return;
        isUpdatingFromCesium = true;
        console.log('Mapbox store watch', coordinates);
        map.flyTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: coordinates.zoom,
          pitch: coordinates.pitch,
          bearing: coordinates.bearing,
          essential: true // 確保動畫在同步時使用
        });
        isUpdatingFromCesium = false;
      },
      { immediate: true }
    );
  }
};
</script>

<style>


#mapboxContainer {
  width: 100%;
  height: 100vh;
}
</style>
