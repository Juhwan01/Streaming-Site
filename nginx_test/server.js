const express = require('express');
const NodeMediaServer = require('node-media-server');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// 허용된 스트리밍 키 목록
const VALID_STREAM_KEYS = new Set([
  'stream-key-1',
  'stream-key-2',
  'test-key'
]);

// 스트리밍 상태 저장
const activeStreams = new Map();

// NodeMediaServer 설정
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*'
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeep: true,
        dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
        dashKeep: true,
        rtmp: true,
        rtmpApp: 'live_rtmp'
      }
    ]
  },
  auth: {
    api: true,
    api_user: 'admin',
    api_pass: 'admin123'
  }
};

const nms = new NodeMediaServer(config);

// Express 앱 설정
const app = express();
const PORT = 3001;
app.use(cors({
  origin: '*',  // 모든 도메인에서 요청을 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 허용할 HTTP 메서드 설정
  allowedHeaders: ['Content-Type', 'Authorization'],  // 허용할 헤더 설정
}));
// JSON 요청 본문 처리 미들웨어
app.use(express.json());

// 스트리밍 키 검증 함수
function validateStreamKey(streamKey) {
  return VALID_STREAM_KEYS.has(streamKey);
}

// 스트림 경로에서 키 추출 함수
function getStreamKeyFromPath(streamPath) {
  const parts = streamPath.split('/');
  return parts[parts.length - 1];
}

// 스트리밍 시작 이벤트
nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[postPublish] StreamPath:', StreamPath);
  const streamKey = getStreamKeyFromPath(StreamPath);

  if (streamKey) {
    // 스트리밍 상태 초기화
    activeStreams.set(streamKey, { status: 'live', startTime: new Date() });
    console.log(`[postPublish] ${streamKey} 방송 시작`);
  } else {
    console.error('[postPublish] Invalid StreamKey for StreamPath:', StreamPath);
  }
});

// 스트리밍 종료 이벤트
nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[donePublish] StreamPath:', StreamPath);
  const streamKey = getStreamKeyFromPath(StreamPath);

  if (streamKey) {
    activeStreams.delete(streamKey);
    console.log(`[donePublish] ${streamKey} 방송 종료`);
  } else {
    console.error('[donePublish] Invalid StreamKey for StreamPath:', StreamPath);
  }
});

// 스트리밍 시작 전 인증
nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[prePublish] StreamPath:', StreamPath);
  const streamKey = getStreamKeyFromPath(StreamPath);

  if (!streamKey || !validateStreamKey(streamKey)) {
    const session = nms.getSession(id);
    session.reject();
    console.log('[prePublish] Invalid StreamKey:', streamKey);
  } else {
    console.log('[prePublish] Valid StreamKey:', streamKey);
  }
});

// 현재 스트리밍 상태를 반환하는 API
app.get('/streams', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([streamKey, info]) => {
    const { status, startTime } = info;
    return {
      streamKey,
      status, // 방송 상태
      startTime // 방송 시작 시간
    };
  });

  res.json({ activeStreams: streams });
});

// 스트리밍 키 추가 API
app.post('/stream-key', (req, res) => {
  const { streamKey } = req.body;
  if (!streamKey) {
    return res.status(400).json({ error: 'streamKey를 제공해야 합니다.' });
  }

  if (VALID_STREAM_KEYS.has(streamKey)) {
    return res.status(400).json({ error: '이미 존재하는 스트리밍 키입니다.' });
  }

  VALID_STREAM_KEYS.add(streamKey);
  console.log(`[stream-key] 새로운 스트리밍 키 추가: ${streamKey}`);
  res.status(201).json({ message: '스트리밍 키가 성공적으로 추가되었습니다.', streamKey });
});

// Express 라우팅 예시
app.get('/', (req, res) => {
  res.send('미디어 서버에 오신 것을 환영합니다!');
});

// 서버 시작
nms.run();
app.listen(PORT, () => {
  console.log(`Express 서버가 ${PORT} 포트에서 실행 중입니다.`);
});
console.log('미디어 서버가 시작되었습니다.');
console.log('RTMP 서버: rtmp://localhost:1935/live');
console.log('HTTP 서버: http://localhost:8000/live');
console.log('허용된 스트림 키:', Array.from(VALID_STREAM_KEYS));