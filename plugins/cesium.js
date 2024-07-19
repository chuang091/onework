import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
Cesium.buildModuleUrl.setBaseUrl('cesium/');
export default defineNuxtPlugin(nuxtApp => {
  //Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0N2RhNmZiNC00MmMyLTQyNWItYWMyNS0yNzQ1MTA4OWIzMWIiLCJpZCI6MjI5MDk1LCJpYXQiOjE3MjEyNjg2NjB9.PWMmkVhqRAik0CZEngin9GWqmpu10tXxbx5aNz8zLR0';
  //Cesium.buildModuleUrl.setBaseUrl('_nuxt/static/cesium/');
  //Cesium.buildModuleUrl.setBaseUrl('_nuxt/node_modules/cesium/Build/Cesium');
  
  nuxtApp.provide('cesium', Cesium);
});
