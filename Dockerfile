FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY jest.config.js ./
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npm run build
# Default CMD for running app with debugging
CMD ["nodemon", "--exec", "node", "--inspect=0.0.0.0:9229", "dist/server.js"]