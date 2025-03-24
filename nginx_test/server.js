const express = require("express");
const NodeMediaServer = require("node-media-server");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

let version = "1.0.0"; // 고정 버전 설정
global.version = version;
console.log(`Server Version: ${version}`);

// ffmpeg 버전 전역 설정
global.ffmpeg_version = "4.0"; // 임의의 ffmpeg 버전 설정

const VALID_STREAM_KEYS = new Set(["stream-key-1", "stream-key-2", "test-key"]);
const activeStreams = new Map();

// Docker 컨테이너 내부에서 일반적인 ffmpeg 경로
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    allow_origin: "*",
  },
  trans: {
    ffmpeg: "/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        hlsKeep: true, // true로 변경하여 HLS 파일 유지
        dash: true,
        dashFlags: "[f=dash:window_size=3:extra_window_size=5]",
        dashKeep: true, // true로 변경하여 DASH 파일 유지
        rtmp: true,
        rtmpApp: "live_rtmp",
      },
    ],
  },
  auth: {
    api: true,
    api_user: "admin",
    api_pass: "admin123",
  },
  fission: false, // 멀티 프로세스 비활성화
  logType: 3, // 자세한 로깅 활성화
  debug: true
};

const nms = new NodeMediaServer(config);
const app = express();
const PORT = 3001;

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

function validateStreamKey(streamKey) {
  return VALID_STREAM_KEYS.has(streamKey);
}

function getStreamKeyFromPath(streamPath) {
  const parts = streamPath.split("/");
  return parts[parts.length - 1];
}

nms.on("postPublish", (id, StreamPath) => {
  const streamKey = getStreamKeyFromPath(StreamPath);
  if (streamKey) {
    activeStreams.set(streamKey, { status: "live", startTime: new Date() });
    console.log(`[postPublish] ${streamKey} 방송 시작`);
  }
});

nms.on("donePublish", async (id, StreamPath) => {
  const streamKey = getStreamKeyFromPath(StreamPath);
  if (streamKey) {
    activeStreams.delete(streamKey);
    VALID_STREAM_KEYS.delete(streamKey);
    console.log(`[donePublish] ${streamKey} 방송 종료`);
    try {
      await axios.post("http://13.209.42.36/stream_ended", { streamKey });
    } catch (error) {
      console.error("[donePublish] Failed to notify stream end:", error);
    }
  }
});

nms.on("prePublish", (id, StreamPath) => {
  const streamKey = getStreamKeyFromPath(StreamPath);
  if (!streamKey || !validateStreamKey(streamKey)) {
    nms.getSession(id).reject();
    console.log("[prePublish] Invalid StreamKey:", streamKey);
  }
});

// 오류 이벤트 핸들러 추가
nms.on('error', (err) => {
  console.error('Node Media Server Error:', err);
});

app.get("/streams", (req, res) => {
  res.json({ activeStreams: Array.from(activeStreams.entries()).map(([streamKey, info]) => ({ streamKey, ...info })) });
});

app.post("/stream-key", (req, res) => {
  const { streamKey } = req.body;
  if (!streamKey) return res.status(400).json({ error: "streamKey를 제공해야 합니다." });
  if (VALID_STREAM_KEYS.has(streamKey)) return res.status(400).json({ error: "이미 존재하는 스트리밍 키입니다." });
  VALID_STREAM_KEYS.add(streamKey);
  res.status(201).json({ message: "스트리밍 키 추가 완료.", streamKey });
});

app.get("/stream-keys", (req, res) => {
  res.json({ streamKeys: Array.from(VALID_STREAM_KEYS) });
});

// 메모리 사용량 모니터링
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`Memory usage: RSS ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap Used ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
}, 30000);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
});

// SIGTERM 및 SIGINT 핸들러 추가 (정상 종료 유도)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  nms.stop();
  app.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  nms.stop();
  app.close();
  process.exit(0);
});

try {
  nms.run();
  console.log("미디어 서버가 시작되었습니다.");
  console.log("RTMP 서버: rtmp://localhost:1935/live");
  console.log("HTTP 서버: http://localhost:8000/live");
  console.log("허용된 스트림 키:", Array.from(VALID_STREAM_KEYS));

  const server = app.listen(PORT, () => {
    console.log(`Express 서버가 ${PORT} 포트에서 실행 중입니다.`);
  });

  // 연결 제한시간 및 헤더 사이즈 설정
  server.timeout = 120000; // 2분
  server.maxHeadersCount = 100;
} catch (error) {
  console.error('서버 시작 오류:', error);
}
