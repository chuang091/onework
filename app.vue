<template>
  <div id="app">
    <button @click="togglePanel" class="toggle-button">切換面板</button>
    <div class="container">
      <div class="left" :class="{ expanded: isPanelVisible }">
        <Cesium />
      </div>
      <div class="right" :class="{ expanded: isPanelVisible }">
        <Mapbox ref="mapbox" />
      </div>
    </div>
    <SlidingPanel ref="slidingPanel" @toggle="handlePanelToggle" @route-found="handleRouteFound" @highlight-step="handleHighlightStep" @reset-highlight="handleResetHighlight" />
  </div>
</template>

<script>
import Cesium from './components/Cesium.vue';
import Mapbox from './components/Mapbox.vue';
import SlidingPanel from './components/SlidingPanel.vue';

export default {
  components: {
    Cesium,
    Mapbox,
    SlidingPanel
  },
  data() {
    return {
      isPanelVisible: false
    };
  },
  methods: {
    togglePanel() {
      this.$refs.slidingPanel.togglePanel();
    },
    handlePanelToggle(isVisible) {
      this.isPanelVisible = isVisible;
    },
    handleRouteFound(route) {
      this.$refs.mapbox.drawRoute(route);
    },
    handleHighlightStep(step) {
      this.$refs.mapbox.highlightStep(step);
    },
    handleResetHighlight() {
      this.$refs.mapbox.resetHighlight();
    }
  }
};
</script>

<style>
#app {
  position: relative;
}
.toggle-button {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1001;
}
.container {
  display: flex;
  width: 100%;
  height: 100vh;
}
.left,
.right {
  transition: width 0.3s ease;
}
.left {
  width: 50%;
  height: 100%;
}
.right {
  width: 50%;
  height: 100%;
}
.left.expanded,
.right.expanded {
  width: 35%;
}
</style>
