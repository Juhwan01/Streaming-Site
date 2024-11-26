'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Header from '@/components/Header';
import { MessageSquare, Users, Share2, Heart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const TagButton = ({ tags }) => {
  return (
    <div className="min-w-20 max-w-40 h-1/2 flex items-center justify-center bg-slate-700 rounded-2xl ml-5 p-2 text-white text-xl">
      <span className="text-sm">{tags}</span>
    </div>
  );
};

const BroadcastPlayer = ({ streamUrl }) => {
  // BroadcastPlayer 컴포넌트 코드는 동일
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        hlsRef.current = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current.loadSource(streamUrl);
        hlsRef.current.attachMedia(videoRef.current);
        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current.play().catch((error) => {
            console.log("Auto-play failed:", error);
          });
        });

        hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hlsRef.current.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsRef.current.recoverMediaError();
                break;
              default:
                hlsRef.current.destroy();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
      }
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full h-full rounded-lg object-cover border"
      playsInline
    />
  );
};

const ChatMessage = ({ username, message }) => (
  <div className="px-4 py-2 hover:bg-gray-800 transition-colors">
    <span className="text-purple-400 font-medium">{username}</span>
    <span className="text-gray-300 ml-2">{message}</span>
  </div>
);

const Broadcast = () => {
  // URL 쿼리 파라미터에서 데이터 가져오기
  const searchParams = useSearchParams();
  const streamId = searchParams.get('streamId');
  const title = searchParams.get('title');
  const nickname = searchParams.get('nickname');
  const profilePic = searchParams.get('profilePic');

  const streamUrl = `http://localhost:8000/live/${streamId}/index.m3u8`;
  const [viewerCount, setViewerCount] = useState(1234);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="relative rounded-lg overflow-hidden bg-gray-800">
              <BroadcastPlayer streamUrl={streamUrl} />
            </div>
            
            {/* Streamer Info */}
            <div className="mt-5 bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-purple-600 overflow-hidden">
                    <img
                      src={profilePic || "/api/placeholder/64/64"}
                      alt={nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{nickname}</h1>
                    <p className="text-gray-400">Stream ID: {streamId}</p>
                  </div>
                  <div className='flex text-white'>
                    <TagButton tags="#롤방송"/>
                    <TagButton tags="#롤방송"/>
                    <TagButton tags="#롤방송"/>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                      isLiked ? 'bg-red-600' : 'bg-gray-700'
                    } hover:bg-red-700 transition-colors`}
                  >
                    <Heart className={isLiked ? 'fill-current' : ''} size={20} />
                    <span className="text-white">좋아요</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                    <Share2 size={20} />
                    <span className="text-white">공유</span>
                  </button>
                </div>
              </div>
              <p className="mt-4 text-white">
                {title}
              </p>
              <div className="mt-4 flex items-center space-x-4 text-gray-400">
                <div className=''>[테스터] 감기 조심 하십쇼 여러분</div>
                <div className="flex items-center ">
                  <Users size={18} className="mr-2" />
                  <span>{viewerCount.toLocaleString()} 시청자</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1 ">
            <div className="bg-gray-800 rounded-lg h-full flex flex-col border">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center">
                    <MessageSquare size={18} className="mr-2" />
                    실시간 채팅
                  </h2>
                  <span className="text-gray-400 text-sm">{viewerCount.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <ChatMessage username="User123" message="안녕하세요!" />
                <ChatMessage username="Gamer456" message="브론즈 화이팅입니다!" />
                <ChatMessage username="Stream789" message="오늘도 재미있는 방송 감사합니다 ㅎㅎ" />
              </div>
              <div className="p-4 border-t border-gray-700">
                <input
                  type="text"
                  placeholder="메시지 보내기..."
                  className="w-full px-4 py-2 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Broadcast;