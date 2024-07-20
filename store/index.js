import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      coordinates: {
        longitude: 121.5654,
        latitude: 25.0330,
        zoom: 12,
        pitch: -45,
        bearing: 0
      }
    };
  },
  mutations: {
    setCoordinates(state, coordinates) {
      console.log('setCoordinates', coordinates);
      state.coordinates = coordinates;
    }
  },
  actions: {
    updateCoordinates({ commit, state }, coordinates) {
      console.log('updateCoordinates', coordinates);
      if (
        state.coordinates.longitude !== coordinates.longitude ||
        state.coordinates.latitude !== coordinates.latitude ||
        state.coordinates.zoom !== coordinates.zoom ||
        state.coordinates.pitch !== coordinates.pitch ||
        state.coordinates.bearing !== coordinates.bearing
      ) {
        commit('setCoordinates', coordinates);
      }
    }
  }
});

export default store;
