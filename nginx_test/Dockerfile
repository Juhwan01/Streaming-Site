# Node.js 이미지 기반
FROM node:14

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# ffmpeg 설치
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# package.json 및 package-lock.json 복사 후 npm install
COPY package.json package-lock.json ./
RUN npm install --only=production

# 나머지 애플리케이션 소스 복사
COPY . .

# 포트 노출
EXPOSE 1935 8000 3001

# 컨테이너 실행 시 시작할 명령어
CMD ["node", "server.js"]
