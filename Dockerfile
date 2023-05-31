FROM node:20.2-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .


# npm completely dies here for some reason, so I'm using yarn.
RUN yarn install

COPY . .

RUN yarn build
CMD yarn start:migrate