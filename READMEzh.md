# Cesium and Mapbox with Nuxt

[![Change Language](https://img.shields.io/badge/Language-English-blue)](README.md)

## 介紹

這是一個基於 Mapbox 和 Cesium 的地圖應用程式，提供路徑規劃、步驟放大視圖、雙視圖顯示和 OSM 資料區塊加載等功能。

## 功能特點

1. **路徑規劃 (步行-騎車-步行)**: 提供混合路徑規劃，包括步行、騎車和步行段落。
2. **步驟放大**: 允許使用者放大查看特定步驟的詳細資訊。
3. **雙視圖顯示**: 支援 Mapbox 和 Cesium 的雙視圖顯示。
4. **加載區塊 OSM 資料**: 僅加載當前視圖內的 OSM 資料以提升性能。
5. **搜尋欄位支援 Geocoder**: 支援地址和興趣點的搜尋功能。

## 示範

### 雙視圖
![雙視圖示範](dualview.gif)

### 步驟懸停和放大
![步驟懸停和放大示範](hoverandzoomin.gif)

### Geocoder 搜尋
![Geocoder 搜尋示範](geocoder.gif)

### YouBike 站點彈出視窗
![YouBike 站點彈出視窗示範](youbikepopup.gif)

## 部署

1. **Docker 部署**:
    ```bash
    # 建立 Docker 映像檔
    docker build -t map-app .
    
    # 執行 Docker 容器
    docker run -p 3000:3000 map-app
    ```
2. **本地部署**:
    ```bash
    # 安裝依賴
    npm install
    
    # 啟動開發伺服器
    npm run dev
    ```

## 已知問題

1. **OSM 資料加載**: 當視圖內的特徵過多時，渲染可能會崩潰。
2. **路徑規劃**: 在某些情況下，路徑規劃結果可能不準確。
3. **雙視圖同步**: Mapbox 和 Cesium 之間的視圖同步可能會有延遲。
4. **步行-騎車建議**: 如果步行距離足夠短，比騎車更快，系統可能仍會建議租借 YouBike。
