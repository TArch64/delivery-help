FROM node:16.14-alpine as builder

WORKDIR /app


COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install --production

COPY ./frontend/. ./
COPY ./deployment/staging/frontend/.env /secrets/.env

RUN export $(cat /secrets/.env | xargs) && npm run build

FROM nginx:1.21.6-alpine
LABEL org.opencontainers.image.source https://github.com/TArch64/delivery-help

WORKDIR /app

COPY --from=builder /app/dist /app/
COPY ./deployment/staging/config.nginx /etc/nginx/conf.d/default.conf

CMD ["nginx"]
