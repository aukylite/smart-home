FROM denoland/deno:alpine

EXPOSE 7777

WORKDIR /app

COPY deps.js .

RUN deno cache deps.js

COPY . .

CMD [ "run", "--unstable-kv", "--watch", "--allow-net", "--allow-read", "--allow-env", "app.js" ]