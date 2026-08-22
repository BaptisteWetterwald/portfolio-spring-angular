FROM node:24.19.0-alpine AS node-build-base

RUN npm install -g npm@11.6.2

FROM node-build-base AS dependencies

WORKDIR /workspace

ENV npm_config_audit=false
ENV npm_config_fund=false

COPY package.json package-lock.json ./
RUN npm ci

FROM node-build-base AS build

WORKDIR /workspace

ENV npm_config_audit=false
ENV npm_config_fund=false

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24.19.0-alpine AS runtime

RUN addgroup -S angular && adduser -S angular -G angular

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build --chown=angular:angular /workspace/dist/frontend ./dist/frontend

EXPOSE 4000

USER angular

CMD ["node", "dist/frontend/server/server.mjs"]
