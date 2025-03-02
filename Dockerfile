FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY jest.config.js ./
RUN npx prisma generate
RUN npm run build
CMD ["npx", "nodemon", "--exec", "node", "--inspect=0.0.0.0:9229", "dist/server.js"]