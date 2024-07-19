# 使用官方的 Node.js 鏡像作為基礎鏡像
FROM node:14

# 設置工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有文件到工作目錄
COPY . .

# 暴露應用埠
EXPOSE 3000


# 構建 Nuxt 應用
RUN npm run build

# 啟動應用
CMD [ "npm", "start" ]
