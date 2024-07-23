export default {
  // 配置靜態資源的目錄
  dir: {
    static: 'static'
  },

  // 插件設置
  plugins: [
    '~/plugins/cesium.js',
    { src: '~/plugins/vuex.js', mode: 'client' }
  ],

  // Nuxt 模式配置
  ssr: false, // 使用無服務器端渲染模式

  // 頁面頭部設置
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // 全局 CSS
  css: [
    'cesium/Build/Cesium/Widgets/widgets.css',
    'mapbox-gl/dist/mapbox-gl.css'
  ],

  // 加載指示器設置
  loading: { color: '#fff' },

  // Nuxt.js 模塊
  modules: [],

  // 構建配置
  build: {
    // 你可以在這裡擴展 webpack 配置
    extend(config, ctx) {}
  },

  router: {
    base: '/onework/'
  },

  // Nuxt 兼容性日期
  compatibility: {
    date: '2024-07-21'
  },

  generate: {
    dir: 'dist'
  }
};
