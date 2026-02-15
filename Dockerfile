FROM node:20-alpine


WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]

# docker build -t piet_p1 . 