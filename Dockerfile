FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY site ./site
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
