import mapboxgl from 'mapbox-gl';

export default defineNuxtPlugin(nuxtApp => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1YW5nMDkxMSIsImEiOiJjbHlxcWgydTUwaTluMmpwbWVybTJ3M3hyIn0.NrsijaI9kUByawxKd_FERA';
  nuxtApp.provide('mapbox', mapboxgl);
});
