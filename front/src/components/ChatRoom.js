import React, { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import dayjs from 'dayjs';

const ChatRoom = ({ roomName, username, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const renderMessage = (msg) => {
    if (msg.filter_result && msg.filter_result.category === '악플/욕설') {
      return '채팅이 관리자에 의해 가려졌습니다';
    }
    return msg.message;
  };

  const renderTime = (timestamp) => {
    return timestamp ? (
      <span className="text-xs text-gray-400 ml-2">{timestamp}</span>
    ) : null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto bg-white shadow-inner">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">Room: {roomName}</h2>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-md max-w-[75%] ${
                msg.username === username ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
              } ${msg.type === 'system' ? 'bg-yellow-100 text-center' : ''}`}
            >
              {msg.type !== 'system' && (
                <div className="flex items-center">
                  <User className="text-gray-500 mr-2" size={16} />
                  <p className="text-sm font-semibold text-gray-600">
                    {msg.username} {renderTime(msg.timestamp)}
                  </p>
                </div>
              )}
              <p
                className={`mt-2 ${
                  msg.filter_result && msg.filter_result.category === '악플/욕설'
                    ? 'text-red-500'
                    : 'text-gray-700'
                }`}
              >
                {renderMessage(msg)}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-6 bg-gray-100 border-t border-gray-300">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 mr-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-3 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;