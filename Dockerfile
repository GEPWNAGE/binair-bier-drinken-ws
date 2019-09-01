FROM node:12.9-alpine

WORKDIR /usr/src/app
COPY . .
RUN yarn
CMD ["yarn", "start"]
