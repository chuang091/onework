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
      profile: 'mapbox/cycling', // or 'mapbox/cycling', 'mapbox/walking'
      interactive: false
    });

    map.addControl(directions, 'top-left');

    // 設置初始路徑，包含三個點：A（台北）、B（中間點）、C（NCCU）
    directions.setOrigin([121.5654, 25.0330]); // A 台北
    directions.addWaypoint(0, [121.5524, 25.0214]); // B 中間點，例如：大安森林公園
    directions.setDestination([121.5774304, 24.9878632]); // C NCCU

    // Function to fetch YouBike data and add markers to the map
    const fetchYouBikeData = async () => {
      try {
        const response = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
        const data = await response.json();
        data.forEach(station => {
          const lon = parseFloat(station.longitude);
          const lat = parseFloat(station.latitude);
          if (isNaN(lon) || isNaN(lat)) {
            console.warn(`Invalid coordinates for station: ${station.sna}`);
            return;
          }
          const marker = new mapboxgl.Marker()
            .setLngLat([lon, lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(`<h3>${station.sna}</h3><p>可借：${station.available_rent_bikes} / 可還：${station.available_return_bikes}</p>`))
            .addTo(map);
        });
      } catch (error) {
        console.error('Error fetching YouBike data:', error);
      }
    };

    fetchYouBikeData();

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
      }, 1000); // 500 毫秒的延遲
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
