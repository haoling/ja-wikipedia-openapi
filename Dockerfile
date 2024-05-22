FROM node:22
ADD . /app
WORKDIR /app
RUN yarn install
RUN yarn build
CMD ["yarn", "start"]