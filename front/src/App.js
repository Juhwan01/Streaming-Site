import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Users, PlusCircle, User } from 'lucide-react';
import dayjs from 'dayjs';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (selectedRoom && username) {
      connectToRoom(selectedRoom);
    }
  }, [selectedRoom, username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/get_rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createRoom = async () => {
    if (newRoomName.trim()) {
      try {
        await axios.post('http://localhost:8000/create_room', { name: newRoomName });
        setNewRoomName('');
        fetchRooms();
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  };

  const connectToRoom = (roomName) => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = new WebSocket(`ws://localhost:8000/ws/${roomName}`);
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };
    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'join', username }));
    };
  };

  const sendMessage = () => {
    if (input.trim() && wsRef.current) {
      const message = {
        type: 'message',
        username: username,
        message: input,
        timestamp: dayjs().format('HH:mm'),
      };
      wsRef.current.send(JSON.stringify(message));
      setInput('');
    }
  };

  const renderMessage = (msg) => {
    if (msg.filter_result && msg.filter_result.category === '악플/욕설') {
      return '채팅이 관리자에 의해 가려졌습니다';
    }
    return msg.message;
  };

  const handleSetUsername = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
    }
  };

  const renderTime = (timestamp) => {
    return timestamp ? (
      <span className="text-xs text-gray-400 ml-2">{timestamp}</span>
    ) : null;
  };

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
        <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">Welcome to Chat App</h1>
          <input
            type="text"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
            placeholder="Enter your nickname"
            className="w-full px-4 py-3 mb-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSetUsername}
            className="w-full px-4 py-3 text-lg text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Set Nickname
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 h-screen bg-gray-50">
      <div className="col-span-1 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Rooms</h2>
        <div className="mb-4">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="New room name"
            className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createRoom}
            className="w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <PlusCircle className="mr-2" size={18} />
            Create Room
          </button>
        </div>
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                selectedRoom === room ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <Users className="mr-2" size={18} />
                {room}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-3 flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto bg-white shadow-inner">
          {selectedRoom ? (
            <>
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">Room: {selectedRoom}</h2>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xl text-gray-500">
              Select a room to start chatting
            </div>
          )}
        </div>
        {selectedRoom && (
          <div className="p-6 bg-gray-100 border-t border-gray-300">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 mr-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-3 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
