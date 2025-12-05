# ソースをビルドするためのパッケージ(TS→JS)
FROM node:24-bullseye-slim AS build
WORKDIR /app
COPY app ./
# ビルド実行
ARG MODE_ENV=PC
ENV MODE_ENV=${MODE_ENV}
RUN yarn install
RUN yarn build:${MODE_ENV}

# server.jsを起動するためのパッケージ
FROM node:24-bullseye-slim
WORKDIR /app
RUN npm install express@4.21.0 http-proxy-middleware@3.0.0
COPY --from=build /app/dist ./dist
COPY app/server.js ./
EXPOSE 80
# バックエンドのプロキシ先.
ENV PROXY_URL='http://localhost:3000'
CMD ["node", "server.js"]