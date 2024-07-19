export default {
  // 配置静态资源的目录
  dir: {
    static: 'static'
  },

  // 插件设置
  plugins: [
    '~/plugins/cesium.js'
  ],

  // Nuxt 模式配置
  mode: 'universal',

  // 页面头部设置
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
    'cesium/Build/Cesium/Widgets/widgets.css'
  ],

  // 加载指示器设置
  loading: { color: '#fff' },

  // Nuxt.js 模块
  modules: [],

  // 构建配置
  build: {
    // 你可以在这里扩展 webpack 配置
    extend(config, ctx) {}
  },

  compatibilityDate: '2024-07-19'
};