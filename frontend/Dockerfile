FROM node

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

EXPOSE 3000

CMD [ "npm", "run", "dev" ]