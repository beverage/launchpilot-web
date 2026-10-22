# Aiven Runtime build: TanStack Start compiled for Node (Lovable's own publish targets Cloudflare).
# VITE_API_URL is read at build time from the committed .env.
FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g bun@1
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN NITRO_PRESET=node-server npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV HOST=0.0.0.0 PORT=8080 NODE_ENV=production
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
