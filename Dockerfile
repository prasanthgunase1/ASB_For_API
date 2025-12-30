FROM repo-manager-docker.devsecops.associatedbankservices.com/node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]