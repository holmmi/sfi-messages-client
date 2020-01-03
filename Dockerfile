FROM node:current-alpine
WORKDIR /usr/src/app/
COPY package*.json ./
RUN npm install && npm install -g nodemon
COPY . ./
EXPOSE 80
CMD ["npm", "start"]