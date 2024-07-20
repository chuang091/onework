import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      coordinates: {
        source: null,
        longitude: 121.5654,
        latitude: 25.0330,
        zoom: 12,
        pitch: 0,
        bearing: 0
      }
    };
  },
  mutations: {
    setCoordinates(state, payload) {
      console.log('setCoordinates', payload);
      state.coordinates = payload;
    }
  },
  actions: {
    updateCoordinatesFromMapbox({ commit, state }, coordinates) {
      console.log('updateCoordinatesFromMapbox', coordinates);
      if (
        state.coordinates.longitude !== coordinates.longitude ||
        state.coordinates.latitude !== coordinates.latitude ||
        state.coordinates.zoom !== coordinates.zoom ||
        state.coordinates.pitch !== coordinates.pitch ||
        state.coordinates.bearing !== coordinates.bearing
      ) {
        commit('setCoordinates', { source: 'mapbox', ...coordinates });
      }
    },
    updateCoordinatesFromCesium({ commit, state }, coordinates) {
      console.log('updateCoordinatesFromCesium', coordinates);
      if (
        state.coordinates.longitude !== coordinates.longitude ||
        state.coordinates.latitude !== coordinates.latitude ||
        state.coordinates.zoom !== coordinates.zoom ||
        state.coordinates.pitch !== coordinates.pitch ||
        state.coordinates.bearing !== coordinates.bearing
      ) {
        commit('setCoordinates', { source: 'cesium', ...coordinates });
      }
    }
  }
});

export default store;
