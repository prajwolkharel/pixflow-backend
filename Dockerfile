FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build && ls -la dist || dir dist
CMD ["node", "dist/server.js"]