# FROM node:16

# WORKDIR /app

# COPY package.json package-lock.json ./
# RUN npm install

# COPY . .

# RUN npm run build

# # 프로덕션 환경을 위한 nginx 설정
# FROM nginx:alpine
# COPY --from=0 /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]