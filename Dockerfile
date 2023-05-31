FROM node:18-alpine

WORKDIR /app

COPY package.json .

# npm completely dies here for some reason, so I'm using yarn.
RUN npm install

COPY . .

RUN npm run build:generate
CMD npm run start:migrate