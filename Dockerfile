FROM node:18-alpine

WORKDIR /app
ADD . /app
RUN yarn install --frozen-lockfile

RUN yarn global add pm2

CMD ["pm2-runtime", "main.js"]