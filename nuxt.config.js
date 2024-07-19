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

  compatibilityDate: '2024-07-18'
});
