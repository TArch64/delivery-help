FROM node:16.14-alpine as builder

WORKDIR /app


COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install --production

COPY ./frontend/. ./
COPY ./deployment/staging/frontend/.env /secrets/.env

RUN export $(cat /secrets/.env | xargs) && npm run build

FROM node:16.14-alpine
LABEL org.opencontainers.image.source https://github.com/TArch64/delivery-help

WORKDIR /app

COPY --from=builder /app /app/

CMD ["npm", "run", "start"]
