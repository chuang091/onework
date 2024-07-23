# Cesium and Mapbox with Nuxt

## Introduction

This is a map application based on Mapbox and Cesium, offering features like route planning, step zoom-in view, dual-view, and OSM data chunk loading.

## Features

1. **Route Planning (Walk-Bike-Walk)**: Provides mixed route planning with walking, biking, and walking segments.
2. **Zoom-in Step**: Allows users to zoom in to view the details of specific steps.
3. **Dual-view**: Supports dual view display with Mapbox and Cesium.
4. **Load Visible OSM Data**: Loads only the OSM data within the current view to enhance performance.
5. **Search Bar with Geocoder**: Supports search functionality with geocoding to locate addresses and points of interest.

## Demo

### Dual View
![Dual View Demo](dualview.gif)

### Hover and Zoom-in on Steps
![Hover and Zoom-in Demo](hoverandzoomin.gif)

### Geocoder Search
![Geocoder Search Demo](geocoder.gif)

### YouBike Station Popup
![YouBike Station Popup Demo](youbikepopup.gif)

## Deployment

1. **Docker Deployment**:
    ```bash
    # Build Docker image
    docker build -t map-app .
    
    # Run Docker container
    docker run -p 3000:3000 map-app
    ```
2. **Local Deployment**:
    ```bash
    # Install dependencies
    npm install
    
    # Start development server
    npm run dev
    ```

## Known Bugs

1. **OSM Data Loading**: Rendering may crash when there are too many features within the view.
2. **Route Planning**: Route planning results may be inaccurate in some cases.
3. **Dual-view Synchronization**: There might be delays in synchronizing the views between Mapbox and Cesium.
4. **Walk-Bike Suggestion**: If the walking distance is short enough to be faster than biking, the system might still suggest renting a bike.
