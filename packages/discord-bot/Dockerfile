FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/discord-bot/package.json packages/discord-bot/package.json

RUN npm install

COPY packages/core packages/core
COPY packages/discord-bot packages/discord-bot

RUN npm run build --workspace @rollz/core
RUN npm run build --workspace @rollz/discord-bot

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/discord-bot/package.json packages/discord-bot/package.json
RUN npm install --omit=dev

COPY --from=builder /app/packages/core/dist packages/core/dist
COPY --from=builder /app/packages/discord-bot/dist packages/discord-bot/dist

VOLUME ["/data"]

CMD ["npm", "run", "start", "--workspace", "@rollz/discord-bot"]