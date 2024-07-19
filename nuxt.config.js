export default defineNuxtConfig({
  ssr: true,
  target: 'static',
  head: {
    title: '我的 Nuxt 应用',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '这是一個Nuxt應用程序' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  plugins: [
    '~/plugins/cesium.js',
    '~/plugins/mapbox.js'
  ],

  buildModules: [],

  modules: [],
  nitro: {
    publicAssets: [ {
      //Nuxt will copy the files here and serve them publicly
      baseURL: '_nuxt/Cesium/Assets',
      dir: '../node_modules/cesium/Build/Cesium/Assets'
    },
    {
      baseURL: '_nuxt/Cesium/Workers',
      dir: '../node_modules/cesium/Build/Cesium/Workers'
    },
    {
      baseURL: '_nuxt/Cesium/ThirdParty',
      dir: '../node_modules/cesium/Build/Cesium/ThirdParty'
    },
    {
      baseURL: '_nuxt/Cesium/Widgets',
      dir: '../node_modules/cesium/Build/Cesium/Widgets'
    },
  ]},

  compatibilityDate: '2024-07-18'
});
