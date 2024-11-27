'use client';

import React, { useEffect, useRef, useState, Suspense } from "react";
import Hls from "hls.js";
import Header from "@/components/Header";
import { MessageSquare, Users, Share2, Heart, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

const apiInstance = axios.create({
  baseURL: '/api'  // 수정된 부분
});

const WS_URL = process.env.NODE_ENV === 'production' 
  ? `wss://${window.location.host}/socket`
  : 'ws://3.36.103.8:8001';

// 기존 컴포넌트들은 그대로 유지
const TagButton = ({ tags }) => {
  return (
    <div className="min-w-20 max-w-40 h-1/2 flex items-center justify-center bg-slate-700 rounded-2xl ml-5 p-2 text-white text-xl">
      <span className="text-sm">{tags}</span>
    </div>
  );
};

const BroadcastPlayer = ({ streamUrl }) => {
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
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
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

const ChatMessage = ({ username, message, timestamp, isCurrentUser, filterResult }) => {
  const renderMessage = (msg, filter) => {
    if (filter && filter.category === '악플/욕설') {
      return '채팅이 관리자에 의해 가려졌습니다';
    }
    return msg;
  };

  return (
    <div className={`px-4 py-2 hover:bg-gray-700 transition-colors ${isCurrentUser ? 'bg-gray-700' : ''}`}>
      <span className={`${isCurrentUser ? 'text-blue-400' : 'text-purple-400'} font-medium`}>
        {username}
      </span>
      <span className={`text-gray-300 ml-2 ${filterResult ? 'text-red-500' : ''}`}>
        {renderMessage(message, filterResult)}
      </span>
      {timestamp && (
        <span className="text-xs text-gray-500 ml-2">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

const DonationModal = ({ isOpen, onClose, onDonate, onCharge, currentBalance, donationAmount, setDonationAmount, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">후원하기</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">현재 잔액</p>
            <p className="text-white text-xl font-bold">
              ₩{parseFloat(currentBalance || 0).toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              금액
            </label>
            <input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="금액을 입력하세요"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={onDonate}
            disabled={loading}
            className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리중...' : '후원하기'}
          </button>
          
          <button
            onClick={onCharge}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리중...' : '충전하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 새로운 BroadcastContent 컴포넌트
const BroadcastContent = () => {
  const searchParams = useSearchParams();
  const streamId = searchParams.get("streamId");
  const title = searchParams.get("title");
  const nickname = searchParams.get("nickname");
  const profilePic = searchParams.get("profilePic");
  
  const [viewerCount, setViewerCount] = useState(1234);
  const [isLiked, setIsLiked] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const streamUrl = `/stream/live/${streamId}/index.m3u8`;  // 수정된 부분

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCharge = () => {
    if (!donationAmount || isNaN(donationAmount) || donationAmount <= 0) {
      alert('올바른 충전 금액을 입력해주세요.');
      return;
    }

    setLoading(true);

    const { IMP } = window;
    IMP.init('imp80571156');

    IMP.request_pay(
      {
        pg: 'kakaopay',
        pay_method: 'card',
        merchant_uid: `charge_${new Date().getTime()}`,
        name: '계정 충전',
        amount: parseInt(donationAmount),
        buyer_email: user?.email || '',
        buyer_name: user?.full_name || user?.username || '',
        buyer_tel: '010-1234-5678',
      },
      async (rsp) => {
        if (rsp.success) {
          try {
            const token = localStorage.getItem('token');
            const response = await apiInstance.post('/charge', {
              amount: rsp.paid_amount,
              imp_uid: rsp.imp_uid,
              merchant_uid: rsp.merchant_uid
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const userResponse = await apiInstance.get('/users/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUser(userResponse.data);
            
            alert('충전이 완료되었습니다!');
            setDonationAmount('');
            setIsModalOpen(false);
          } catch (error) {
            console.error('충전 처리 실패:', error);
            alert('충전 처리 중 오류가 발생했습니다.');
          }
        }
        setLoading(false);
      }
    );
  };

  const handleDonation = async () => {
    if (!donationAmount || isNaN(donationAmount) || donationAmount <= 0) {
      alert('올바른 후원 금액을 입력해주세요.');
      return;
    }
  
    const currentBalance = user.account?.balance || 0;
    if (parseInt(donationAmount) > currentBalance) {
      alert(`잔액이 부족합니다. 현재 잔액: ₩${parseFloat(currentBalance).toLocaleString()}`);
      return;
    }
  
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      
      const withdrawResponse = await apiInstance.post('/withdraw', {
        amount: parseInt(donationAmount)
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (withdrawResponse.data && withdrawResponse.data.new_balance !== undefined) {
        setUser(prevUser => ({
          ...prevUser,
          account: {
            ...prevUser.account,
            balance: withdrawResponse.data.new_balance
          }
        }));
  
        if (wsRef.current) {
          const donationMessage = {
            type: 'message',
            username: user.username,
            message: `${donationAmount}원 후원하셨습니다!`,
            timestamp: new Date().toISOString(),
          };
          wsRef.current.send(JSON.stringify(donationMessage));
        }
        
        alert('후원이 완료되었습니다!');
        setDonationAmount('');
        setIsModalOpen(false);
      } else {
        throw new Error('잔액 차감에 실패했습니다.');
      }
    } catch (error) {
      console.error('후원 처리 실패:', error);
      alert('후원 처리 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await apiInstance.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const connectToChat = async () => {
      if (!user || !streamId) return;

      try {
        await apiInstance.post('/create_room', { name: streamId });
      } catch (error) {
        console.log('Room might already exist:', error);
      }

      // WebSocket URL을 환경에 따라 동적으로 설정
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsPath = process.env.NODE_ENV === 'production'
        ? `${wsProtocol}//${window.location.host}/socket/ws/${streamId}`
        : `${WS_URL}/ws/${streamId}`;

      wsRef.current = new WebSocket(wsPath);

      // WebSocket이 연결되면 실행
      wsRef.current.onopen = () => {
        console.log('WebSocket Connected');
        // 연결 후 조인 메시지 전송
        wsRef.current.send(JSON.stringify({
          type: 'join',
          username: user.username
        }));
      };

      // 메시지 수신 시 실행
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };

      // 에러 발생 시 실행
      wsRef.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        // 에러 발생 시 재연결 시도
        setTimeout(connectToChat, 3000);
      };

      // 연결이 닫힐 때 실행
      wsRef.current.onclose = () => {
        console.log('WebSocket Closed');
        // 연결이 끊어졌을 때 재연결 시도
        setTimeout(connectToChat, 3000);
      };
    };

    connectToChat();

    // 컴포넌트 언마운트 시 WebSocket 연결 종료
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, streamId]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !user) return;

    const messageData = {
      type: 'message',
      username: user.username,
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    wsRef.current.send(JSON.stringify(messageData));
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative rounded-lg overflow-hidden bg-gray-800">
              <BroadcastPlayer streamUrl={streamUrl} />
            </div>

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
                  <div className="flex text-white">
                    <TagButton tags="#롤방송" />
                    <TagButton tags="#롤방송" />
                    <TagButton tags="#롤방송" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (!user) {
                        alert('로그인이 필요합니다.');
                        return;
                      }
                      setIsModalOpen(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                  >
                    <span className="text-white">후원하기</span>
                  </button>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                      isLiked ? "bg-red-600" : "bg-gray-700"
                    } hover:bg-red-700 transition-colors`}
                  >
                    <Heart className={isLiked ? "fill-current" : ""} size={20} />
                    <span className="text-white">좋아요</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                    <Share2 size={20} />
                    <span className="text-white">공유</span>
                  </button>
                </div>
              </div>
              <p className="mt-4 text-white">{title}</p>
              <div className="mt-4 flex items-center space-x-4 text-gray-400">
                <div className="">[테스터] 감기 조심 하십쇼 여러분</div>
                <div className="flex items-center">
                  <Users size={18} className="mr-2" />
                  <span>{viewerCount.toLocaleString()} 시청자</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg h-[calc(100vh-200px)] flex flex-col border">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center">
                    <MessageSquare size={18} className="mr-2" />
                    실시간 채팅
                  </h2>
                  <span className="text-gray-400 text-sm">
                    {viewerCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    username={msg.username}
                    message={msg.message}
                    timestamp={msg.timestamp}
                    isCurrentUser={user && msg.username === user.username}
                    filterResult={msg.filter_result}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {user ? (
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="메시지 보내기..."
                      className="flex-1 px-4 py-2 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white focus:outline-none"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-700 text-center text-gray-400">
                  채팅에 참여하려면 로그인이 필요합니다
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {user && (
        <DonationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDonationAmount('');
          }}
          onDonate={handleDonation}
          onCharge={handleCharge}
          currentBalance={user?.account?.balance || 0}
          donationAmount={donationAmount}
          setDonationAmount={setDonationAmount}
          loading={loading}
        />
      )}
    </div>
  );
};

// 메인 Broadcast 컴포넌트
const Broadcast = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <BroadcastContent />
    </Suspense>
  );
};

export default Broadcast;