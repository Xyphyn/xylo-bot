FROM node:20.2-alpine

WORKDIR /app

COPY package.json ./
COPY . .

# npm completely dies here for some reason, so I'm using yarn.
RUN yarn install

RUN yarn build
CMD yarn start:migrate