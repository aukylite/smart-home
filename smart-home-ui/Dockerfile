FROM node:22.9.0

EXPOSE 3000

WORKDIR /app

RUN npm install -g pnpm

ENV PATH /app/node_modules/.bin:$PATH

RUN pnpm install @rollup/rollup-linux-arm64-gnu

COPY package.json pnpm-lock.yaml ./

COPY node_modules/ ./node_modules/

COPY . .

CMD [ "pnpm", "astro", "dev" ]
