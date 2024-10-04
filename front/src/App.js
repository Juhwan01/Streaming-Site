import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Login from './components/Login';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import UserProfile from './components/UserProfile';

export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserInfo(token);
      fetchRooms();
    }
  }, [token]);

  useEffect(() => {
    if (selectedRoom && user) {
      connectToRoom(selectedRoom);
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [selectedRoom, user]);

  const fetchUserInfo = async (currentToken) => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      console.log('User info received:', response.data);  // 이 부분을 통해 실제 데이터 구조 확인
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/get_rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8000/login', 
        `username=${username}&password=${password}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      await fetchUserInfo(newToken);  // 로그인 성공 후 즉시 사용자 정보 가져오기
    } catch (error) {
      console.error('Login failed:', error);
      // 에러 처리
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setSelectedRoom(null);
    setMessages([]);
    if (wsRef.current) wsRef.current.close();
  };

  const createRoom = async (roomName) => {
    try {
      await axios.post('http://localhost:8000/create_room', { name: roomName });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
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
      wsRef.current.send(JSON.stringify({ type: 'join', username: user.username }));
    };
  };

  const sendMessage = (message) => {
    if (wsRef.current) {
      const messageData = {
        type: 'message',
        username: user.username,
        message: message,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(messageData));
    }
  };

  const handleTopup = async (amount) => {
    try {
      const response = await axios.post('http://localhost:8000/charge', { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, balance: response.data.new_balance });
    } catch (error) {
      console.error('Topup failed:', error);
      alert('Topup failed. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }
  
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="grid grid-cols-4 h-screen bg-gray-50">
      <div className="col-span-1 bg-white border-r border-gray-200">
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
          onCreateRoom={createRoom}
        />
        {isLoading ? (
          <div>Loading user profile...</div>
        ) : user ? (
          <UserProfile user={user} onTopup={handleTopup} onLogout={handleLogout} />
        ) : (
          <div>Failed to load user profile</div>
        )}
      </div>
      <div className="col-span-3">
        {selectedRoom ? (
          <ChatRoom
            roomName={selectedRoom}
            username={user?.username}
            messages={messages}
            onSendMessage={sendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xl text-gray-500">
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  );
}