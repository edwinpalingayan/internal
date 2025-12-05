FROM    node:22.14-bullseye-slim AS build
WORKDIR /app
COPY    app/package.json app/yarn.lock app/tsconfig.json ./
RUN     yarn install
COPY    app/src ./src
RUN     yarn build

FROM    node:22.14-bullseye-slim
WORKDIR /app
COPY    --from=build /app/dist ./dist
COPY    --from=build /app/node_modules ./node_modules
COPY    app/src/.env ./
ARG     MODE_ENV
ENV     ENV=${MODE_ENV}
CMD ["node", "dist/index.js"]
